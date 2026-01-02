import { sheets } from "./utils";

// Types
type Supply = {
  name: string;
  units: number;
  cost: number;
};

type Labor = {
  name: string;
  hours: number;
  ratePerHour: number;
};

type MiscExpense = {
  name: string;
  units: number;
  cost: number;
};

type Payment = {
  time: string;
  amount: number;
};

type Project = {
  id: string;
  title: string;
  description: string;
  visitDate: string;
  startDate: string;
  endDate: string;
  address: string;
  meters: number | null;
  price: number;
  supplies: Supply[];
  labors: Labor[];
  misc: MiscExpense[];
  payments: Payment[];
};

// Helper to parse currency strings like "$1,200.00" or "$(600.00)" or "(600.00)"
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[$,\s]/g, "");
  const isNegative = cleaned.includes("(") && cleaned.includes(")");
  const numStr = cleaned.replace(/[()]/g, "");
  const value = parseFloat(numStr) || 0;
  return isNegative ? -value : value;
}

// Helper to parse numeric values (for meters, units, hours)
function parseNumber(value: string | number): number | null {
  if (!value) return null;
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

export async function getProjects(): Promise<Project[]> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  try {
    // Fetch all 5 sheets in a single batch request
    const response = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges: [
        "jobs",
        "job_supplies",
        "job_labors",
        "job_misc",
        "job_payments",
      ],
    });

    const valueRanges = response.data.valueRanges;
    if (!valueRanges || valueRanges.length < 5) {
      throw new Error("Could not fetch all required sheets");
    }

    const jobsRows = valueRanges[0].values || [];
    const suppliesRows = valueRanges[1].values || [];
    const laborsRows = valueRanges[2].values || [];
    const miscRows = valueRanges[3].values || [];
    const paymentsRows = valueRanges[4].values || [];

    // Parse jobs sheet (main project data)
    // Columns: A: ID, B: Title, C: Description, D: Visit date, E: Start date, F: End date, G: Address, H: Meters, I: Price
    const projects: Project[] = [];
    if (jobsRows.length > 1) {
      const dataRows = jobsRows.slice(1);
      for (const row of dataRows) {
        projects.push({
          id: row[0] || "",
          title: row[1] || "",
          description: row[2] || "",
          visitDate: row[3] || "",
          startDate: row[4] || "",
          endDate: row[5] || "",
          address: row[6] || "",
          meters: parseNumber(row[7]),
          price: parseAmount(row[8]),
          supplies: [],
          labors: [],
          misc: [],
          payments: [],
        });
      }
    }

    // Parse job_supplies sheet
    // Columns: A: Job, B: Name, C: Units, D: Cost
    const suppliesByJob = new Map<string, Supply[]>();
    if (suppliesRows.length > 1) {
      const dataRows = suppliesRows.slice(1);
      for (const row of dataRows) {
        const jobId = row[0] || "";
        if (!jobId) continue;

        if (!suppliesByJob.has(jobId)) {
          suppliesByJob.set(jobId, []);
        }

        suppliesByJob.get(jobId)!.push({
          name: row[1] || "",
          units: parseNumber(row[2]) || 0,
          cost: parseAmount(row[3]),
        });
      }
    }

    // Parse job_labors sheet
    // Columns: A: Job, B: Name, C: Hours, D: Rate per hour
    const laborsByJob = new Map<string, Labor[]>();
    if (laborsRows.length > 1) {
      const dataRows = laborsRows.slice(1);
      for (const row of dataRows) {
        const jobId = row[0] || "";
        if (!jobId) continue;

        if (!laborsByJob.has(jobId)) {
          laborsByJob.set(jobId, []);
        }

        laborsByJob.get(jobId)!.push({
          name: row[1] || "",
          hours: parseNumber(row[2]) || 0,
          ratePerHour: parseAmount(row[3]),
        });
      }
    }

    // Parse job_misc sheet
    // Columns: A: Job, B: Name, C: Units, D: Cost
    const miscByJob = new Map<string, MiscExpense[]>();
    if (miscRows.length > 1) {
      const dataRows = miscRows.slice(1);
      for (const row of dataRows) {
        const jobId = row[0] || "";
        if (!jobId) continue;

        if (!miscByJob.has(jobId)) {
          miscByJob.set(jobId, []);
        }

        miscByJob.get(jobId)!.push({
          name: row[1] || "",
          units: parseNumber(row[2]) || 0,
          cost: parseAmount(row[3]),
        });
      }
    }

    // Parse job_payments sheet
    // Columns: A: Job, B: Time, C: Amount
    const paymentsByJob = new Map<string, Payment[]>();
    if (paymentsRows.length > 1) {
      const dataRows = paymentsRows.slice(1);
      for (const row of dataRows) {
        const jobId = row[0] || "";
        if (!jobId) continue;

        if (!paymentsByJob.has(jobId)) {
          paymentsByJob.set(jobId, []);
        }

        paymentsByJob.get(jobId)!.push({
          time: row[1] || "",
          amount: parseAmount(row[2]),
        });
      }
    }

    // Attach related items to each project
    for (const project of projects) {
      project.supplies = suppliesByJob.get(project.id) || [];
      project.labors = laborsByJob.get(project.id) || [];
      project.misc = miscByJob.get(project.id) || [];
      project.payments = paymentsByJob.get(project.id) || [];
    }

    // Output results
    console.log("\n=== PROJECTS ===");
    console.log(`Total: ${projects.length}`);
    const projectDisplay = projects.map((p) => ({
      id: p.id,
      title: p.title,
      address: p.address,
      price: p.price,
      suppliesCount: p.supplies.length,
      laborsCount: p.labors.length,
      miscCount: p.misc.length,
      paymentsCount: p.payments.length,
    }));
    console.table(projectDisplay);

    // Summary
    console.log("\n=== SUMMARY ===");
    console.log(`Total projects: ${projects.length}`);
    const totalSupplies = projects.reduce(
      (sum, p) => sum + p.supplies.length,
      0
    );
    const totalLabors = projects.reduce((sum, p) => sum + p.labors.length, 0);
    const totalMisc = projects.reduce((sum, p) => sum + p.misc.length, 0);
    const totalPayments = projects.reduce(
      (sum, p) => sum + p.payments.length,
      0
    );
    console.log(`Total supplies entries: ${totalSupplies}`);
    console.log(`Total labor entries: ${totalLabors}`);
    console.log(`Total misc entries: ${totalMisc}`);
    console.log(`Total payment entries: ${totalPayments}`);

    return projects;
  } catch (err) {
    console.error("The API returned an error:", err);
    return [];
  }
}

// Dummy data matching the Google Sheets general report structure
// All amounts are in cents

export const dashboardData = {
  dateRange: {
    from: new Date("2025-11-01"),
    to: new Date("2025-11-30"),
  },
  overview: {
    revenue: 2228450, // $22,284.50
    cost: -2564944, // ($25,649.44)
    operatingProfit: -336494, // ($3,364.94)
    taxesRefund: 0,
    netProfit: -336494, // ($3,364.94)
  },
  breakdown: {
    projectsIn: 2133450, // $21,334.50
    projectsOut: -1425786, // ($14,257.86)
    projects: 707664, // $7,076.64
    assets: 0,
    contingencies: -966058, // ($9,660.58)
    unspecified: 0,
  },
  insights: {
    tollCost: -15054, // ($150.54)
    loansAllTime: -455929, // ($4,559.29)
    budget: -1061058, // ($10,610.58)
  },
  projectStats: {
    averageProfit: 45.74,
    medianProfit: 64.12,
    minProfit: -135.71,
    maxProfit: 82.86,
  },
  budgetSpending: [
    {
      category: "subscription",
      allocated: 120607, // $1,206.07
      spent: -120607, // -$1,206.07
      remaining: 0,
      remainingPercent: 0.0,
    },
    {
      category: "consumable",
      allocated: 30000, // $300.00
      spent: -31994, // -$319.94
      remaining: -1994, // -$19.94
      remainingPercent: -6.65,
    },
    {
      category: "toll",
      allocated: 5000, // $50.00
      spent: -15054, // -$150.54
      remaining: -10054, // -$100.54
      remainingPercent: -201.08,
    },
    {
      category: "tool",
      allocated: 200000, // $2,000.00
      spent: -92538, // -$925.38
      remaining: 107462, // $1,074.62
      remainingPercent: 53.73,
    },
    {
      category: "food",
      allocated: 30000, // $300.00
      spent: -19863, // -$198.63
      remaining: 10137, // $101.37
      remainingPercent: 33.79,
    },
    {
      category: "salary",
      allocated: 866660, // $8,666.60
      spent: -645105, // -$6,451.05
      remaining: 221555, // $2,215.55
      remainingPercent: 25.56,
    },
    {
      category: "fuel",
      allocated: 65000, // $650.00
      spent: -55052, // -$550.52
      remaining: 9948, // $99.48
      remainingPercent: 15.3,
    },
  ],
  projectsChartData: [
    { name: "Projects (in)", value: 2133450 },
    { name: "Projects (out)", value: -1425786 },
  ],
  expensesChartData: [{ name: "Contingencies", value: 966058, percent: 100.0 }],
  jobsProfitData: [
    { name: "Job 1", profit: 65.5 },
    { name: "Job 2", profit: 72.3 },
    { name: "Job 3", profit: -125.0 },
    { name: "Job 4", profit: 48.2 },
    { name: "Job 5", profit: 82.86 },
    { name: "Job 6", profit: 55.1 },
    { name: "Job 7", profit: 68.9 },
    { name: "Job 8", profit: 45.3 },
    { name: "Job 9", profit: 70.2 },
  ],
  // Period Comparison (this period vs previous period)
  periodComparison: {
    revenue: { current: 2228450, previous: 1985000, change: 12.25 },
    cost: { current: -2564944, previous: -2450000, change: -4.69 },
    operatingProfit: { current: -336494, previous: -465000, change: 27.64 },
    netProfit: { current: -336494, previous: -465000, change: 27.64 },
  },
  // Cash Flow Timeline (last 6 months)
  cashFlowData: [
    { month: "Jun", income: 1850000, expenses: -2100000 },
    { month: "Jul", income: 1950000, expenses: -2200000 },
    { month: "Aug", income: 2100000, expenses: -2350000 },
    { month: "Sep", income: 2050000, expenses: -2400000 },
    { month: "Oct", income: 1985000, expenses: -2450000 },
    { month: "Nov", income: 2228450, expenses: -2564944 },
  ],
  // Outstanding Receivables
  receivables: {
    total: 875000, // $8,750.00
    overdue: 425000, // $4,250.00
    overdueCount: 3,
    averageDaysOutstanding: 28,
    breakdown: [
      {
        project: "PROJ-001",
        client: "ABC Corp",
        amount: 350000,
        daysOverdue: 15,
      },
      {
        project: "PROJ-003",
        client: "XYZ Ltd",
        amount: 275000,
        daysOverdue: 8,
      },
      {
        project: "PROJ-007",
        client: "Tech Inc",
        amount: 250000,
        daysOverdue: 0,
      },
    ],
  },
  // Project Health Alerts
  projectAlerts: [
    {
      type: "negativeProfit",
      severity: "high",
      project: "PROJ-003",
      client: "XYZ Ltd",
      message: "Project has -125% profit margin",
    } as const,
    {
      type: "overduePayment",
      severity: "high",
      project: "PROJ-001",
      client: "ABC Corp",
      message: "Payment overdue by 15 days",
    } as const,
    {
      type: "delayed",
      severity: "medium",
      project: "PROJ-005",
      client: "Build Co",
      message: "Project delayed by 8 days",
    } as const,
    {
      type: "budgetOverrun",
      severity: "medium",
      project: "PROJ-002",
      client: "Design Studio",
      message: "Budget exceeded by 12%",
    } as const,
  ],
  // Top/Bottom Performers
  topPerformers: [
    {
      project: "PROJ-005",
      client: "Build Co",
      profitMargin: 82.86,
      revenue: 450000,
    },
    {
      project: "PROJ-002",
      client: "Design Studio",
      profitMargin: 72.3,
      revenue: 380000,
    },
    {
      project: "PROJ-001",
      client: "ABC Corp",
      profitMargin: 68.9,
      revenue: 350000,
    },
  ],
  bottomPerformers: [
    {
      project: "PROJ-003",
      client: "XYZ Ltd",
      profitMargin: -135.71,
      revenue: 275000,
    },
    {
      project: "PROJ-004",
      client: "Retail Group",
      profitMargin: -45.2,
      revenue: 220000,
    },
    {
      project: "PROJ-006",
      client: "Local Shop",
      profitMargin: -12.5,
      revenue: 150000,
    },
  ],
  // Budget Burn Rate
  budgetBurnRate: {
    monthlySpend: 980213, // $9,802.13
    allocated: 1317267, // $13,172.67
    daysRemaining: 15,
    projectedOverspend: false,
    burnRate: 65347, // $653.47 per day
  },
  // Revenue Trends (last 6 months)
  revenueTrends: [
    { month: "Jun", revenue: 1850000 },
    { month: "Jul", revenue: 1950000 },
    { month: "Aug", revenue: 2100000 },
    { month: "Sep", revenue: 2050000 },
    { month: "Oct", revenue: 1985000 },
    { month: "Nov", revenue: 2228450 },
  ],
  // Payment Status
  paymentStatus: {
    averagePaymentDays: 18,
    onTimePayments: 12,
    latePayments: 3,
    overduePayments: 3,
    paymentVelocity: 85.7, // percentage
  },
  // Project Pipeline
  projectPipeline: {
    planning: 4,
    inProgress: 6,
    totalValue: 2450000, // $24,500.00
    upcomingProjects: [
      {
        project: "PROJ-010",
        client: "New Client A",
        value: 650000,
        startDate: "2025-12-05",
      },
      {
        project: "PROJ-011",
        client: "New Client B",
        value: 480000,
        startDate: "2025-12-10",
      },
      {
        project: "PROJ-012",
        client: "Existing Client",
        value: 320000,
        startDate: "2025-12-15",
      },
    ],
  },
  // Efficiency Metrics
  efficiencyMetrics: {
    revenuePerProject: 247605, // $2,476.05
    costPerProject: 284994, // $2,849.94
    averageProjectValue: 350000, // $3,500.00
    projectsCompleted: 9,
    totalProjects: 15,
    completionRate: 60.0,
  },
};

// Helper function to format cents to dollars
export const formatCurrency = (cents: number): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
};

// Helper function to format percentage
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? "" : ""}${value.toFixed(2)}%`;
};

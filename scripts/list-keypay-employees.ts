import { keypayClient } from "@/features/payroll/lib/keypay-client";

const employees = await keypayClient.listEmployees();

console.log(JSON.stringify(employees, null, 2));

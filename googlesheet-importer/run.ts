import { getProjects } from "./projects";
import { getTransactions } from "./transactions";

const { bankTransactions, cashTransactions } = await getTransactions();

const projects = await getProjects();

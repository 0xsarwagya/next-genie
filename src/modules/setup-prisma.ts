import fs from "node:fs";
import path from "node:path";
import { execAsync, getPackageManager } from "../lib/utils.ts";

export const setupPrisma = async (name: string) => {
	const projectDir = path.resolve(`./${name}`);
	process.chdir(projectDir);

	type PacketManager = "npm" | "yarn" | "pnpm" | "bun";
	const packageManager = getPackageManager() as PacketManager;

	const packageManagerExecMap: Record<PacketManager, string> = {
		npm: "npx",
		yarn: "yarn dlx",
		pnpm: "pnpm dlx",
		bun: "bunx",
	};

	const projectJsonPath = path.join(projectDir, "package.json");

	const data = JSON.parse(fs.readFileSync(projectJsonPath).toString()) as {
		scripts: Record<string, string>;
		dependencies: Record<string, string>;
	};

	fs.writeFileSync(projectJsonPath, JSON.stringify(data));

	data.dependencies.prisma = "6.0.1";

	await execAsync("npm install --legacy-peer-deps");

	const packageManagerExec = packageManagerExecMap[packageManager];

	await execAsync(`${packageManagerExec} prisma init`);

	const envValidationFilePath = path.join(projectDir, "env.js");
	let envValidationFile = fs.readFileSync(envValidationFilePath).toString();

	// Add DATABASE_URL to server object dynamically
	if (!envValidationFile.includes("DATABASE_URL")) {
		envValidationFile = envValidationFile.replace(
			"const server = z.object({",
			"const server = z.object({\n\tDATABASE_URL: z.string(),",
		);
	}

	// Add DATABASE_URL to processEnv dynamically
	if (!envValidationFile.includes("DATABASE_URL: process.env.DATABASE_URL")) {
		envValidationFile = envValidationFile.replace(
			"const processEnv = {",
			"const processEnv = {\n\tDATABASE_URL: process.env.DATABASE_URL,",
		);
	}

	fs.writeFileSync(envValidationFilePath, envValidationFile);

	data.scripts.postinstall = "prisma generate";

	fs.writeFileSync(projectJsonPath, JSON.stringify(data));

	const prismaInitCode = `
	import { PrismaClient } from "@prisma/client"
 
	const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
	 
	export const prisma = globalForPrisma.prisma || new PrismaClient()
	 
	if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
	`;

	const prismaDataFile = path.join(projectDir, "lib/prisma.ts");

	fs.writeFileSync(prismaDataFile, prismaInitCode);

	process.chdir(path.resolve("../"));
};

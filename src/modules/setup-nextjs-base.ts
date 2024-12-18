import fs from "node:fs";
import path from "node:path";
import { AlreadyExistsError } from "../lib/errors.ts";
import { execAsync, getPackageManager } from "../lib/utils.ts";

const getNextJsVersion = async () => {
	try {
		const res = await fetch(
			"https://raw.githubusercontent.com/0xsarwagya/next-boilerplate/refs/heads/base/package.json",
		);

		const data = (await res.json()) as {
			dependencies: {
				next: string;
			};
		};

		return data.dependencies.next;
	} catch (_) {
		return "15.1.1";
	}
};

const createNextApp = async (name: string) => {
	try {
		type PacketManager = "npm" | "yarn" | "pnpm" | "bun";
		const nextJsVersion = await getNextJsVersion();
		const packageManager = getPackageManager() as PacketManager;

		const packageManagerExecMap: Record<PacketManager, string> = {
			npm: "npx",
			yarn: "yarn dlx",
			pnpm: "pnpm dlx",
			bun: "bunx",
		};

		const packageManagerExec = packageManagerExecMap[packageManager];

		const createNextAppCommand = `${packageManagerExec} create-next-app@${nextJsVersion} ${name} -e https://github.com/0xsarwagya/next-boilerplate/tree/base`;

		await execAsync(createNextAppCommand);

		const projectDir = path.resolve(`./${name}`);

		const projectJsonPath = path.join(projectDir, "package.json");

		const data = JSON.parse(fs.readFileSync(projectJsonPath).toString()) as {
			name: string;
		};

		data.name = name;

		fs.writeFileSync(projectJsonPath, JSON.stringify(data));

		const configDataGithub = path.join(
			projectDir,
			".github/ISSUE_TEMPLATE/config.yml",
		);

		const config = fs.readFileSync(configDataGithub).toString();

		const updatedConfig = config.replaceAll("__PROJECT_NAME__", name);

		fs.writeFileSync(configDataGithub, updatedConfig);
	} catch (error) {
		if (JSON.stringify(error).includes("contains files that could conflict")) {
			throw new AlreadyExistsError("A Project with that name already exists");
		}

		throw error;
	}
};

export { createNextApp };

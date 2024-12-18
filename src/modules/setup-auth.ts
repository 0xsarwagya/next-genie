import fs from "node:fs";
import path from "node:path";
import { execAsync } from "../lib/utils.ts";

export const setupAuth = async (name: string) => {
	const projectDir = path.resolve(`./${name}`);

	const projectJsonPath = path.join(projectDir, "package.json");

	const data = JSON.parse(fs.readFileSync(projectJsonPath).toString()) as {
		scripts: Record<string, string>;
		dependencies: Record<string, string>;
	};

	fs.writeFileSync(projectJsonPath, JSON.stringify(data));

	data.dependencies["next-auth"] = "4.24.11";

	await execAsync("npm install --legacy-peer-deps");

	const envValidationFilePath = path.join(projectDir, "env.js");
	let envValidationFile = fs.readFileSync(envValidationFilePath).toString();

	if (!envValidationFile.includes("NEXTAUTH_URL")) {
		envValidationFile = envValidationFile.replace(
			"const server = z.object({",
			"const server = z.object({\n\tNEXTAUTH_URL: z.string().url(),",
		);
	}

	if (!envValidationFile.includes("NEXTAUTH_SECRET")) {
		envValidationFile = envValidationFile.replace(
			"const server = z.object({",
			"const server = z.object({\n\tNEXTAUTH_SECRET: z.string().min(1),",
		);
	}

	if (!envValidationFile.includes("NEXTAUTH_URL: process.env.NEXTAUTH_URL")) {
		envValidationFile = envValidationFile.replace(
			"const processEnv = {",
			"const processEnv = {\n\tNEXTAUTH_URL: process.env.NEXTAUTH_URL,",
		);
	}

	if (
		!envValidationFile.includes("NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET")
	) {
		envValidationFile = envValidationFile.replace(
			"const processEnv = {",
			"const processEnv = {\nNEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,",
		);
	}

	/**
	 * Google Login
	 */
	if (!envValidationFile.includes("AUTH_GOOGLE_CLIENT_ID")) {
		envValidationFile = envValidationFile.replace(
			"const server = z.object({",
			"const server = z.object({\nAUTH_GOOGLE_CLIENT_ID: z.string().min(1),",
		);
	}

	if (!envValidationFile.includes("AUTH_GOOGLE_CLIENT_SECRET")) {
		envValidationFile = envValidationFile.replace(
			"const server = z.object({",
			"const server = z.object({\nAUTH_GOOGLE_CLIENT_SECRET: z.string().min(1),",
		);
	}

	if (
		!envValidationFile.includes(
			"AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET",
		)
	) {
		envValidationFile = envValidationFile.replace(
			"const processEnv = {",
			"const processEnv = {\nAUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,",
		);
	}

	if (
		!envValidationFile.includes(
			"AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID",
		)
	) {
		envValidationFile = envValidationFile.replace(
			"const processEnv = {",
			"const processEnv = {AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,",
		);
	}

	fs.writeFileSync(envValidationFilePath, envValidationFile);

	const authConfigFile = path.join(projectDir, "lib/auth.config.ts");

	const authConfigData = `
		import type { AuthOptions } from "next-auth";
		import Google from "next-auth/providers/google";
		import { env } from "@/env.mjs";

		export const authOptions: AuthOptions = {
			providers: [
				Google({
					clientId: env.GOOGLE_CLIENT_ID,
					clientSecret: env.GOOGLE_CLIENT_SECRET,
				}),
			]
		};
	`;

	fs.writeFileSync(authConfigFile, authConfigData);

	const authRouteDir = path.join(projectDir, "app/api/auth/[...nextauth]");

	if (!fs.existsSync(authRouteDir)) {
		fs.mkdirSync(authRouteDir, {
			recursive: true,
		});
	}

	const authRouteFile = path.join(authRouteDir, "route.ts");

	const authRouteData = `
	import { authOptions } from "@/lib/auth.config";
	import NextAuth from "next-auth";
	
	const handler = NextAuth(authOptions);
	
	export { handler as GET, handler as POST };
	`;

	fs.writeFileSync(authRouteFile, authRouteData);
};

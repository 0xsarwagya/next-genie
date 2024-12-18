import { execFile as execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { build as esbuild } from "esbuild";
import { rimraf } from "rimraf";

const execFile = promisify(execFileSync);

const srcPath = path.join(process.cwd(), "src");
const buildPath = path.join(process.cwd(), "build");

async function clear(): Promise<void> {
	const time = Date.now();

	await fs.rm(buildPath, { recursive: true, force: true });

	// biome-ignore lint/suspicious/noConsoleLog: script file
	// biome-ignore lint/suspicious/noConsole : script file
	console.log(`🚀 cleared in ${Date.now() - time}ms`);
}

async function buildDts(): Promise<void> {
	const time = Date.now();

	const { stderr } = await execFile("tsc", [
		"--emitDeclarationOnly",
		"--project",
		"tsconfig.build.json",
	]);

	if (stderr) {
		// biome-ignore lint/suspicious/noConsoleLog: script file
		// biome-ignore lint/suspicious/noConsole : script file
		console.error(stderr);
	}

	// biome-ignore lint/suspicious/noConsoleLog: script file
	// biome-ignore lint/suspicious/noConsole : script file
	console.log(`🚀 built definitions files in ${Date.now() - time} ms`);
}

async function extractDts(): Promise<void> {
	const time = Date.now();

	const { stderr } = await execFile("api-extractor", ["run"]);

	if (stderr) {
		// biome-ignore lint/suspicious/noConsoleLog: script file
		// biome-ignore lint/suspicious/noConsole : script file
		console.error(stderr);
	}

	await rimraf("./build/*", { glob: true });
	await fs.rename("trimmed.d.ts", "build/index.d.ts");

	// biome-ignore lint/suspicious/noConsoleLog: script file
	// biome-ignore lint/suspicious/noConsole : script file
	console.log(`🚀 extracted definitions files in ${Date.now() - time} ms`);
}

async function build(): Promise<void> {
	const time = Date.now();

	await esbuild({
		platform: "node",
		target: "node21",
		format: "esm",
		nodePaths: [srcPath],
		sourcemap: false,
		external: [],
		bundle: true,
		entryPoints: [path.join(srcPath, "index.ts")],
		outdir: buildPath,
		minify: true,
		banner: {
			js: "const require = (await import('node:module')).createRequire(import.meta.url);const __filename = (await import('node:url')).fileURLToPath(import.meta.url);const __dirname = (await import('node:path')).dirname(__filename);",
		},
		footer: {
			js: `
				/**
				 * Github Repository: https://github.com/0xsarwagya/next-genie
				 * Author: 0xsarwagya
				 * License: MIT
				 */
			`,
		},
	});

	// biome-ignore lint/suspicious/noConsoleLog: script file
	// biome-ignore lint/suspicious/noConsole : script file
	console.log(`🚀 bundled in ${Date.now() - time}ms`);
}

if (process.argv[1] === import.meta.filename) {
	await clear();
	await buildDts();
	await extractDts();
	await build();
}
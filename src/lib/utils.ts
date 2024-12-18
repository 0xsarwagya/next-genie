import { exec } from "node:child_process";
import { promisify } from "node:util";
import winston from "winston";
import { RequirementNoMetError, handleError } from "./errors.ts";

const execAsync = promisify(exec);

export const safeStringify = (object: unknown) => {
	try {
		// Handle different input types
		if (object === null || object === undefined) {
			return String(object);
		}

		// For primitives, convert to string
		if (typeof object !== "object") {
			return String(object);
		}

		// Deep clone to break potential circular references
		const dataObj = JSON.parse(
			JSON.stringify(object, (_, value) =>
				value === undefined ? null : value,
			),
		);

		// Detailed stringification
		return JSON.stringify(
			dataObj,
			(_, value) => {
				// Handle special cases
				if (value instanceof Date) {
					return value.toISOString();
				}
				if (typeof value === "function") {
					return value.toString();
				}
				return value;
			},
			2,
		);
	} catch (error) {
		const { body } = handleError(error);
		logger.error(body);
		throw new Error(body.message, {
			cause: body.code,
		});
	}
};
const logger = winston.createLogger({
	level: "silly",
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		verbose: 4,
		debug: 5,
		silly: 6,
	},
	format: winston.format.combine(
		winston.format.label({
			label: "next-genie",
		}),
		winston.format.colorize(),
		winston.format.timestamp({
			format: () => {
				return new Date().toLocaleString("en-US");
			},
		}),
		winston.format.align(),
		winston.format.printf(
			(info) =>
				`\x1b[34m(${info.label})\x1b[0m \x1b[33m${info.timestamp}\x1b[0m [${info.level}]: ${info.message}`,
		),
	),
	transports: [new winston.transports.Console()],
});

/**
 * Detects the package manager being used (npm, yarn, pnpm, or bun).
 *
 * This function attempts to detect the package manager based on the command
 * that is being used to run the script. It checks for `npx`, `yarn dlx`, `pnpm dlx`,
 * or `bun` in the process command, which indicates the package manager being used.
 *
 * @returns {string} The name of the package manager: "npm", "yarn", "pnpm", or "bun".
 * @throws {Error} If the package manager cannot be determined.
 */
export function getPackageManager(): string {
	// Get the command used to run the current process
	const command = process.argv.join(" ");

	if (!command) {
		throw new RequirementNoMetError("Can not identify package manager");
	}

	if (command.includes("npx")) {
		// Check if `npx` is being used (for npm)
		return "npm";
	}

	// Check if `yarn dlx` is being used (for yarn)
	if (command.includes("yarn")) {
		return "yarn";
	}

	// Check if `pnpm dlx` is being used (for pnpm)
	if (command.includes("pnpm")) {
		return "pnpm";
	}

	// Check if `bun` is being used (for Bun)
	if (command.includes("bun")) {
		return "bun";
	}

	// If the package manager cannot be determined, throw an error
	throw new Error("Could not determine the package manager.");
}

export { execAsync, logger };

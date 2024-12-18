#!/usr/bin/env node --no-warnings

import inquirer from "inquirer";
import winston from "winston";
import { handleError } from "./lib/errors.ts";
import { safeStringify } from "./lib/utils.ts";
import { setupAuth } from "./modules/setup-auth.ts";
import { createNextApp } from "./modules/setup-nextjs-base.ts";
import { setupPrisma } from "./modules/setup-prisma.ts";

// Configure logger
const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp(),
		winston.format.printf(({ timestamp, level, message }) => {
			return `${timestamp} [${level}]: ${message}`;
		}),
	),
	transports: [new winston.transports.Console()],
});

const projectNameRegex = /^[a-zA-Z0-9-_]+$/;

async function setup() {
	try {
		const { appName, options } = await inquirer.prompt([
			{
				name: "appName",
				message: "Please name the app.",
				type: "input",
				validate: (input) => {
					if (!input) {
						return "Project name cannot be empty";
					}
					if (!projectNameRegex.test(input)) {
						return "Project name can only contain letters, numbers, hyphens, and underscores";
					}
					return true;
				},
				filter: (input) => input.trim(),
			},
			{
				name: "options",
				message: "What tools would you like to set up?",
				type: "checkbox",
				choices: [
					{ name: "Authentication", value: "authentication" },
					{ name: "Prisma", value: "prisma" },
				],
			},
		]);

		logger.info(`Creating ${appName}`);
		await createNextApp(appName);

		// Set up tools based on user selection
		if (options.includes("authentication")) {
			logger.info("Starting authentication setup...");
			await setupAuth(appName);
			logger.info("Authentication setup complete.");
		}

		if (options.includes("prisma")) {
			logger.info("Starting Prisma setup...");
			await setupPrisma(appName);
			logger.info("Prisma setup complete.");
		}

		logger.info("Setup completed successfully!");
	} catch (error) {
		const errorData = handleError(error);
		logger.error(safeStringify(errorData.body));
		process.exit(1);
	}
}

// Execute the CLI
setup();

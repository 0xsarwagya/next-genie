import { gte } from "semver";
import { RequirementNoMetError } from "../lib/errors.ts";
import { execAsync } from "../lib/utils.ts";

/**
 * Verifies if the current Node.js version meets the required version.
 *
 * This function checks the installed version of Node.js by executing the `node -v` command.
 * It then compares the current version against the required version. If the current version
 * is lower than the required version, a `RequirementNoMetError` is thrown with a detailed
 * error message.
 *
 * @throws {RequirementNoMetError} If Node.js is not found or the current version is
 *                                 lower than the required version.
 */
const verifyNodeJsversion = async () => {
	try {
		// Get the installed Node.js version by executing `node -v`
		const { stdout: versionString } = await execAsync("node -v");
		if (!versionString) {
			throw new RequirementNoMetError("NodeJS Not Found");
		}

		// Clean the version string by removing the "v" prefix
		const nodeVersion = versionString.replace("v", "");
		const requiredVersion = "22.12.0";

		// Compare the current version against the required version
		if (!gte(nodeVersion, requiredVersion)) {
			throw new RequirementNoMetError(
				`Expected NodeJS version ${requiredVersion}, but found ${nodeVersion}`,
			);
		}
	} catch (_) {
		// Handle the case where Node.js is not found or an error occurs
		throw new RequirementNoMetError("NodeJS Not Found");
	}
};

/**
 * Verifies if the current NPM version meets the required version.
 *
 * This function checks the installed version of NPM by executing the `npm -v` command.
 * It then compares the current version against the required version. If the current version
 * is lower than the required version, a `RequirementNoMetError` is thrown with a detailed
 * error message.
 *
 * @throws {RequirementNoMetError} If NPM is not found or the current version is
 *                                 lower than the required version.
 */
const verifyNpmVersion = async () => {
	try {
		// Get the installed NPM version by executing `npm -v`
		const { stdout: versionString } = await execAsync("npm -v");
		if (!versionString) {
			throw new RequirementNoMetError("NPM Not Found");
		}

		// Assign the installed version
		const npmVersion = versionString;
		const requiredVersion = "10.9.0";

		// Compare the current version against the required version
		if (!gte(npmVersion, requiredVersion)) {
			throw new RequirementNoMetError(
				`Expected NPM version ${requiredVersion}, but found ${npmVersion}`,
			);
		}
	} catch (_) {
		// Handle the case where NPM is not found or an error occurs
		throw new RequirementNoMetError("NPM Not Found");
	}
};

export { verifyNodeJsversion, verifyNpmVersion };

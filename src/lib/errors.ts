import { ZodError } from "zod";

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ValidationError";
	}
}

export class RequirementNoMetError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RequirementNoMetError";
	}
}

export class AlreadyExistsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AlreadyExistsError";
	}
}

export const handleError = (error: unknown) => {
	if (error instanceof ZodError) {
		return {
			body: {
				code: "VALIDATION_ERROR",
				message: "Invalid event data",
				details: error.errors.map((e) => ({
					path: e.path.join("."),
					message: e.message,
				})),
			},
		};
	}

	if (error instanceof ValidationError) {
		return {
			body: {
				code: "BAD_REQUEST",
				message: error.message,
			},
		};
	}

	if (error instanceof RequirementNoMetError) {
		return {
			body: {
				code: "Requirement not met",
				message: error.message,
			},
		};
	}

	if (error instanceof AlreadyExistsError) {
		return {
			body: {
				code: "Project Already Exists",
				message: error.message,
			},
		};
	}

	return {
		body: {
			code: "INTERNAL_SERVER_ERROR",
			message: "An unexpected error occurred",
			...(process.env.NODE_ENV !== "production" && {
				details: error instanceof Error ? error.message : String(error),
			}),
		},
	};
};

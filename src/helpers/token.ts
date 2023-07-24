import { randomBytes } from "crypto";

export function randomToken() {
	return randomBytes(32).toString("hex");
}

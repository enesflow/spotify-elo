import type { CookieValue } from "@builder.io/qwik-city";
import crypto from "crypto-js";

export function encrypt(value: string | null, secret: string | undefined) {
	if (!secret) return "";
	if (!value) return "";
	return crypto.AES.encrypt(value, secret).toString();
}
export function decrypt(value: CookieValue | null, secret: string | undefined) {
	if (!secret) return "";
	if (!value) return "";
	return crypto.AES.decrypt(value.value, secret).toString(crypto.enc.Utf8);
}

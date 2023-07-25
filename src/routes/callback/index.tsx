import type { RequestHandler } from "@builder.io/qwik-city";
import { PrismaClient } from "@prisma/client";
import { encrypt } from "~/helpers/encrypt";
import { randomToken } from "~/helpers/token";

export const onGet: RequestHandler = async ({
	url,
	env,
	redirect,
	cookie,
	text,
}) => {
	const code = url.searchParams.get("code");
	const error = url.searchParams.get("error");
	if (error || !code) {
		console.error(error);
		throw new Error(error || "No code");
	}
	// request access token
	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			Authorization:
				"Basic " +
				Buffer.from(
					env.get("SPOTIFY_CLIENT_ID") +
						":" +
						env.get("SPOTIFY_CLIENT_SECRET")
				).toString("base64"),
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code: code!,
			redirect_uri: `${env.get("URL")}/callback`,
		}),
	});

	const data = await response.json();
	if (data.error) {
		console.error(data.error, data.error_description);
		throw new Error(data.error_description);
	}

	// get current user:
	// name and spotify id
	const userResponse = await fetch("https://api.spotify.com/v1/me", {
		headers: {
			Authorization: "Bearer " + data.access_token,
		},
	});

	const userData = await userResponse.json();
	if (userData.error) {
		console.error(userData.error, userData.error.message);
		throw new Error(userData.error.message);
	}

	const prisma = new PrismaClient();
	try {
		const user = await prisma.user.upsert({
			where: { id: userData.id },
			update: {
				name: userData.display_name,
				access_token: data.access_token,
				refresh_token: data.refresh_token,
			},
			create: {
				id: userData.id,
				name: userData.display_name,
				access_token: data.access_token,
				refresh_token: data.refresh_token,
				auth: randomToken(),
			},
		});
		cookie.set("auth", encrypt(user.auth, env.get("ENCRYPTION_SECRET")), {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 365, // <- 1 year
			path: "/",
		});

		await prisma.$disconnect();
		throw redirect(302, "/app");
	} catch (e) {
		console.error(e);
		throw text(500, "Couldnt save user");
	} finally {
		await prisma.$disconnect();
	}
	// redirect to main page
	//throw redirect(302, "/app");
};

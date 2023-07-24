import type { RequestEvent, RequestEventBase } from "@builder.io/qwik-city";
import type { User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
// request to the spotify api
// if the access_token is expired, it will refresh it

export const refresh_token = async (
	prisma: PrismaClient,
	user: User,
	env: RequestEvent["env"]
) => {
	const refreshToken = user.refresh_token;
	if (!refreshToken) {
		throw new Error("No refresh token found");
	}
	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${Buffer.from(
				`${env.get("SPOTIFY_CLIENT_ID")}:${env.get(
					"SPOTIFY_CLIENT_SECRET"
				)}`
			).toString("base64")}`,
		},
		body: new URLSearchParams({
			grant_type: "refresh_token",
			refresh_token: refreshToken,
		}).toString(),
	});
	if (!response.ok) {
		// try again
		refresh_token(prisma, user, env);
	}
	const { access_token } = await response.json();
	await prisma.user.update({
		where: {
			id: user.id,
		},
		data: {
			access_token,
		},
	});
};

export const request = async <TResponse = unknown>(
	requestEvent: RequestEventBase,
	url: string,
	{ body, ...customConfig }: RequestInit = {},
	prisma?: PrismaClient | null,
	user?: User | null
): Promise<TResponse> => {
	if (!user) user = (await requestEvent.sharedMap.get("user")) as User;
	const access_token = user.access_token;
	if (!access_token) {
		throw new Error("No access token found");
	}
	const headers: any = {
		"Content-Type": "application/x-www-form-urlencoded",
	};
	if (access_token) {
		headers.Authorization = `Bearer ${access_token}`;
	}
	const config = {
		method: body ? "POST" : "GET",
		...customConfig,
		headers: {
			...headers,
			...customConfig.headers,
		},
		body,
	};
	if (!url.startsWith("http")) {
		url = `https://api.spotify.com/v1/${url}`;
	}
	const response = await fetch(url, config);
	if (response.status === 401) {
		if (!prisma) prisma = new PrismaClient();
		await refresh_token(prisma, user, requestEvent.env);
		await prisma.$disconnect();
		return request(requestEvent, url, customConfig, prisma, user);
	}
	const data = await response.json();
	if (response.ok) {
		return data;
	}
	throw new Error(data.error.message);
};

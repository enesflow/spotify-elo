import type { RequestHandler } from "@builder.io/qwik-city";

export const onRequest: RequestHandler = async ({ redirect }) => {
	throw redirect(302, "/app/leaderboard");
};

import type { RequestHandler } from "@builder.io/qwik-city";
import { stringify } from "querystring";

export const onGet: RequestHandler = async ({ redirect, env }) => {
	// const state = randomToken();
	const scope =
		"user-library-read playlist-read-private playlist-read-collaborative user-library-modify";
	const redirect_uri = `${env.get("URL")}/callback`;

	throw redirect(
		302,
		"https://accounts.spotify.com/authorize?" +
			stringify({
				response_type: "code",
				client_id: env.get("SPOTIFY_CLIENT_ID"),
				scope: scope,
				redirect_uri: redirect_uri,
				// state: state,
			})
	);
};

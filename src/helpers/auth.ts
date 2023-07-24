import type { RequestEvent } from "@builder.io/qwik-city";

export const protectedRoute = async ({
	sharedMap,
	redirect,
	cookie,
}: RequestEvent) => {
	if (!(await sharedMap.get("user"))) {
		// remove the cookies if they are invalid
		cookie.delete("auth", {
			path: "/",
		});
		throw redirect(302, "/unauthorized");
	}
};

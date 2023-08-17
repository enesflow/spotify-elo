import { component$ } from "@builder.io/qwik";
import type { RequestHandler} from "@builder.io/qwik-city";
import {Link, type DocumentHead} from "@builder.io/qwik-city";
import {Button} from "~/components/button/button";
import {Row} from "~/components/layout/layout";

export const onRequest: RequestHandler = async ({
    cookie,
    redirect,
	cacheControl
  }) => {
	cacheControl({
		public: false,
		maxAge: 0,
		sMaxAge: 0,
		staleWhileRevalidate: 0,
	});

	if (cookie.get("auth")) {
		throw redirect(302, "/app")
	}
};

export default component$(() => {
	return (
		<>

			<div class="grid h-screen place-items-center">
				<div>
					<h1 class="text-4xl">
						Hemen giriş yap!
					</h1>
					<br/>
					<Row class="justify-center">
						<Link href="/login">
							<Button color="blue" class="text-3xl">
								Giriş Yap
							</Button>
						</Link>
					</Row>
				</div>
			</div>
		</>
	);
});

export const head: DocumentHead = {
	title: "Spotify ELO",
	meta: [
		{
			name: "description",
			content: "Sevdiğin şarkıları bul"
		},
	],
};

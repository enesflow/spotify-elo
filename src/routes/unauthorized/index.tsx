import {component$} from "@builder.io/qwik";
import {Link} from "@builder.io/qwik-city";
import {Button} from "~/components/button/button";
import {Row} from "~/components/layout/layout";

export default component$(() => {
	return (
		<div class="grid h-screen place-items-center">
			<div>
				<h1 class="text-4xl">
					Haydaaa! Giriş yapman lazım.
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
	);
});

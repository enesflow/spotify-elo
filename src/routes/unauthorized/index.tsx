import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export default component$(() => {
	return (
		<div>
			<h1>Unauthorized</h1>
			<p>You are not authorized to view this page.</p>
			<Link href="/login">Login</Link>
		</div>
	);
});

import type { CSSProperties } from "@builder.io/qwik";
import {
	$,
	component$,
	createContextId,
	Slot,
	useContextProvider,
	useSignal,
} from "@builder.io/qwik";
import {
	globalAction$,
	Link,
	routeLoader$,
	useLocation,
} from "@builder.io/qwik-city";
import type { User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { HiSparklesOutline } from "@qwikest/icons/heroicons";
import { LuCrown, LuListPlus, LuMenu, LuMusic } from "@qwikest/icons/lucide";
import { request } from "~/helpers/request";
import type { Me } from "~/types/spotify";

import type { RequestHandler } from "@builder.io/qwik-city";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/button/button";
import { decrypt } from "~/helpers/encrypt";

export const CTX = createContextId<{ me: Me; user: User }>("me");

export const onRequest: RequestHandler = async ({
	cacheControl,
	cookie,
	sharedMap,
	env,
	redirect,
}) => {
	cacheControl({
		public: false,
		maxAge: 0,
		sMaxAge: 0,
		staleWhileRevalidate: 0,
	});
	// set the user
	const auth = decrypt(cookie.get("auth"), env.get("ENCRYPTION_SECRET"));
	if (!auth) {
		sharedMap.set("user", null);
		throw redirect(302, "/unauthorized");
	} else {
		const prisma = new PrismaClient();
		const user = await prisma.user.findUnique({
			where: {
				auth: auth,
			},
		});
		sharedMap.set("user", user);
		await prisma.$disconnect();
	}
};

export const useMeLoader = routeLoader$(async (requestEvent) => {
	const me = await request<Me>(requestEvent, "me");
	requestEvent.sharedMap.set("me", me);
	return me;
});

export const useUserLoader = routeLoader$(async (requestEvent) => {
	return (await requestEvent.sharedMap.get("user")) as User;
});

export const useLogoutAction = globalAction$((_, { cookie, redirect }) => {
	cookie.delete("auth");
	throw redirect(302, "/");
});

export const Nav = component$(() => (
	<nav class="bg-neutral-950 p-4">
		<div class="flex flex-wrap align-middle items-center justify-between w-full">
			<Slot />
		</div>
	</nav>
));

export const Item = component$<{
	href: string;
	page: string;
	class?: string;
	style?: CSSProperties;
	dontFade?: boolean;
}>((props) => (
	<li>
		<Link
			href={props.href}
			class={twMerge(
				"text-white bg-transparent inline-flex items-center justify-center",
				(props.page === props.href ||
					props.page === props.href + "/") &&
					(props.dontFade ? "underline" : "opacity-80"),
				props.class
			)}
			aria-current="page"
			style={props.style}
		>
			<Slot />
		</Link>
	</li>
));

export default component$(() => {
	const me = useMeLoader().value;
	const user = useUserLoader().value;
	const logout = useLogoutAction();
	const expanded = useSignal(false);
	const loc = useLocation();

	useContextProvider(CTX, { me, user });

	return (
		<main>
			<Nav>
				<Link
					href="/app"
					class="flex items-center text-white text-3xl font-bold"
				>
					<LuMusic class="self-center mr-2" />
					Spotify ELO
				</Link>
				<div class="flex md:order-2 gap-x-2">
					<div class="flex flex-row justify-between gap-x-4">
						<img
							width="40"
							height="40"
							src={me.images[0].url}
							class="rounded-lg"
						/>
						<Button
							size="large"
							color="red"
							onClick$={$(async () => {
								await logout.submit();
							})}
						>
							Çıkış Yap
						</Button>
					</div>
					<button
						type="button"
						class="inline-flex items-center justify-center w-10 h-10 p-2 text-sm text-neutral-500 rounded-lg md:hidden hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-200"
						onClick$={$(() => {
							expanded.value = !expanded.value;
						})}
					>
						<span class="sr-only">Open main menu</span>

						<LuMenu class="w-5 h-5" />
					</button>
				</div>
				<div
					class={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${
						!expanded.value && "hidden text-2xl"
					}`}
				>
					<ul
						class={twMerge(
							"flex flex-col p-4 mt-4 font-medium border rounded-lg md:p-0 md:flex-row md:space-x-2 md:text-sm lg:text-xl xl:text-2xl lg:space-x-8 md:mt-0 md:border-0",
							expanded.value && "text-2xl"
						)}
					>
						<Item href="/app/solve" page={loc.url.pathname}>
							<HiSparklesOutline class="mr-2" />
							Çöz
						</Item>
						<Item href="/app/leaderboard" page={loc.url.pathname}>
							<LuCrown class="mr-2" />
							Liderlik Tablosu
						</Item>
						<Item href="/app/add" page={loc.url.pathname}>
							<LuListPlus class="mr-2" />
							Şarkı Ekle
						</Item>
					</ul>
				</div>
			</Nav>
			<main class="p-4">
				<Slot />
			</main>
		</main>
	);
});

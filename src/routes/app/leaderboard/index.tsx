import type {QwikIntrinsicElements, Signal} from "@builder.io/qwik";
import {$, component$, useContext, useOnDocument, useSignal} from "@builder.io/qwik";
import {Link, routeAction$, routeLoader$, z, zod$} from "@builder.io/qwik-city";
import type {Track, User} from "@prisma/client";
import {PrismaClient} from "@prisma/client";
import {SiSpotify} from "@qwikest/icons/simpleicons";
import {twMerge} from "tailwind-merge";
import {Button} from "~/components/button/button";
import {Row} from "~/components/layout/layout";
import {DeleteTrack} from "~/routes/app/solve";
import {CTX} from "../layout";

export const useTracksLoader = routeLoader$(async (requestEvent) => {
	const user = (await requestEvent.sharedMap.get("user")) as User;
	const prisma = new PrismaClient();
	const tracks = await prisma.track.findMany({
		where: {
	userId: user.id,
		},
		orderBy: {
			elo: "desc",
		},
	});
	await prisma.$disconnect();

	return {
		tracks,
		// newTracks: newTracks,
	};
});

export const useChangeEloAction = routeAction$(async function (data) {
	const prisma = new PrismaClient();
	const track = await prisma.track.findUnique({
		where: {
			id: data.trackId,
		},
	});
	const rival = track;
	if (!track || !rival) {
		throw new Error("Track not found");
	}
	// calculate probability of winning
	const aw = 1 / (1 + 10 ** ((rival.elo - track.elo) / 400));
	// const bw = 1 - aw;

	// calculate new elo
	const k = 128;
	const da = data.direction === "up" ? k * (1 - aw) : k * (0 - aw);
	// const db = k * (0 - bw);

	// update elo
	await prisma.track.update({
		where: {
			id: track.id,
		},
		data: {
			elo: {
				increment: da,
			},
			won: {
				increment: da > 0 ? 1 : 0,
			},
			lost: {
				increment: da < 0 ? 1 : 0,
			},
		},
	});
	await prisma.$disconnect();

	return {
		status: "success",
	};
}, zod$({
	trackId: z.string(),
	direction: z.enum(["up", "down"]),
}));

export const STrack = component$<{
	track: Track;
	maxElo: number;
	index: number;
	compact: Signal<boolean>;
	lastLoved: Signal<string>
} & QwikIntrinsicElements["div"]>(({lastLoved, track, maxElo, index, compact, ...rest }) => {
	// return <li>{playlist.name}</li>;
	// const checked = useSignal(allChecked.value);
	const changeEloAction = useChangeEloAction()
	const scrollToTrack = $(() => {
		const element = document.getElementById(track.id)
		if (element) {
			element.scrollIntoView({behavior: "smooth", block: "center"})
		}
	})
	return (
		<Row
			// href={playlist.external_urls.spotify}
			class={twMerge(
				"text-left bg-white border-gray-200 border-2 rounded-xl shadow max-w-3xl md:w-full hover:bg-gray-100",
				// add ring
				lastLoved.value.endsWith(track.id) && "ring-4 ring-offset-2",
				lastLoved.value === track.id && "ring-[#1DB954]",
				(lastLoved.value === "!" + track.id) && "ring-red-500",
				compact.value ? "h-auto" : "h-64"
			)}
{...rest}
		>
			{!compact.value && (
				<img
					class="box-border object-cover h-full md:max-h-full w-auto aspect-[2/3] md:aspect-square md:w-auto md:rounded-none rounded-l-lg"
					src={track.image}
					alt={track.name}
					width="640"
					height="640"
					loading="lazy"
				/>
			)}
			<div
				class={twMerge(
					"flex justify-between py-2 px-4 leading-normal gap-2",
					compact.value ? "flex-row" : "flex-col"
				)}
			>
				<Link
					class={twMerge(
						"hover:text-[#1DB954] text-gray-900 font-bold tracking-tight flex items-center justify-start text-ellipsis",
						compact.value ? "text-base" : "text-lg"
					)}
					href={track.url}
					target="_blank"
				>
					<SiSpotify class="mr-2 min-w-[1.25rem]" />
					{track.name}
				</Link>
				<h1
					class={twMerge(
						"font-normal text-gray-700 text-ellipsis",
						compact.value && "text-sm self-center"
					)}
				>
					{track.artist}
				</h1>
			</div>


			<div
				class={twMerge(
					"flex justify-between py-2 px-4 leading-normal gap-2 ml-auto",
					compact.value ? "flex-row" : "flex-col"
				)}
			>
				<div class="flex justify-end items-center text-xl font-bold tracking-tight text-gray-900 text-right">
					{(index < 3 || maxElo == track.elo) && (
						<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
					)}
					{Math.round((track.elo / 10))}
				</div>
				<div class="flex items-center justify-end">
					<div class="font-normal text-right">#{index + 1}</div>
				</div>
				<DeleteTrack size="xsmall" trackId={track.id} compact={compact.value} />
				<Button size="xsmall" buttonClass="gap-1" color="green" onClick$={async () => {
					await changeEloAction.submit({
						trackId: track.id,
						direction: "up"
					})
					lastLoved.value = track.id
					setTimeout(async () => {
					await scrollToTrack();
					}, 150)
				}}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-up"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
					{
						!compact.value &&
					"Beğen"
					}
				</Button>
				<Button size="xsmall" buttonClass="gap-1" color="pink" onClick$={async () => {
					await changeEloAction.submit({
						trackId: track.id,
						direction: "down"
					})
					lastLoved.value = "!" + track.id
					setTimeout(async () => {
						await scrollToTrack();
					}, 150)
				}}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-thumbs-down"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
					{
						!compact.value &&
						"Beğenme"
					}
				</Button>
			</div>
		</Row>
	);
});

export default component$(() => {
	const { tracks } = useTracksLoader().value;
	const user = useContext(CTX).user;
	const maxElo = tracks.length ? tracks[0].elo : 0;
	const compact = useSignal(false);

	const visibleTracks = useSignal(100);
	const buttonRef = useSignal<HTMLButtonElement>();

	const loadMore = $(() => {
		visibleTracks.value = Math.min(visibleTracks.value + 100, tracks.length);
	});
	const loading = useSignal(false)
	const lastLoved = useSignal("")

	// using the observer api to load more tracks when the button is visible
	useOnDocument("scroll", $(async () => {
		if (!buttonRef.value) return;
		const rect = buttonRef.value.getBoundingClientRect();
		const offset = 300;
		if (rect.top < window.innerHeight + offset) {
			if (loading.value) return;
			loading.value = true;
			await loadMore();
			setTimeout(() => {
				loading.value = false;
			}, 500);
		}
	}));

	return (
		<div>
			<h1 class="text-xl md:text-3xl font-bold tracking-tight text-center">
				Şarkı sayısı: {tracks.length}
				<br />
				Cevaplanan soru sayısı: {user.answered}
			</h1>
			<Row class="justify-center mt-2">
				<label class="relative inline-flex items-center cursor-pointer">
					<input
						type="checkbox"
						bind:checked={compact}
						class="sr-only peer"
					/>
					<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-rose-300 rounded-lg peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-lg after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
					<span class="ml-3 text-sm font-medium text-gray-900">
						Kompakt Görünüm
					</span>
				</label>
			</Row>
			<Row class="justify-center">
				<div class="grid grid-cols-1 gap-2 py-4 px-4">
					{tracks
						.slice(0, visibleTracks.value)
						.map((track, index) => (
						<STrack
							key={track.id}
							track={track}
							maxElo={maxElo}
							index={index}
							compact={compact}
							lastLoved={lastLoved}
							id={track.id}
						/>
					))}
				</div>
			</Row>
			<br/>
			<Row class="justify-center">
				{visibleTracks.value < tracks.length &&
				<Button ref={buttonRef} onClick$={loadMore} size="large" color="blue">
					Daha fazla göster
				</Button>
				}
			</Row>
		</div>
	);
});

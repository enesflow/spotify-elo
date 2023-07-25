import type { Signal } from "@builder.io/qwik";
import { component$, useContext, useSignal } from "@builder.io/qwik";
import { Link, routeLoader$ } from "@builder.io/qwik-city";
import type { Track, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { LuCrown } from "@qwikest/icons/lucide";
import { SiSpotify } from "@qwikest/icons/simpleicons";
import { twMerge } from "tailwind-merge";
import { Row } from "~/components/layout/layout";
import { CTX } from "../layout";

export const useTracksLoader = routeLoader$(async (requestEvent) => {
	const user = (await requestEvent.sharedMap.get("user")) as User;
	const prisma = new PrismaClient();
	const tracks = await prisma.track.findMany({
		where: {
			playlist: {
				userId: user.id,
			},
		},
		orderBy: {
			elo: "desc",
		},
		take: 101,
	});
	await prisma.$disconnect();

	return {
		tracks,
		// newTracks: newTracks,
	};
});

export const STrack = component$<{
	track: Track;
	maxElo: number;
	index: number;
	compact: Signal<boolean>;
}>(({ track, maxElo, index, compact }) => {
	// return <li>{playlist.name}</li>;
	// const checked = useSignal(allChecked.value);

	return (
		<Row
			// href={playlist.external_urls.spotify}
			class={twMerge(
				"text-left h-full bg-white border-gray-200 border-2 rounded-xl shadow max-w-xl hover:bg-gray-100"
			)}
		>
			{!compact.value && (
				<img
					class="box-border object-cover h-full max-w-[6rem] rounded-none rounded-l-lg"
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
						"font-normal text-gray-700",
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
				<div class="flex items-center text-xl font-bold tracking-tight text-gray-900 text-right">
					{(index < 3 || maxElo == track.elo) && (
						<LuCrown class="mr-1" />
					)}
					{Math.round((track.elo / maxElo) * 100) / 10}
				</div>
				<div class="font-normal ml-1 text-right">#{index + 1}</div>
			</div>
		</Row>
	);
});

export default component$(() => {
	const { tracks } = useTracksLoader().value;
	const user = useContext(CTX).user;
	const maxElo = tracks.length ? tracks[0].elo : 0;
	const compact = useSignal(false);

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
				<div class="grid grid-cols-1 gap-2 pt-4">
					{tracks.slice(0, 100).map((track, index) => (
						<STrack
							key={track.id}
							track={track}
							maxElo={maxElo}
							index={index}
							compact={compact}
						/>
					))}
				</div>
			</Row>
			{tracks.length > 100 && (
				<h1 class="text-center">
					Şuan sadece ilk 100 şarkı gösteriliyor. Ama en yakında o
					özellik de gelecek.
				</h1>
			)}
		</div>
	);
});

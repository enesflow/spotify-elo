import { $, component$, useComputed$, useStore } from "@builder.io/qwik";
import type { RequestEventBase } from "@builder.io/qwik-city";
import {
	Link,
	routeAction$,
	routeLoader$,
	server$,
	z,
	zod$,
} from "@builder.io/qwik-city";
import type { User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { LuCheckCircle2, LuChevronRight } from "@qwikest/icons/lucide";
import { SiSpotify } from "@qwikest/icons/simpleicons";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/button/button";
import { protectedRoute } from "~/helpers/auth";
import { request } from "~/helpers/request";
import type { Me, Playlist, SavedTracks, Track } from "~/types/spotify";
import { type Playlists } from "~/types/spotify";

export const onRequest = protectedRoute;

const convertSavedToPlaylist = (saved: SavedTracks, me: Me) => {
	const savedAsPlaylist = saved as unknown as Playlist;
	savedAsPlaylist.id = "saved";
	savedAsPlaylist.images = [
		{
			url: "/saved.png",
			height: 300,
			width: 300,
		},
	];
	savedAsPlaylist.external_urls = {
		spotify: "https://open.spotify.com/collection/tracks",
	};
	savedAsPlaylist.name = "Beğenilenler";
	savedAsPlaylist.tracks = {
		...saved,
		items: saved.items.map((item) => ({
			added_by: me,
			is_local: false,
			added_at: item.added_at,
			track: item.track,
		})),
	};
	return savedAsPlaylist;
};

export const usePlaylistsLoader = routeLoader$(async (requestEvent) => {
	const playlists = await request<Playlists>(requestEvent, "me/playlists");
	const me = (await requestEvent.sharedMap.get("me")) as Me;
	const saved = await request<SavedTracks>(requestEvent, "me/tracks?limit=1");
	const savedAsPlaylist = convertSavedToPlaylist(saved, me);
	playlists.items.unshift(savedAsPlaylist);

	return playlists;
});

export const getAllSavedSongs = server$(
	async (requestEvent: RequestEventBase): Promise<SavedTracks> => {
		const limit = 50 as const;
		let offset = 0;
		const items: {
			added_at: string;
			track: Track;
		}[] = [];
		let saved: SavedTracks;
		do {
			saved = await request<SavedTracks>(
				requestEvent,
				`me/tracks?limit=${limit}&offset=${offset}`
			);
			items.push(...saved.items);
			offset += limit;
		} while (saved.items.length > 0);

		return {
			total: items.length,
			href: "",
			limit,
			offset,
			next: "",
			previous: "",
			items,
		};
	}
);

export const useAddPlaylists = routeAction$(
	async ({ playlistIds }, requestEvent) => {
		const user = (await requestEvent.sharedMap.get("user")) as User;
		const me = (await requestEvent.sharedMap.get("me")) as Me;
		/* console.log(
			convertSavedToPlaylist(await getAllSavedSongs(requestEvent), me)
		);
		return; */
		const prisma = new PrismaClient();
		const playlistsPromises = await Promise.allSettled(
			playlistIds.map(async (id: string) => {
				if (id === "saved") {
					return convertSavedToPlaylist(
						await getAllSavedSongs(requestEvent),
						me
					);
				} else {
					return await request<Playlist>(
						requestEvent,
						`playlists/${id}`
					);
				}
			})
		);
		const playlists = playlistsPromises
			.map((playlist) => {
				if (playlist.status === "fulfilled") {
					// <- This if is just to make TS happy
					return playlist.value;
				}
				return null;
			})
			.filter((playlist) => playlist) as Playlist[];

		const dbPlaylistsPromises = await Promise.allSettled(
			playlists.map(async (playlist) => {
				return await prisma.playlist.upsert({
					where: {
						spotifyId_userId: {
							spotifyId: playlist.id,
							userId: user.id,
						},
					},
					update: {},
					create: {
						spotifyId: playlist.id,
						userId: user.id,
					},
				});
			})
		);

		// now add the songs
		await Promise.allSettled(
			dbPlaylistsPromises.map(async (dbPlaylist, index) => {
				if (dbPlaylist.status === "fulfilled") {
					const playlist = playlists[index];
					const playlistId = dbPlaylist.value.id;
					await Promise.all(
						playlist.tracks.items.map(async (item) => {
							const track = item.track;
							await prisma.track.upsert({
								where: {
									spotifyId_playlistId: {
										spotifyId: track.id,
										playlistId,
									},
								},
								update: {},
								create: {
									spotifyId: track.id,
									playlistId,
									name: track.name,
									artist: track.artists
										.map((a) => a.name)
										.join(", "),
									album: track.album.name,
									url: track.external_urls.spotify,
									image: track.album.images[0].url,
								},
							});
						})
					);
				}
			})
		);

		await prisma.$disconnect();

		throw requestEvent.redirect(302, "/app/leaderboard");
	},
	zod$({
		playlistIds: z.array(z.string()).nonempty(),
	})
);

export const SPlaylist = component$<{
	playlist: Playlist;
	store: Record<string, boolean>;
}>(({ playlist, store }) => {
	// return <li>{playlist.name}</li>;
	// const checked = useSignal(allChecked.value);

	return (
		<button
			// href={playlist.external_urls.spotify}
			class={twMerge(
				"text-center md:text-left cursor-pointer h-full flex flex-col items-center bg-white border-gray-200 border-4 rounded-xl shadow md:flex-row md:max-w-xl hover:bg-gray-100",
				store[playlist.id] &&
					"border-rose-500 hover:bg-rose-100 bg-rose-50"
			)}
			onClick$={$(() => {
				store[playlist.id] = !store[playlist.id];
			})}
		>
			<img
				class="box-border object-cover rounded-t-lg h-96 md:h-full md:max-w-[12rem] md:rounded-none md:rounded-l-lg"
				src={playlist.images[0].url}
				alt={playlist.name}
				width="640"
				height="640"
				loading="lazy"
			/>
			<div class="flex flex-col justify-between p-4 leading-normal">
				<Link
					class="hover:text-[#1DB954] text-gray-900 mb-2 text-2xl font-bold tracking-tight flex items-center justify-start"
					href={playlist.external_urls.spotify}
					target="_blank"
				>
					<SiSpotify class="mr-2" />
					{playlist.name}
					{store[playlist.id] && (
						<LuCheckCircle2 class="ml-2 text-rose-500 font-extrabold " />
					)}
				</Link>
				{playlist.description && (
					<p class="mb-3 font-normal text-gray-700">
						{playlist.description}
					</p>
				)}
				<p class="text-sm text-gray-600">
					{playlist.tracks.total} şarkı
				</p>
			</div>
		</button>
	);
});

export default component$(() => {
	const playlists = usePlaylistsLoader().value;
	const addPlaylists = useAddPlaylists();

	const checked = useStore(
		playlists.items.reduce((acc, playlist) => {
			acc[playlist.id] = false;
			return acc;
		}, {} as Record<string, boolean>)
	);

	const allChecked = useComputed$(() => {
		return Object.values(checked).every((value) => value);
	});

	const totalSongs = useComputed$(() => {
		const total = Object.keys(checked)
			.filter((value) => checked[value])
			.reduce((acc, value) => {
				const playlist = playlists.items.find(
					(playlist) => playlist.id === value
				);
				if (playlist) {
					return acc + playlist.tracks.total;
				}
				return acc;
			}, 0);
		return total;
	});

	return (
		<div class="p-4">
			<div class="flex justify-between">
				<Button
					color="red"
					size="large"
					onClick$={$(() => {
						Object.keys(checked).forEach((key) => {
							checked[key] = !allChecked.value;
						});
					})}
				>
					<LuCheckCircle2 class="mr-2" />
					{allChecked.value ? "Hepsini Kaldır" : "Hepsini Seç"}
				</Button>
				<h1 class="text-xl md:text-3xl font-bold tracking-tight">
					Seçilen şarkı sayısı: {totalSongs.value}
				</h1>

				<Button
					color="green"
					size="large"
					disabled={!totalSongs.value}
					onClick$={$(async () => {
						await addPlaylists.submit({
							playlistIds: Object.keys(checked).filter(
								(key) => checked[key]
							) as [string, ...string[]],
						});
					})}
				>
					Devam et
					<LuChevronRight class="ml-2" />
				</Button>
			</div>
			<div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3">
				{playlists.items.map((playlist) => (
					<SPlaylist
						store={checked}
						key={playlist.id}
						playlist={playlist}
					/>
				))}
			</div>
		</div>
	);
});

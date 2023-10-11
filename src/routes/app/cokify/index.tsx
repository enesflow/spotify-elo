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
import { SiSpotify } from "@qwikest/icons/simpleicons";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/button/button";
import { CheckIcon } from "~/components/icons";
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
	const playlists = await request<Playlists>(
		requestEvent,
		"me/playlists?limit=50"
	);
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

// get all songs in a playlist, with pagination support
export const getAllSongsInPlaylist = server$(
	async (
		requestEvent: RequestEventBase,
		playlistId: string
	): Promise<Track[]> => {
		const limit = 100 as const;
		let offset = 0;
		const items: Track[] = [];
		let playlist: any;
		do {
			playlist = await request<any>(
				requestEvent,
				`playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`
			);
			items.push(...playlist.items.map((item: any) => item.track));
			offset += limit;
			if (playlist.items.length === 0) {
				console.log("Got", items.length, "songs in playlist");
			}
		} while (playlist.items.length > 0);

		return items;
	}
);

export const getAllSongsInAlbum = server$(
	async (
		requestEvent: RequestEventBase,
		albumId: string
	): Promise<Track[]> => {
		const limit = 50 as const;
		let offset = 0;
		const items: Track[] = [];
		let album: any;
		do {
			album = await request<any>(
				requestEvent,
				`albums/${albumId}/tracks?limit=${limit}&offset=${offset}`
			);
			items.push(...album.items.map((item: any) => item));
			offset += limit;
			if (album.items.length === 0) {
				console.log("Got", items.length, "songs in album");
			}
		} while (album.items.length > 0);

		return items;
	}
);

export const useAddPlaylists = routeAction$(
	async ({ playlistId }, requestEvent) => {
		const user = (await requestEvent.sharedMap.get("user")) as User;
		const me = (await requestEvent.sharedMap.get("me")) as Me;
		// what we will do is this, get all songs from the selected playlist (the user will only be allowed to select 1 playlist)
		// then we will get the songs albums
		// then we will get all the songs in the albums
		// of course we will make them unique
		// then add them to the playlist
		const allSongs = await getAllSongsInPlaylist(requestEvent, playlistId);
		const allSongsURIsUnique = new Set(allSongs.map((song) => song.uri));
		const allSongsAlbumIds = allSongs.map((song) => song.album.id);
		const allSongsAlbumIdsUnique = new Set(allSongsAlbumIds);

		console.log("There are", allSongs.length, "songs in the playlist");
		console.log("And", allSongsAlbumIdsUnique.size, "unique albums");

		const newSongURIsUnique = new Set<string>();
		const allSongsAlbumIdsUniqueArray = Array.from(allSongsAlbumIdsUnique);
		const allSongsAlbumIdsUniqueChunks = [];
		const albumChunkSize = 2;
		for (
			let i = 0;
			i < allSongsAlbumIdsUniqueArray.length;
			i += albumChunkSize
		) {
			allSongsAlbumIdsUniqueChunks.push(
				allSongsAlbumIdsUniqueArray.slice(i, i + albumChunkSize)
			);
		}
		console.log(
			"And",
			allSongsAlbumIdsUniqueChunks.length,
			"chunks to get"
		);
		const maxTries = 3;
		let albumIndex = 0;
		for (const chunk of allSongsAlbumIdsUniqueChunks) {
			const songsInAlbums = await Promise.all(
				chunk.map(async (albumId) => {
					for (let i = 0; i < maxTries; i++) {
						try {
							return await getAllSongsInAlbum(
								requestEvent,
								albumId
							);
						} catch (e) {
							console.log(
								"Error getting album",
								albumId,
								"retrying",
								i + 1,
								"times"
							);
						}
					}
					return [];
				})
			);
			for (const songsInAlbum of songsInAlbums) {
				for (const song of songsInAlbum) {
					if (allSongsURIsUnique.has(song.uri)) {
						continue;
					}
					newSongURIsUnique.add(song.uri);
				}
			}
			console.log(
				`Completed ${(albumIndex += albumChunkSize)}/${
					allSongsAlbumIdsUniqueChunks.length
				} chunks`
			);
		}
		console.log("And", newSongURIsUnique.size, "new songs to add");
		// chunk it up in 100s
		const newSongURIs = Array.from(newSongURIsUnique);
		const newSongURIsChunks = [];
		const chunkSize = 100;
		for (let i = 0; i < newSongURIs.length; i += chunkSize) {
			newSongURIsChunks.push(newSongURIs.slice(i, i + chunkSize));
		}
		console.log("And", newSongURIsChunks.length, "chunks to add");
		for (const chunk of newSongURIsChunks) {
			/*await request<any>(
				requestEvent,
				`playlists/${playlistId}/tracks`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						uris: chunk,
					}),
				}
			);*/
			// retry
			for (let i = 0; i < maxTries; i++) {
				try {
					await request<any>(
						requestEvent,
						`playlists/${playlistId}/tracks`,
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								uris: chunk,
							}),
						}
					);
					break;
				} catch (e) {
					console.log(
						"Error adding songs to playlist",
						playlistId,
						"retrying",
						i + 1,
						"times"
					);
				}
			}
		}
		console.log("Successfully added", newSongURIs.length, "songs");
	},
	zod$({
		playlistId: z.string(),
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
					"bg-gradient-to-r from-rose-100 to-fuchsia-100 hover:from-rose-200 hover:to-fuchsia-200 border-rose-500 border-4"
			)}
			onClick$={$(() => {
				// make everything false except the current one
				Object.keys(store).forEach((key) => {
					if (key !== playlist.id) {
						store[key] = false;
					}
				});
				store[playlist.id] = !store[playlist.id];
			})}
		>
			<img
				class="!aspect-square box-border object-cover rounded-t-lg h-auto w-full md:max-w-[12rem] rounded-none md:rounded-l-lg"
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
						<CheckIcon class="ml-2 text-rose-500 font-extrabold " />
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

	const selectedPlaylistName = useComputed$(() => {
		const selectedId = Object.keys(checked).find((key) => checked[key]);
		if (selectedId) {
			return playlists.items.find(
				(playlist) => playlist.id === selectedId
			)?.name;
		}
		return null;
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
					<CheckIcon class="mr-2" />
					{allChecked.value ? "Hepsini Kaldır" : "Hepsini Seç"}
				</Button>
				<h1 class="text-xl md:text-3xl font-bold tracking-tight">
					Seçilen playlist ismi:{" "}
					<span
						class="text-transparent bg-gradient-to-r bg-clip-text from-rose-500 to-fuchsia-500

					"
					>
						{selectedPlaylistName.value}
					</span>
				</h1>

				<Button
					color="green"
					size="large"
					onClick$={$(async () => {
						// the only selected playlist
						await addPlaylists.submit({
							playlistId: Object.keys(checked).find(
								(key) => checked[key]
							) as string,
						});
					})}
				>
					Devam et
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="ml-2"
					>
						<line x1="6" x2="6" y1="4" y2="20" />
						<polygon points="10,4 20,12 10,20" />
					</svg>
				</Button>
			</div>
			<div class="grid gap-4 pt-4 grid-cols-2 lg:grid-cols-3">
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

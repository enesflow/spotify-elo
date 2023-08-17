import type {QRL} from "@builder.io/qwik";
import {$, component$, useContext, useSignal, useTask$} from "@builder.io/qwik";
import {globalAction$, Link, routeLoader$, server$, useNavigate, z, zod$,} from "@builder.io/qwik-city";
import type {Track, User} from "@prisma/client";
import {PrismaClient} from "@prisma/client";
import {SiSpotify} from "@qwikest/icons/simpleicons";
import {twMerge} from "tailwind-merge";
import {Button} from "~/components/button/button";
import {HeartIcon, QuestionMarkIcon, StarIcon, TrashIcon} from "~/components/icons";
import {Column, Row} from "~/components/layout/layout";
import {CTX} from "../layout";

const BATCH_SIZE = 20 as const;

function getRandomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const usePairsLoader = routeLoader$(async (requestEvent) => {
	const prisma = new PrismaClient();
	const user = (await requestEvent.sharedMap.get("user")) as User;

	const songs = await prisma.track.findMany({
		where: {
			userId: user.id,
		},
		orderBy: {
			elo: "desc",
		},
	});

	// we will present many questions, 2 by 2 (song1 vs song2)

	const length = songs.length; // -1 so that we dont go out of bounds

	// select 20 pairs of songs
	let pairs: [Track, Track][] = [];
	let batchSize = BATCH_SIZE as number;
	batchSize = Math.min(batchSize, length);
	if (length > 1 && batchSize > 0) {
		for (let i = 0; i < batchSize; i++) {
			const rand = getRandomInt(0, length - 1);
			const song1 = songs[rand];
			const song2 = songs[rand + 1];
			pairs.push([song1, song2]);
		}
	}
	// make it unique
	pairs = pairs.filter(
		(pair, index) =>
			pairs.findIndex((pair2) => pair2[0]!.id === pair[0]!.id) === index
	);
	await prisma.$disconnect();

	return pairs as [Track, Track][];
});

export const chooseServer = server$(async function (data: {
	trackId: string;
	rivalId: string;
	user: User;
	amplify: boolean;
}) {
	const prisma = new PrismaClient();
	const track = await prisma.track.findUnique({
		where: {
			id: data.trackId,
		},
	});
	const rival = await prisma.track.findUnique({
		where: {
			id: data.rivalId,
		},
	});
	if (!track || !rival) {
		throw new Error("Invalid track or rival");
	}
	// calculate probability of winning
	const aw = 1 / (1 + 10 ** ((rival.elo - track.elo) / 400));
	const bw = 1 - aw;

	// calculate new elo
	const k = data.amplify ? 128 : 32;
	const da = k * (1 - aw);
	const db = k * (0 - bw);

	console.log("Incrementing elo by", da, db, "for", track.name, "vs", rival.name, "with", data.amplify ? "amplify" : "no amplify");

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
	await prisma.track.update({
		where: {
			id: rival.id,
		},
		data: {
			elo: {
				increment: db,
			},
			won: {
				increment: db > 0 ? 1 : 0,
			},
			lost: {
				increment: db < 0 ? 1 : 0,
			},
		},
	});
	await prisma.user.update({
		where: {
			id: data.user.id,
		},
		data: {
			answered: {
				increment: 1,
			},
		},
	});

	await prisma.$disconnect();

	return {
		status: "success",
	};
});

export const useDeleteTrack = globalAction$(
	async (data) => {
		const prisma = new PrismaClient();
		await prisma.track.delete({
			where: {
				id: data.trackId,
			},
		});
		await prisma.$disconnect();
	},
	zod$({
		trackId: z.string(),
	})
);

export const DeleteTrack = component$<{
	trackId: string;
	size?: "xsmall" | "large";
	compact?: boolean;
}>(({compact, trackId, size = "large"}) => {
	const deleteAction = useDeleteTrack();
	const deleteClicked = useSignal<boolean>(false);
	useTask$(({track}) => {
		track(() => trackId);
		deleteClicked.value = false;
	})
	return <Button
		size={size}
		color={deleteClicked.value ? "red" : "pink"}
		buttonClass="gap-1"
		class={
			compact ? "aspect-square" : ""
		}
		onClick$={$(async () => {
			if (deleteClicked.value) {
				await deleteAction.submit({
					trackId: trackId,
				});
				deleteClicked.value = false;
			} else deleteClicked.value = true;
		})}
	>
		{
			deleteClicked.value ? <QuestionMarkIcon/> : <TrashIcon/>
		}
			{!compact && (deleteClicked.value ? "Emin misin?" : "Sil")}
	</Button>
});

export const STrack = component$<{
	track: Track | undefined;
	select$?: QRL<(...args: any[]) => any>;
	selectAmp$?: QRL<(...args: any[]) => any>;
	deleteAction: ReturnType<typeof useDeleteTrack>;
}>(({track, select$, selectAmp$}) => {
	// return <li>{playlist.name}</li>;
	// const checked = useSignal(allChecked.value);
	if (!track) return <div>oops</div>;
	return (
		<span
			// href={playlist.external_urls.spotify}
			class={twMerge(
				"w-full flex-grow text-center md:text-left h-full flex flex-col items-center bg-white border-gray-200 border-4 rounded-xl shadow md:flex-row hover:bg-gray-100"
			)}
		>
			<img
				class="box-border object-cover rounded-t-lg aspect-[2/1] md:aspect-square md:h-full w-full md:max-h-full md:max-w-[50%] md:w-auto md:rounded-none md:rounded-l-lg"
				src={track.image}
				alt={track.name}
				width="640"
				height="640"
				loading="lazy"
			/>
			<div class="flex flex-col justify-between p-4 leading-normal">
				<Link
					class="hover:text-[#1DB954] text-gray-900 mb-2 text-2xl font-bold tracking-tight flex items-center md:justify-start justify-center"
					href={track.url}
					target="_blank"
				>
					<SiSpotify class="mr-2 min-w-[2rem]"/>
					{track.name}
				</Link>
				<p class="mb-3 font-normal text-gray-700 text-xl">
					{track.artist}
				</p>
				<div class="flex gap-2 flex-wrap">
					<Button size="large" buttonClass="gap-1" color="green" onClick$={select$}>
						<StarIcon/>
						Bu güzel
					</Button>
					<Button size="large" buttonClass="gap-1" color="blue" onClick$={selectAmp$}>
						<HeartIcon/>
						Bu çok daha güzel (x4)
					</Button>
					<DeleteTrack trackId={track.id}/>
				</div>
			</div>
		</span>
	);
});

export default component$(() => {
	const pairs = usePairsLoader().value.filter((pair) => pair[0] && pair[1]);
	const deleteAction = useDeleteTrack();
	const index = useSignal(0);
	const nav = useNavigate();
	const maxSkipClicked = 3 as const;
	const skipClicked = useSignal(0); // <- if more than 3 times, lock
	const loading = useSignal(false);
	const user = useContext(CTX).user;

	const skip = $(async () => {
		if (skipClicked.value >= maxSkipClicked) {
			return;
		}
		if (index.value + 1 >= pairs.length) {
			await nav(); // <- Refresh
			index.value = 0;
			return;
		}
		index.value++;
	});
	const choose = $(async (trackIndex: 0 | 1, amplify: boolean) => {
		loading.value = true;
		skipClicked.value = 0;
		console.log({
			trackId: pairs[index.value][trackIndex].name,
			rivalId: pairs[index.value][1 - trackIndex].name,
			user,
		});
		await chooseServer({
			trackId: pairs[index.value][trackIndex].id,
			rivalId: pairs[index.value][1 - trackIndex].id,
			user,
			amplify,
		});
		user.answered++;
		await skip();
		loading.value = false;
	});

	return (
		<div>
			{index.value < pairs.length ? (
				<div>
					<Column class="gap-4 md:flex-row">
						<STrack
							track={pairs[index.value][0]}
							select$={$(async () => {
								choose(0, false);
							})}
							selectAmp$={$(async () => {
								choose(0, true);
							})}
							deleteAction={deleteAction}
						/>

						<STrack
							track={pairs[index.value][1]}
							select$={$(async () => {
								choose(1, false);
							})}
							selectAmp$={$(async () => {
								choose(1, true);
							})}
							deleteAction={deleteAction}
						/>
					</Column>

					<Row class="justify-center mt-2">
						<Button
							size="large"
							color="purple"
							onClick$={$(async () => {
								await skip();
								skipClicked.value++;
							})}
							class="text-2xl"
							disabled={
								loading.value ||
								skipClicked.value >= maxSkipClicked
							}
						>
							{skipClicked.value >= maxSkipClicked ? (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
									Seç artık
								</>
							) : (
								<>
									<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
									Seçemem
								</>
							)}
						</Button>
					</Row>
				</div>
			) : (
				<Column class="items-center justify-center">
					Şarkılar bitti.
				</Column>
			)}
		</div>
	);
});

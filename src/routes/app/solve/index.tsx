import type { QRL } from "@builder.io/qwik";
import { $, component$, useContext, useSignal } from "@builder.io/qwik";
import {
	Link,
	routeAction$,
	routeLoader$,
	server$,
	useNavigate,
	z,
	zod$,
} from "@builder.io/qwik-city";
import type { Track, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { LuHeart, LuLock, LuSkipForward, LuTrash } from "@qwikest/icons/lucide";
import { SiSpotify } from "@qwikest/icons/simpleicons";
import { twMerge } from "tailwind-merge";
import { Button } from "~/components/button/button";
import { Column, Row } from "~/components/layout/layout";
import { CTX } from "../layout";

const BATCH_SIZE = 15 as const;

function generateRandomNumbers(count: number, max: number) {
	function getRandomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	const minDifference = 2 as const;

	if (count > max || count <= 0) {
		throw new Error("Invalid input: count should be between 1 and max.");
	}

	const result = [];
	let previousNumber = getRandomInt(1, max);
	result.push(previousNumber);

	for (let i = 1; i < count; i++) {
		let newNumber;

		// Loop until a non-repeating and non-consecutive number is found
		do {
			newNumber = getRandomInt(0, max);
		} while (
			result.includes(newNumber) ||
			Math.abs(newNumber - previousNumber) <= minDifference
		);

		result.push(newNumber);
		previousNumber = newNumber;
	}

	return result;
}

export const usePairsLoader = routeLoader$(async (requestEvent) => {
	const prisma = new PrismaClient();
	const user = (await await requestEvent.sharedMap.get("user")) as User;

	const songs = await prisma.track.findMany({
		where: {
			playlist: {
				userId: user.id,
			},
		},
		orderBy: {
			elo: "desc",
		},
	});

	// we will present many questions, 2 by 2 (song1 vs song2)

	const length = songs.length - 1; // -1 so that we dont go out of bounds

	// select 20 pairs of songs
	let pairs = [];
	const randomNumbers = generateRandomNumbers(BATCH_SIZE, length);
	for (let i = 0; i < randomNumbers.length; i++) {
		const song1 = songs[randomNumbers[i]];
		const song2 = songs[randomNumbers[i] + 1];
		pairs.push([song1, song2]);
	}
	pairs = pairs.filter((pair) => pair[0] && pair[1]);
	await prisma.$disconnect();

	return pairs;
});

export const chooseServer = server$(async function (data: {
	trackId: string;
	rivalId: string;
	user: User;
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
	const k = 32;
	const da = k * (1 - aw);
	const db = k * (0 - bw);

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

export const useDeleteTrack = routeAction$(
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

export const STrack = component$<{
	track: Track;
	onClick$?: QRL<(...args: any[]) => any>;
	deleteAction: ReturnType<typeof useDeleteTrack>;
}>(({ track, onClick$, deleteAction }) => {
	// return <li>{playlist.name}</li>;
	// const checked = useSignal(allChecked.value);
	const deleteClicked = useSignal(false);
	return (
		<span
			// href={playlist.external_urls.spotify}
			class={twMerge(
				"w-full flex-grow text-center md:text-left h-full flex flex-col items-center bg-white border-gray-200 border-4 rounded-xl shadow md:flex-row hover:bg-gray-100"
			)}
		>
			<img
				class="box-border object-cover rounded-t-lg h-96 md:h-full md:max-w-[50%] md:rounded-none md:rounded-l-lg"
				src={track.image}
				alt={track.name}
				width="640"
				height="640"
				loading="lazy"
			/>
			<div class="flex flex-col justify-between p-4 leading-normal">
				<Link
					class="hover:text-[#1DB954] text-gray-900 mb-2 text-2xl font-bold tracking-tight flex items-center justify-start"
					href={track.url}
					target="_blank"
				>
					<SiSpotify class="mr-2 min-w-[2rem]" />
					{track.name}
				</Link>
				<p class="mb-3 font-normal text-gray-700 text-xl">
					{track.artist}
				</p>
				<div class="flex gap-2">
					<Button size="large" color="green" onClick$={onClick$}>
						<LuHeart class="mr-2" />
						Bunu seçtim
					</Button>
					<Button
						size="large"
						color={deleteClicked.value ? "red" : "pink"}
						onClick$={$(async () => {
							if (deleteClicked.value) {
								await deleteAction.submit({
									trackId: track.id,
								});
								deleteClicked.value = false;
							} else deleteClicked.value = true;
						})}
					>
						<LuTrash class="mr-2" />
						{deleteClicked.value ? "Emin misin?" : "Sil"}
					</Button>
				</div>
			</div>
		</span>
	);
});

export default component$(() => {
	const pairs = usePairsLoader().value;
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
		skipClicked.value++;
		if (index.value + 1 >= pairs.length) {
			await nav(); // <- Refresh
			index.value = 0;
			return;
		}
		index.value++;
	});
	const choose = $(async (trackIndex: 0 | 1) => {
		console.log(user);
		loading.value = true;
		skipClicked.value = 0;
		await chooseServer({
			trackId: pairs[index.value][trackIndex].id,
			rivalId: pairs[index.value][1 - trackIndex].id,
			user,
		});
		user.answered++;
		await skip();
		loading.value = false;
	});

	return (
		<div>
			<Column class="gap-4 md:flex-row">
				<STrack
					track={pairs[index.value][0]}
					onClick$={$(async () => {
						await choose(0);
					})}
					deleteAction={deleteAction}
				/>
				<STrack
					track={pairs[index.value][1]}
					onClick$={$(async () => {
						await choose(1);
					})}
					deleteAction={deleteAction}
				/>
			</Column>
			<Row class="justify-center mt-2">
				<Button
					size="large"
					color="purple"
					onClick$={skip}
					class="text-2xl"
					disabled={
						loading.value || skipClicked.value >= maxSkipClicked
					}
				>
					{skipClicked.value >= maxSkipClicked ? (
						<>
							<LuLock class="mr-2" />
							Seç artık
						</>
					) : (
						<>
							<LuSkipForward class="mr-2" />
							Seçemem
						</>
					)}
				</Button>
			</Row>
		</div>
	);
});

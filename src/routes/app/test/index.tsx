import { component$, $ } from "@builder.io/qwik";
import { routeAction$ } from "@builder.io/qwik-city";
import { request } from "../../../helpers/request";

export const useDeleteAllLikedAlbumsFromUsersLibrary = routeAction$(
	async (_, requestEvent) => {
		return; // this is dangerous, so don't run it
		for (let i = 0; i < 10; ++i) {
			const albums: any = await request(
				requestEvent,
				"me/albums?limit=50"
			);
			const albumIds: string[] = albums.items.map(
				(album: any) => album.album.id
			);
			console.log("Length: ", albumIds.length);

			let offset = 0;
			const step = 15;

			/* await request(
			requestEvent,
			"me/albums?ids=" + first,
			{
				method: "DELETE",
			},
			"DELETE"
		); */

			do {
				const ids = albumIds.slice(offset, offset + step).join(",");
				await request(
					requestEvent,
					"me/albums?ids=" + ids,
					{
						method: "DELETE",
					},
					"DELETE"
				);
				offset += step;
			} while (offset < albumIds.length);
		}
	}
);

export default component$(() => {
	const x = useDeleteAllLikedAlbumsFromUsersLibrary();
	return (
		<div>
			<button
				onClick$={$(async () => {
					await x.submit();
				})}
			>
				Click me
			</button>
		</div>
	);
});

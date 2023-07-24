import type { QwikJSX } from "@builder.io/qwik";
import { component$, useStylesScoped$ } from "@builder.io/qwik";
import { TbLoader } from "@qwikest/icons/tablericons";
import { twMerge } from "tailwind-merge";
import styles from "./spinner.css?inline";

type HTMLProps = QwikJSX.IntrinsicElements["div"];

const sizes = {
	xsmall: "w-3 h-3",
	small: "w-4 h-4",
	medium: "w-6 h-6",
	large: "w-7 h-7",
};

const colors = {
	red: "text-rose-500",
	blue: "text-blue-500",
	green: "text-emerald-500",
	yellow: "text-yellow-500",
	orange: "text-orange-500",
	purple: "text-indigo-500",
	pink: "text-pink-500",
	black: "text-neutral-950",
	white: "text-white",
	none: "text-transparent",
};

interface SpinnerProps {
	size?: keyof typeof sizes;
	color?: keyof typeof colors;
}

export const Spinner = component$<SpinnerProps & HTMLProps>((props) => {
	useStylesScoped$(styles);
	const rest = { ...props };
	delete rest.class;
	delete rest.size;
	return (
		<div class="flex flex-row absolute spinner">
			{/* <div
				class={twMerge(
					"block m-auto border-spacing-3 border-dotted rounded-full animate-spin",
					sizes[props.size ?? "medium"],
					colors[props.color ?? "white"],
					props.class?.toString() ?? ""
				)}
			></div> */}
			<TbLoader
				class={twMerge(
					"block m-auto animate-spin",
					sizes[props.size ?? "medium"],
					colors[props.color ?? "white"],
					props.class?.toString() ?? ""
				)}
			/>
		</div>
	);
});

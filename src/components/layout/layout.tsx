import { Slot, component$, type QwikJSX } from "@builder.io/qwik";
import { twMerge } from "tailwind-merge";

type DivHTMLProps = Omit<QwikJSX.IntrinsicElements["div"], "children">;
export const Row = component$<DivHTMLProps>((props) => {
	const rest = { ...props };
	delete rest.class;
	return (
		<div
			class={twMerge(
				"flex flex-row items-center overflow-hidden relative w-full",
				props.class?.toString()
			)}
			{...rest}
		>
			<Slot />
		</div>
	);
});

export const Column = component$<DivHTMLProps>((props) => {
	const rest = { ...props };
	delete rest.class;
	return (
		<div
			class={twMerge(
				"flex flex-col items-center overflow-hidden relative w-full",
				props.class?.toString()
			)}
			{...rest}
		>
			<Slot />
		</div>
	);
});

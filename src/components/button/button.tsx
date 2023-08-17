import type { QRL, QwikJSX } from "@builder.io/qwik";
import {
	$,
	Slot,
	component$,
	useSignal,
	useStylesScoped$,
} from "@builder.io/qwik";
import { twMerge } from "tailwind-merge";
import { Spinner } from "../spinner/spinner";
import styles from "./button.css?inline";

const colors = {
	red: "border-2 border-rose-500 text-rose-700 bg-rose-50 hover:bg-rose-200",
	blue: "border-2 border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-200",
	green: "border-2 border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-200",
	yellow: "border-2 border-yellow-500 text-yellow-700 bg-yellow-50 hover:bg-yellow-200",
	orange: "border-2 border-orange-500 text-orange-700 bg-orange-50 hover:bg-orange-200",
	purple: "border-2 border-indigo-500 text-indigo-700 bg-indigo-50 hover:bg-indigo-200",
	pink: "border-2 border-pink-500 text-pink-700 bg-pink-50 hover:bg-pink-200",
	black: "bg-white border-2 border-neutral-950 text-neutral-950",
	white: "bg-white text-neutral-950",
	none: "bg-transparent text-neutral-950",
};

const sizes = {
	xsmall: "py-1 px-1.5 text-sm",
	small: "py-1 px-1.5",
	medium: "py-1 px-2",
	large: "py-2 px-3",
};

type HTMLProps = Omit<QwikJSX.IntrinsicElements["button"], "children">;
interface ButtonProps {
	loading?: boolean;
	onClick$?: QRL<(...args: any[]) => any>;
	color?: keyof typeof colors;
	size?: keyof typeof sizes;
	buttonClass?: string;
}

export const Button = component$<ButtonProps & HTMLProps>((props) => {
	useStylesScoped$(styles);
	// remove all the fields in props that belong to the ButtonProps interface
	const rest = { ...props };
	const loading = useSignal(false);

	delete rest.class;
	delete rest.color;
	delete rest.size;
	delete rest.onClick$;
	delete rest.loading;
	delete rest.buttonClass;
	delete rest.disabled;

	if (!rest.type) rest.type = "button"; // avoid submit button by default

	return (
		<button
			{...rest}
			onClick$={$(async () => {
				if (
					props.disabled ||
					loading.value ||
					props.loading ||
					!props.onClick$
				)
					return;
				loading.value = true;
				await props.onClick$();
				loading.value = false;
			})}
			class={twMerge(
				"flex flex-row justify-center items-center relative text-white font-medium rounded-lg text-sm text-center disabled:border-opacity-50 disabled:text-opacity-50 disabled:bg-opacity-50 disabled:cursor-not-allowed transition duration-150 ease-out",
				sizes[props.size ?? "medium"],
				colors[props.color ?? "none"],
				props.class?.toString() ?? ""
			)}
			type={rest.type}
			disabled={props.disabled || loading.value || props.loading}
		>
			{(loading.value || props.loading) && (
				<Spinner
					color={props.color === "none" ? "black" : props.color}
				/>
			)}
			<div
				class={twMerge(
					"button flex flex-row justify-center items-center relative",
					loading.value || props.loading ? "clicked" : "",
					props.buttonClass?.toString() ?? ""
				)}
			>
				<Slot />
			</div>
		</button>
	);
});

import {
	createEvent,
	createStore,
	sample,
	type EventCallable,
	type Store,
	type StoreWritable,
} from 'effector';
import { readonly } from 'patronum';

export type State<TData = unknown> = {
	$state: StoreWritable<TData>;
	setState: EventCallable<TData>;
	'@@unitShape': () => {
		state: Store<TData>;
		setState: EventCallable<TData>;
	};
};

export const createState = <TData = unknown>(init: TData): State<TData> => {
	const $state = createStore<TData>(init);

	const setState = createEvent<TData>();

	sample({
		clock: setState,
		target: $state,
	});

	return {
		$state,
		setState,
		'@@unitShape': () => ({
			state: readonly($state),
			setState,
		}),
	};
};

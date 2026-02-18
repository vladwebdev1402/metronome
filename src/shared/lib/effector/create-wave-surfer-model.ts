/* eslint-disable import/extensions */
import {
	createStore,
	createEvent,
	type Store,
	type EventCallable,
	attach,
	sample,
	type Event,
} from 'effector';
import type WaveSurfer from 'wavesurfer.js';
import { readonly } from 'patronum';
import { chain, disable, enable } from './operators';
import { toggle } from './operators/toggle';

export type WaveSurferModel = {
	$waveSurfer: Store<WaveSurfer | null>;
	$paused: Store<boolean>;
	$volume: Store<number>;
	setWaveSurfer: EventCallable<WaveSurfer | null>;
	pause: EventCallable<void>;
	playPause: EventCallable<void>;
	play: EventCallable<void>;
	setVolume: EventCallable<number>;
	reset: EventCallable<void>;
	setTime: EventCallable<number>;
	load: EventCallable<string>;
	onDrag: Event<number>;
	audioprocess: Event<number>;
	init: Event<void>;
	ready: Event<number>;
	'@@unitShape': () => {
		waveSurfer: Store<WaveSurfer | null>;
		paused: Store<boolean>;
		volume: Store<number>;
		setWaveSurfer: EventCallable<WaveSurfer | null>;
		pause: EventCallable<void>;
		playPause: EventCallable<void>;
		play: EventCallable<void>;
		setVolume: EventCallable<number>;
		reset: EventCallable<void>;
		setTime: EventCallable<number>;
		load: EventCallable<string>;
		onDrag: Event<number>;
		audioprocess: Event<number>;
		init: Event<void>;
		ready: Event<number>;
	};
};

export const createWaveSurferModel = (): WaveSurferModel => {
	const $waveSurfer = createStore<WaveSurfer | null>(null);

	const $paused = createStore(true);

	const $volume = createStore(1);

	const setWaveSurfer = createEvent<WaveSurfer | null>();

	const setVolume = createEvent<number>();

	const playPause = createEvent();

	const play = createEvent();

	const pause = createEvent();

	const finished = createEvent();

	const onDrag = createEvent<number>();

	const setTime = createEvent<number>();

	const reset = createEvent();

	const load = createEvent<string>();

	const audioprocess = createEvent<number>();

	const init = createEvent();

	const ready = createEvent<number>();

	const bindEventsFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer) => {
			waveSurfer?.on('finish', () => finished());

			waveSurfer?.on('drag', onDrag);

			waveSurfer?.on('audioprocess', audioprocess);

			waveSurfer?.on('init', init);

			waveSurfer?.on('ready', ready);
		},
	});

	const playPauseFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer) => waveSurfer?.playPause(),
	});

	const playFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer) => waveSurfer?.play(),
	});

	const pauseFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer) => waveSurfer?.pause(),
	});

	const setVolumeFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer, volume: number) => waveSurfer?.setVolume(volume),
	});

	const resetFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer) => waveSurfer?.setTime(0),
	});

	const setTimeFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer, time: number) => waveSurfer?.setTime(time),
	});

	const loadFx = attach({
		source: $waveSurfer,
		effect: (waveSurfer, url: string) => waveSurfer?.load(url),
	});

	sample({
		clock: $waveSurfer,
		filter: Boolean,
		target: bindEventsFx,
	});

	chain(reset, resetFx);

	chain(setWaveSurfer, $waveSurfer);

	chain(setVolume, setVolumeFx);

	chain(setVolume, $volume);

	chain(playPause, playPauseFx);

	toggle(playPause, $paused);

	chain(play, playFx);

	disable(play, $paused);

	chain(pause, pauseFx);

	enable(pause, $paused);

	enable(finished, $paused);

	chain(setTime, setTimeFx);

	chain(load, loadFx);

	return {
		$waveSurfer,
		$paused,
		$volume,
		setWaveSurfer,
		playPause,
		play,
		pause,
		setVolume,
		reset,
		setTime,
		load,
		onDrag: readonly(onDrag),
		audioprocess: readonly(audioprocess),
		init: readonly(init),
		ready: readonly(ready),
		'@@unitShape': () => ({
			waveSurfer: readonly($waveSurfer),
			paused: readonly($paused),
			volume: readonly($volume),
			setWaveSurfer,
			playPause,
			play,
			pause,
			setVolume,
			reset,
			setTime,
			load,
			onDrag: readonly(onDrag),
			audioprocess: readonly(audioprocess),
			init: readonly(init),
			ready: readonly(ready),
		}),
	};
};

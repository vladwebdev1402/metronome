/* eslint-disable effector/no-getState */
import {
	attach,
	createEffect,
	createEvent,
	createStore,
	is,
	sample,
	type Event,
	type EventCallable,
	type Store,
	type StoreWritable,
} from 'effector';
import { and, debug, not, readonly, spread } from 'patronum';
import { chain, disable, enable } from './operators';

export type CreateAudioEngineParams = {
	setup: Event<void>;
} & AudioContextOptions;

export type CreateAudioParams = {
	src: string | AudioBuffer | StoreWritable<string | AudioBuffer | null>;
	loop?: boolean;
};

export type AudioEngine = {
	$audioCtx: Store<AudioContext>;
};

export type AudioModel = {
	$volume: Store<number>;
	$startAt: Store<number>;
	$pausedAt: Store<number>;
	$isPaused: Store<boolean>;
	$isPlaying: Store<boolean>;
	$ready: Store<boolean>;
	$loop: Store<boolean>;
	pause: EventCallable<void>;
	resume: EventCallable<void>;
	play: EventCallable<void>;
	seekTo: EventCallable<number>;
	setLoop: EventCallable<boolean>;
	setVolume: EventCallable<number>;
	dispose: EventCallable<void>;
	stop: EventCallable<void>;
	finished: Event<void>;
	finishedByStop: Event<void>;
	finishedByEnd: Event<void>;
	finishedByPause: Event<void>;
	ready: Event<void>;
	failure: Event<Error>;
	'@@unitShape': () => {
		volume: Store<number>;
		startAt: Store<number>;
		pausedAt: Store<number>;
		isPaused: Store<boolean>;
		isPlaying: Store<boolean>;
		loop: Store<boolean>;
		ready: Store<boolean>;
		pause: EventCallable<void>;
		resume: EventCallable<void>;
		play: EventCallable<void>;
		seekTo: EventCallable<number>;
		setLoop: EventCallable<boolean>;
		setVolume: EventCallable<number>;
		stop: EventCallable<void>;
	};
};

export const createAudioEngine = ({
	latencyHint = 'interactive',
	sampleRate = 48000,
	setup,
}: CreateAudioEngineParams): [AudioEngine, typeof createAudio] => {
	const $audioCtx = createStore(new AudioContext({ sampleRate, latencyHint }));

	const createAudio = ({ src, loop }: CreateAudioParams): AudioModel => {
		const $audioBufferSourceNode = createStore<AudioBufferSourceNode | null>(null);

		const $audioBuffer = createStore<AudioBuffer | null>(null);

		const $gain = createStore<GainNode | null>(null);

		const $volume = createStore(1);

		const $startAt = createStore(0);

		const $pausedAt = createStore(0);

		const $isPaused = createStore(false);

		const $isPlaying = createStore(false);

		const $loop = createStore(loop ?? false);

		const $ready = createStore(false);

		const $offset = createStore(0);

		const dispose = createEvent();

		const ready = createEvent();

		const pause = createEvent();

		const resume = createEvent();

		const play = createEvent();

		const stop = createEvent();

		const seekTo = createEvent<number>();

		const setLoop = createEvent<boolean>();

		const setVolume = createEvent<number>();

		const finished = createEvent();

		const finishedByStop = createEvent();

		const finishedByEnd = createEvent();

		const finishedByPause = createEvent();

		const failure = createEvent<Error>();

		const setupWithStoreFx = attach({
			source: src as StoreWritable<string | AudioBuffer | null>,
			effect: (source) => source,
		});

		const setupWithPrimitiveFx = createEffect(() => src as string | AudioBuffer | null);

		const setupFx = attach({
			source: $audioCtx,
			effect: async (audioCtx, actualSrc: string | AudioBuffer | null) => {
				if (actualSrc === null) {
					throw new Error(`Failed to createAudio: src is null`);
				}

				const gain = audioCtx.createGain();

				gain.connect(audioCtx.destination);

				let audioBuffer: AudioBuffer | null = actualSrc instanceof AudioBuffer ? actualSrc : null;

				if (typeof actualSrc === 'string') {
					const response = await fetch(actualSrc);

					if (!response.ok) {
						throw new Error(`Failed to fetch: ${response.statusText}`);
					}

					const arrayBuffer = await response.arrayBuffer();

					audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
				}

				return { audioBuffer, gain };
			},
		});

		const setVolumeFx = attach({
			source: [$gain, $audioCtx] as const,
			effect: ([gain, audioCtx], volume: number) => {
				if (!gain) {
					throw new Error(`Failed to setVolume: GainNode is null`);
				}

				gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.05);

				return volume;
			},
		});

		const playFx = attach({
			source: [$audioCtx, $gain, $audioBuffer, $audioBufferSourceNode, $loop, $offset] as const,
			effect: ([audioCtx, gain, audioBuffer, audioBufferSourceNode, loopValue, offset]) => {
				if (!audioBuffer) {
					throw new Error(`Failed to play: AudioBuffer is null`);
				}

				if (!gain) {
					throw new Error(`Failed to play: GainNode is null`);
				}

				if (audioBufferSourceNode) {
					audioBufferSourceNode.stop();
					audioBufferSourceNode.disconnect();

					audioBufferSourceNode.metadata.reply = true;
				}

				const newSource = audioCtx.createBufferSource();

				newSource.metadata = {
					paused: false,
					stopped: false,
					reply: false,
				};

				const startAt = audioCtx.currentTime;

				newSource.buffer = audioBuffer;

				newSource.connect(gain);

				// newSource.start(startAt, offset);

				newSource.loop = loopValue;

				newSource.onended = () => {
					finished();

					if (newSource.metadata.stopped) {
						finishedByStop();

						return;
					}

					if (newSource.metadata.paused) {
						finishedByPause();

						return;
					}

					if (!newSource.metadata.reply) finishedByEnd();
				};

				return { source: newSource, startAt };
			},
		});

		const setLoopFx = attach({
			source: $audioBufferSourceNode,
			effect: (audioBufferSourceNode, value: boolean) => {
				if (audioBufferSourceNode) audioBufferSourceNode.loop = value;

				return value;
			},
		});

		const pauseFx = attach({
			source: [$audioCtx, $audioBufferSourceNode, $startAt, $offset] as const,
			effect: ([audioCtx, audioBufferSourceNode, startAt, offset]) => {
				const currentPos = offset + audioCtx.currentTime - startAt;

				audioBufferSourceNode?.stop();
				audioBufferSourceNode?.disconnect();

				if (audioBufferSourceNode) {
					audioBufferSourceNode.metadata.paused = true;
				}

				return currentPos;
			},
		});

		// FIXME: сделать эффект для создания AudioSource
		const resumeFx = attach({
			source: [$audioBufferSourceNode, $audioCtx, $gain, $audioBuffer, $loop, $pausedAt] as const,
			effect: ([audioBufferSourceNode, audioCtx, gain, audioBuffer, loopValue, pausedAt]) => {
				if (!audioBuffer) {
					throw new Error(`Failed to resume: AudioBuffer is null`);
				}

				if (!gain) {
					throw new Error(`Failed to resume: GainNode is null`);
				}

				if (audioBufferSourceNode) {
					audioBufferSourceNode.metadata.paused = false;
				}

				const newSource = audioCtx.createBufferSource();

				newSource.metadata = {
					paused: false,
					stopped: false,
					reply: false,
				};

				newSource.buffer = audioBuffer;

				newSource.connect(gain);

				newSource.start(audioCtx.currentTime, pausedAt);

				newSource.loop = loopValue;

				newSource.onended = () => {
					finished();

					if (newSource.metadata.stopped) {
						finishedByStop();

						return;
					}

					if (newSource.metadata.paused) {
						finishedByPause();

						return;
					}

					if (!newSource.metadata.reply) finishedByEnd();
				};

				return newSource;
			},
		});

		const stopFx = attach({
			source: $audioBufferSourceNode,
			effect: (audioBufferSourceNode) => {
				if (audioBufferSourceNode) {
					audioBufferSourceNode.stop();
					audioBufferSourceNode.disconnect();

					audioBufferSourceNode.metadata = {
						...audioBufferSourceNode.metadata,
						stopped: true,
					};
				}
			},
		});

		const createAudioBufferFx = attach({
			source: [$audioCtx, $gain, $audioBuffer, $audioBufferSourceNode, $loop] as const,
			effect: ([audioCtx, gain, audioBuffer, audioBufferSourceNode, loopValue]) => {
				if (!audioBuffer) {
					throw new Error(`Failed to play: AudioBuffer is null`);
				}

				if (!gain) {
					throw new Error(`Failed to play: GainNode is null`);
				}

				if (audioBufferSourceNode) {
					audioBufferSourceNode.stop();
					audioBufferSourceNode.disconnect();
				}

				const newSource = audioCtx.createBufferSource();

				newSource.metadata = {
					paused: false,
					stopped: false,
					reply: false,
				};

				newSource.buffer = audioBuffer;

				newSource.connect(gain);

				newSource.loop = loopValue;

				newSource.onended = () => {
					finished();

					if (newSource.metadata.stopped) {
						finishedByStop();

						return;
					}

					if (newSource.metadata.paused) {
						finishedByPause();

						return;
					}

					if (!newSource.metadata.reply) finishedByEnd();
				};

				return newSource;
			},
		});

		chain(setupFx.doneData, ready);

		enable(ready, $ready);

		chain(setLoop, $loop);

		sample({
			clock: setupFx.doneData,
			target: spread({
				audioBuffer: $audioBuffer,
				gain: $gain,
			}),
		});

		sample({
			clock: setup,
			filter: () => is.store(src),
			target: setupWithStoreFx,
		});

		sample({
			clock: setup,
			filter: () => !is.store(src),
			target: setupWithPrimitiveFx,
		});

		chain(createAudioBufferFx.doneData, $audioBufferSourceNode);

		chain(setVolume, setVolumeFx);

		chain(setVolumeFx.doneData, $volume);

		chain(play, playFx);

		sample({
			clock: playFx.doneData,
			fn: ({ source }) => source,
			target: $audioBufferSourceNode,
		});

		sample({
			clock: playFx.doneData,
			fn: ({ startAt }) => startAt,
			target: $startAt,
		});

		enable(playFx.doneData, $isPlaying);

		disable(playFx.doneData, $isPaused);

		chain(playFx.doneData, $pausedAt.reinit);

		chain(setLoop, setLoopFx);

		chain(setLoopFx.doneData, $loop);

		chain(pauseFx.doneData, $audioBufferSourceNode.reinit);

		sample({
			clock: pause,
			filter: and($isPlaying, not($isPaused)),
			target: pauseFx,
		});

		enable(pauseFx.doneData, $isPaused);

		chain(pauseFx.doneData, $pausedAt);

		sample({
			clock: resume,
			filter: and($isPlaying, $isPaused),
			target: resumeFx,
		});

		disable(resumeFx.doneData, $isPaused);

		chain(resumeFx.doneData, $pausedAt.reinit);

		chain(resumeFx.doneData, $audioBufferSourceNode);

		sample({
			clock: [setupFx.failData, resumeFx.failData, pauseFx.failData, playFx.failData],
			target: failure,
		});

		chain(stop, stopFx);

		sample({
			clock: [finishedByStop, finishedByEnd],
			target: [
				$audioBufferSourceNode.reinit,
				$isPlaying.reinit,
				$isPaused.reinit,
				$startAt.reinit,
				$pausedAt.reinit,
			],
		});

		debug({ finishedByStop, finishedByEnd, finishedByPause, finished });

		return {
			$volume: readonly($volume),
			$startAt: readonly($startAt),
			$pausedAt: readonly($pausedAt),
			$isPaused: readonly($isPaused),
			$isPlaying: readonly($isPlaying),
			$loop: readonly($loop),
			$ready: readonly($ready),
			dispose,
			ready,
			pause,
			resume,
			play,
			seekTo,
			setLoop,
			setVolume,
			failure,
			stop,
			finished,
			finishedByEnd,
			finishedByStop,
			finishedByPause,
			'@@unitShape': () => ({
				volume: readonly($volume),
				startAt: readonly($startAt),
				pausedAt: readonly($pausedAt),
				isPaused: readonly($isPaused),
				isPlaying: readonly($isPlaying),
				loop: readonly($loop),
				ready: readonly($ready),
				pause,
				resume,
				play,
				seekTo,
				setLoop,
				setVolume,
				stop,
			}),
		};
	};

	return [{ $audioCtx }, createAudio];
};

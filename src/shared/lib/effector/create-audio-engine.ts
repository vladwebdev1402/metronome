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
import { and, combineEvents, debug, not, or, readonly, spread } from 'patronum';
import { chain, disable, enable } from './operators';

export type AudioSource =
	| string
	| AudioBuffer
	| null
	| StoreWritable<string | AudioBuffer | null>
	| StoreWritable<string | null>
	| StoreWritable<AudioBuffer | null>;

export type CreateAudioEngineParams = {
	setup: Event<void>;
} & AudioContextOptions;

export type CreateAudioParams = {
	src: AudioSource;
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
	$duration: Store<number>;
	$time: Store<number>;
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
		duration: Store<number>;
		time: Store<number>;
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

		const $duration = $audioBuffer.map((audioBuffer) => audioBuffer?.duration ?? 0);

		const $gain = createStore<GainNode | null>(null);

		const $volume = createStore(1);

		const $startAt = createStore(0);

		const $pausedAt = createStore(0);

		const $time = createStore(0);

		const $isPaused = createStore(false);

		const $isPlaying = createStore(false);

		const $loop = createStore(loop ?? false);

		const $ready = createStore(false);

		const $offset = createStore(0);

		const $frameCancelCb = createStore<() => void>(() => {});

		const $src = is.store(src) ? src : createStore(src);

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

		const finishedByLoop = createEvent();

		const setTime = createEvent<number>();

		const failure = createEvent<Error>();

		const bindRAFToProgressFx = attach({
			source: [
				$audioCtx,
				$frameCancelCb,
				$isPlaying,
				$isPaused,
				$startAt,
				$pausedAt,
				$duration,
				$offset,
			] as const,
			effect: ([
				audioCtx,
				frameCancelCb,
				isPlaying,
				isPaused,
				startAt,
				pausedAt,
				duration,
				offset,
			]) => {
				frameCancelCb();

				if (!isPlaying) return () => {};

				let frame: number;

				const update = () => {
					let time = 0;

					if (isPaused) {
						time = pausedAt;
					}

					if (isPlaying && !isPaused) {
						time = audioCtx.currentTime - startAt + offset;
					}

					if ($loop.getState()) {
						time %= duration;
					}

					setTime(time);

					frame = requestAnimationFrame(update);
				};

				frame = requestAnimationFrame(update);

				return () => cancelAnimationFrame(frame);
			},
		});

		const stopRAFProgressFx = attach({
			source: $frameCancelCb,
			effect: (cb) => {
				cb();
			},
		});

		const setupFx = attach({
			source: [$audioCtx, $src],
			effect: async ([audioCtx, actualSrc]) => {
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
			source: [$audioCtx, $audioBufferSourceNode, $offset] as const,
			effect: ([audioCtx, audioBufferSourceNode, offset]) => {
				if (!audioBufferSourceNode) {
					throw new Error(`Failed to play: AudioBufferSourceNode is null`);
				}

				const startAt = audioCtx.currentTime;

				audioBufferSourceNode.start(startAt, offset);

				return startAt;
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

		const resumeFx = attach({
			name: 'resumeFx',
			source: [$audioBufferSourceNode, $audioCtx, $pausedAt] as const,
			effect: ([audioBufferSourceNode, audioCtx, pausedAt]) => {
				if (!audioBufferSourceNode) {
					throw new Error(`Failed to resume: AudioBufferSourceNode is null`);
				}

				if (audioBufferSourceNode) {
					audioBufferSourceNode.metadata.paused = false;
				}

				const { currentTime } = audioCtx;

				audioBufferSourceNode.start(currentTime - pausedAt, pausedAt);

				return currentTime - pausedAt;
			},
		});

		const stopFx = attach({
			source: [$audioBufferSourceNode, $isPaused],
			effect: ([audioBufferSourceNode, isPaused]) => {
				if (audioBufferSourceNode) {
					!isPaused && audioBufferSourceNode.stop();
					audioBufferSourceNode.disconnect();

					audioBufferSourceNode.metadata = {
						...audioBufferSourceNode.metadata,
						stopped: true,
					};
				}

				if (isPaused) finishedByStop();
			},
		});

		const createAudioBufferSourceFx = attach({
			source: [
				$audioCtx,
				$gain,
				$audioBuffer,
				$audioBufferSourceNode,
				$loop,
				$isPaused,
				$isPlaying,
			] as const,
			effect: ([
				audioCtx,
				gain,
				audioBuffer,
				audioBufferSourceNode,
				loopValue,
				isPaused,
				isPlaying,
			]) => {
				if (!audioBuffer) {
					throw new Error(`Failed to play: AudioBuffer is null`);
				}

				if (!gain) {
					throw new Error(`Failed to play: GainNode is null`);
				}

				if (audioBufferSourceNode) {
					!isPaused && isPlaying && audioBufferSourceNode.stop();
					audioBufferSourceNode.disconnect();
				}

				const newSource = audioCtx.createBufferSource();

				newSource.metadata = {
					paused: false,
					stopped: false,
					reply: false,
					seek: false,
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

					if (!newSource.metadata.reply && !newSource.metadata.seek) finishedByEnd();
				};

				return newSource;
			},
		});

		const seekToFx = attach({
			source: [$audioBufferSourceNode],
			effect: ([audioBufferSourceNode]) => {
				if (audioBufferSourceNode) {
					audioBufferSourceNode.metadata.seek = true;
				}
			},
		});

		const playSeekFx = attach({
			source: [$audioBufferSourceNode, $audioCtx, $offset] as const,
			effect: ([audioBufferSourceNode, audioCtx, offset]) => {
				if (!audioBufferSourceNode) {
					throw new Error(`Failed to seek play: AudioBufferSourceNode is null`);
				}

				const { currentTime } = audioCtx;

				audioBufferSourceNode.start(currentTime, offset);

				return currentTime;
			},
		});

		chain(bindRAFToProgressFx.doneData, $frameCancelCb);

		sample({
			clock: play,
			source: $audioBufferSourceNode,
			filter: Boolean,
			target: createEffect((source: AudioBufferSourceNode) => {
				source.metadata.reply = true;
			}),
		});

		chain($src, setupFx);

		chain(setup, setupFx);

		chain(bindRAFToProgressFx.doneData, $frameCancelCb);

		chain(setTime, $time);

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

		chain(createAudioBufferSourceFx.doneData, $audioBufferSourceNode);

		chain(setVolume, setVolumeFx);

		chain(setVolumeFx.doneData, $volume);

		chain(play, createAudioBufferSourceFx);

		chain(resume, createAudioBufferSourceFx);

		chain(play, playFx);

		chain(playFx.doneData, $startAt);

		enable(playFx.doneData, $isPlaying);

		disable(playFx.doneData, $isPaused);

		chain(playFx.doneData, $pausedAt.reinit);

		sample({
			clock: playFx.doneData,
			filter: not($isPlaying),
			target: $offset.reinit,
		});

		chain(playFx.doneData, bindRAFToProgressFx);

		chain(setLoop, setLoopFx);

		chain(stop, stopFx);

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

		chain(resumeFx.doneData, $startAt);

		chain(resumeFx.doneData, bindRAFToProgressFx);

		sample({
			clock: [finishedByStop, finishedByEnd],
			target: [
				$audioBufferSourceNode.reinit,
				$isPlaying.reinit,
				$isPaused.reinit,
				$startAt.reinit,
				$pausedAt.reinit,
				$offset.reinit,
				$time.reinit,
			],
		});

		sample({
			clock: [finishedByPause, finishedByEnd, finishedByStop],
			target: stopRAFProgressFx,
		});

		chain(stopRAFProgressFx.doneData, $frameCancelCb.reinit);

		sample({
			clock: $time,
			source: { duration: $duration, loopValue: $loop },
			filter: ({ duration, loopValue }, time) => loopValue && time >= duration,
			target: finishedByLoop,
		});

		chain(seekTo, $offset);

		sample({
			clock: combineEvents({
				events: [seekToFx.doneData, createAudioBufferSourceFx.doneData],
				reset: seekTo,
			}),
			filter: not(or($isPaused, not($isPlaying))),
			target: [bindRAFToProgressFx, playSeekFx],
		});

		sample({
			clock: seekTo,
			filter: or($isPaused, not($isPlaying)),
			target: $time,
		});

		chain(seekTo, seekToFx);

		chain(seekToFx.doneData, createAudioBufferSourceFx);

		chain(playSeekFx.doneData, $startAt);

		debug({
			'setupFx.failData': setupFx.failData,
			'resumeFx.failData': resumeFx.failData,
			'pauseFx.failData': pauseFx.failData,
			'playFx.failData': playFx.failData,
			'stopFx.failData': stopFx.failData,
			'stopRAFProgressFx.failData': stopRAFProgressFx.failData,
			'createAudioBufferSourceFx.failData': createAudioBufferSourceFx.failData,
			'setVolumeFx.failData': setVolumeFx.failData,
			'setLoopFx.failData': setLoopFx.failData,
			'bindRAFToProgressFx.failData': bindRAFToProgressFx.failData,
			'seekToFx.failData': seekToFx.failData,
			'playSeekFx.failData': playSeekFx.failData,
		});

		sample({
			clock: [
				setupFx.failData,
				resumeFx.failData,
				pauseFx.failData,
				playFx.failData,
				stopFx.failData,
				stopRAFProgressFx.failData,
				createAudioBufferSourceFx.failData,
				setVolumeFx.failData,
				setLoopFx.failData,
				bindRAFToProgressFx.failData,
				seekToFx.failData,
				playSeekFx.failData,
			],
			target: failure,
		});

		return {
			$volume: readonly($volume),
			$startAt: readonly($startAt),
			$pausedAt: readonly($pausedAt),
			$isPaused: readonly($isPaused),
			$isPlaying: readonly($isPlaying),
			$loop: readonly($loop),
			$ready: readonly($ready),
			$duration: readonly($duration),
			$time: readonly($time),
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
				duration: readonly($duration),
				time: readonly($time),
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

import {
	attach,
	createEffect,
	createEvent,
	createStore,
	sample,
	type Event,
	type EventCallable,
	type Store,
} from 'effector';
import { equals, readonly } from 'patronum';
import { chain } from './operators';

export const RECORDER_STATES = {
	recording: 'recording',
	paused: 'paused',
	idle: 'idle',
} as const satisfies Record<string, string>;

export type RecordState = (typeof RECORDER_STATES)[keyof typeof RECORDER_STATES];

export type Recorder = {
	$audioChunks: Store<Blob[]>;
	$mediaRecorder: Store<MediaRecorder | null>;
	$state: Store<RecordState>;
	$isRecording: Store<boolean>;
	$isPaused: Store<boolean>;
	$isIdle: Store<boolean>;
	start: EventCallable<string>;
	stop: EventCallable<void>;
	onStop: Event<void>;
	onDataAvailable: Event<BlobEvent>;
	'@@unitShape': () => {
		audioChunks: Store<Blob[]>;
		mediaRecorder: Store<MediaRecorder | null>;
		state: Store<RecordState>;
		isRecording: Store<boolean>;
		isPaused: Store<boolean>;
		isIdle: Store<boolean>;
		start: EventCallable<string>;
		stop: EventCallable<void>;
	};
};

export const createRecorder = (): Recorder => {
	const $state = createStore<RecordState>(RECORDER_STATES.idle);

	const $isRecording = equals($state, RECORDER_STATES.recording);

	const $isPaused = equals($state, RECORDER_STATES.paused);

	const $isIdle = equals($state, RECORDER_STATES.idle);

	const $audioChunks = createStore<Blob[]>([]);

	const $mediaRecorder = createStore<MediaRecorder | null>(null);

	const onStop = createEvent();

	const stop = createEvent();

	const start = createEvent<string>();

	const onDataAvailable = createEvent<BlobEvent>();

	const startFx = createEffect(async (deviceId: string) => {
		const constraints = {
			audio: deviceId
				? { deviceId: { exact: deviceId }, noiseSuppression: false }
				: { noiseSuppression: false },
		};

		const stream = await navigator.mediaDevices.getUserMedia(constraints);

		const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

		mediaRecorder.ondataavailable = onDataAvailable;

		mediaRecorder.onstop = () => onStop();

		mediaRecorder.start();

		return mediaRecorder;
	});

	const stopFx = attach({
		source: $mediaRecorder,
		effect: (mediaRecorder) => {
			if (mediaRecorder && mediaRecorder.state === 'recording') {
				mediaRecorder.stop();

				mediaRecorder.stream.getTracks().forEach((track) => track.stop());
			}
		},
	});

	chain(start, startFx);

	chain(start, $audioChunks.reinit);

	chain(startFx.doneData, $mediaRecorder);

	sample({
		clock: startFx.doneData,
		fn: () => RECORDER_STATES.recording,
		target: $state,
	});

	chain(stop, stopFx);

	chain(stopFx.doneData, $mediaRecorder.reinit);

	sample({
		clock: stopFx.doneData,
		fn: () => RECORDER_STATES.idle,
		target: $state,
	});

	sample({
		clock: onDataAvailable,
		source: $audioChunks,
		filter: (_, event) => event.data.size > 0,
		fn: (audioChunks, event) => [...audioChunks, event.data],
		target: $audioChunks,
	});

	return {
		$audioChunks: readonly($audioChunks),
		$mediaRecorder: readonly($mediaRecorder),
		$state: readonly($state),
		$isRecording: readonly($isRecording),
		$isPaused: readonly($isPaused),
		$isIdle: readonly($isIdle),
		start,
		stop,
		onStop: readonly(onStop),
		onDataAvailable: readonly(onDataAvailable),
		'@@unitShape': () => ({
			audioChunks: readonly($audioChunks),
			mediaRecorder: readonly($mediaRecorder),
			state: readonly($state),
			isRecording: readonly($isRecording),
			isPaused: readonly($isPaused),
			isIdle: readonly($isIdle),
			start,
			stop,
		}),
	};
};

export const recorder = createRecorder();

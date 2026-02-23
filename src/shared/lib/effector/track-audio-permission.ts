import {
	createEffect,
	createEvent,
	createStore,
	type Event,
	type EventCallable,
	type Store,
} from 'effector';
import { not, readonly } from 'patronum';
import { chain, disable, enable } from './operators';

export type AudioPermission = {
	$allowed: Store<boolean>;
	$denied: Store<boolean>;
	$microphones: Store<MediaDeviceInfo[]>;
	getPermission: EventCallable<void>;
	successful: Event<MediaStream>;
	failure: Event<Error>;
	'@@unitShape': () => {
		allowed: Store<boolean>;
		denied: Store<boolean>;
		microphones: Store<MediaDeviceInfo[]>;
		getPermission: EventCallable<void>;
	};
};

export const trackAudioPermission = (): AudioPermission => {
	const $allowed = createStore(false);

	const $denied = not($allowed);

	const $microphones = createStore<MediaDeviceInfo[]>([]);

	const getPermission = createEvent();

	const successful = createEvent<MediaStream>();

	const failure = createEvent<Error>();

	const getPermissionFx = createEffect(() =>
		navigator.mediaDevices.getUserMedia({
			audio: {
				sampleRate: 44100,
				sampleSize: 16,
				echoCancellation: false,
				noiseSuppression: false,
				autoGainControl: false,
			},
		}),
	);

	const getMicrophonesFx = createEffect(async () => {
		const allDevices = await navigator.mediaDevices.enumerateDevices();

		const microphones = allDevices.filter((device) => device.kind === 'audioinput');

		return microphones;
	});

	chain(getPermission, getPermissionFx);

	chain(getPermissionFx.doneData, successful);

	chain(getPermissionFx.failData, failure);

	enable(successful, $allowed);

	disable(failure, $allowed);

	chain(successful, getMicrophonesFx);

	chain(getMicrophonesFx.doneData, $microphones);

	return {
		$allowed,
		$denied,
		$microphones,
		failure,
		successful,
		getPermission,
		'@@unitShape': () => ({
			allowed: readonly($allowed),
			denied: $denied,
			microphones: readonly($microphones),
			getPermission,
		}),
	};
};

export const audioPermission = trackAudioPermission();

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
	getPermission: EventCallable<void>;
	successful: Event<MediaStream>;
	failure: Event<Error>;
	'@@unitShape': () => {
		allowed: Store<boolean>;
		denied: Store<boolean>;
		getPermission: EventCallable<void>;
		successful: Event<MediaStream>;
		failure: Event<Error>;
	};
};

export const trackAudioPermission = (): AudioPermission => {
	const $allowed = createStore(false);

	const $denied = not($allowed);

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

	chain(getPermission, getPermissionFx);

	chain(getPermissionFx.doneData, successful);

	chain(getPermissionFx.failData, failure);

	enable(successful, $allowed);

	disable(failure, $allowed);

	return {
		$allowed,
		$denied,
		failure,
		successful,
		getPermission,
		'@@unitShape': () => ({
			allowed: readonly($allowed),
			denied: $denied,
			failure: readonly(failure),
			successful: readonly(successful),
			getPermission,
		}),
	};
};

export const audioPermission = trackAudioPermission();

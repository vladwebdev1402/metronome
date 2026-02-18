/* eslint-disable import/extensions */
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
import { readonly } from 'patronum';
import type { RecordPluginOptions } from 'wavesurfer.js/dist/plugins/record.js';
import RecordPluginBase from 'wavesurfer.js/dist/plugins/record.js';
import { chain, disable, enable } from './operators';

export type RecordPlugin = {
	$plugin: Store<RecordPluginBase>;
	$availableAudioDevices: Store<MediaDeviceInfo[]>;
	$device: Store<MediaDeviceInfo | null>;
	$isPaused: Store<boolean>;
	$isRecording: Store<boolean>;
	setDevice: EventCallable<string | null>;
	getDevices: EventCallable<void>;
	stopRecording: EventCallable<void>;
	startRecording: EventCallable<void>;
	pauseRecording: EventCallable<void>;
	resumeRecording: EventCallable<void>;
	recordEnd: Event<void>;
	dataAvailable: Event<void>;
	'@@unitShape': () => {
		plugin: Store<RecordPluginBase>;
		availableAudioDevices: Store<MediaDeviceInfo[]>;
		device: Store<MediaDeviceInfo | null>;
		isPaused: Store<boolean>;
		isRecording: Store<boolean>;
		setDevice: EventCallable<string | null>;
		getDevices: EventCallable<void>;
		stopRecording: EventCallable<void>;
		startRecording: EventCallable<void>;
		pauseRecording: EventCallable<void>;
		resumeRecording: EventCallable<void>;
	};
};

export const createRecordPlugin = (params: RecordPluginOptions): RecordPlugin => {
	const $plugin = createStore(RecordPluginBase.create(params));

	const $availableAudioDevices = createStore<MediaDeviceInfo[]>([]);

	const $device = createStore<MediaDeviceInfo | null>(null);

	const $isPaused = createStore(false);

	const $isRecording = createStore(false);

	const getDevices = createEvent();

	const stopRecording = createEvent();

	const startRecording = createEvent();

	const pauseRecording = createEvent();

	const resumeRecording = createEvent();

	const dataAvailable = createEvent();

	const recordEnd = createEvent();

	const setDevice = createEvent<string | null>();

	const bindEventsFx = attach({
		source: $plugin,
		effect: (plugin) => {
			plugin.on('record-data-available', (e) => {
				console.log(e);
				dataAvailable();
			});

			plugin.on('record-end', () => recordEnd());
		},
	});

	const stopRecordingFx = attach({
		source: $plugin,
		effect: (plugin) => plugin.stopRecording(),
	});

	const startRecordingFx = attach({
		source: { plugin: $plugin, device: $device },
		effect: ({ plugin, device }) => {
			if (plugin.isRecording() || plugin.isPaused()) {
				plugin.stopRecording();
			}

			plugin.startRecording({ deviceId: device?.deviceId });
		},
	});

	const pauseRecordingFx = attach({
		source: $plugin,
		effect: (plugin) => plugin.pauseRecording(),
	});

	const resumeRecordingFx = attach({
		source: $plugin,
		effect: (plugin) => plugin.resumeRecording(),
	});

	const getDevicesFx = createEffect(() => RecordPluginBase.getAvailableAudioDevices());

	sample({
		clock: getDevices,
		target: getDevicesFx,
	});

	sample({
		clock: getDevicesFx.doneData,
		target: $availableAudioDevices,
	});

	sample({
		clock: setDevice,
		source: $availableAudioDevices,
		fn: (availableAudioDevices, targetDeviceId) =>
			availableAudioDevices.find((device) => device.deviceId === targetDeviceId) || null,
		target: $device,
	});

	chain(stopRecording, stopRecordingFx);

	chain(startRecording, startRecordingFx);

	chain(pauseRecording, pauseRecordingFx);

	chain(resumeRecording, resumeRecordingFx);

	enable(startRecording, $isRecording);

	enable(pauseRecording, $isPaused);

	disable(resumeRecording, $isPaused);

	disable(stopRecording, $isPaused);

	disable(startRecording, $isPaused);

	disable(stopRecording, $isRecording);

	bindEventsFx();

	return {
		$plugin,
		$availableAudioDevices,
		$device,
		$isPaused,
		$isRecording,
		setDevice,
		getDevices,
		stopRecording,
		startRecording,
		pauseRecording,
		resumeRecording,
		recordEnd: readonly(recordEnd),
		dataAvailable: readonly(dataAvailable),
		'@@unitShape': () => ({
			plugin: readonly($plugin),
			availableAudioDevices: readonly($availableAudioDevices),
			device: readonly($device),
			isPaused: readonly($isPaused),
			isRecording: readonly($isRecording),
			setDevice,
			getDevices,
			stopRecording,
			startRecording,
			pauseRecording,
			resumeRecording,
			recordEnd: readonly(recordEnd),
			dataAvailable: readonly(dataAvailable),
		}),
	};
};

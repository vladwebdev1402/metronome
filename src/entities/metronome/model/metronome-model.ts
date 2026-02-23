import { createEffect, createEvent, createStore, merge, sample } from 'effector';
import { debounce } from 'patronum';
import {
	chain,
	createSound,
	createState,
	disable,
	enable,
	generateMetronomeBlob,
} from 'shared/lib';

const $metronomeBuffer = createStore<AudioBuffer | null>(null);

const $autoplay = createStore(false);

const metronomeSound = createSound({
	src: $metronomeBuffer,
	loop: true,
	autoplay: $autoplay,
});

const bpmState = createState(120);

const barsState = createState(1);

const beatSubdivisionState = createState(4);

const withStressClickState = createState(false);

const $beatClickUrl = createStore('/beat-click.wav');

const $defaultClickUrl = createStore('/default-click.wav');

const $stressClickUrl = createStore('/stress-click.wav');

const setup = createEvent();

const generateMetronomeBlobFx = createEffect(generateMetronomeBlob);

const paramsChanged = debounce(
	merge([
		bpmState.setState,
		barsState.setState,
		beatSubdivisionState.setState,
		withStressClickState.setState,
	]),
	250,
);

sample({
	clock: [setup, paramsChanged],
	source: {
		bpm: bpmState.$state,
		bars: barsState.$state,
		beatSubdivision: beatSubdivisionState.$state,
		beatClickUrl: $beatClickUrl,
		defaultClickUrl: $defaultClickUrl,
		stressClickUrl: $stressClickUrl,
		withStressClick: withStressClickState.$state,
	},
	target: generateMetronomeBlobFx,
});

chain(generateMetronomeBlobFx.doneData, $metronomeBuffer);

enable(metronomeSound.play, $autoplay);

disable(metronomeSound.stop, $autoplay);

export const metronomeModel = {
	$beatClickUrl,
	$defaultClickUrl,
	$metronomeBuffer,
	bpmState,
	barsState,
	beatSubdivisionState,
	withStressClickState,
	paramsChanged,
	generateMetronomeBlobFx,
	setup,
	metronomeSound,
};

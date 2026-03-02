import { createEffect, createEvent, createStore, merge, sample } from 'effector';
import { debounce } from 'patronum';
import {
	chain,
	createSound,
	createState,
	disable,
	enable,
	generateMetronomeBuffer,
} from 'shared/lib';

const $metronomeBuffer = createStore<AudioBuffer | null>(null);

const $autoplay = createStore(false);

const metronomeSound = createSound({
	src: $metronomeBuffer,
	loop: true,
	autoplay: $autoplay,
});

const bpmState = createState(60);

const barsState = createState(1);

const withStressClickState = createState(false);

const beatPatternState = createState<number[]>([0, 0, 1, 0, 1, 1, 1]);

const $beatClickUrl = createStore('/beat-click.wav');

const $defaultClickUrl = createStore('/default-click.wav');

const $stressClickUrl = createStore('/stress-click.wav');

const setup = createEvent();

const generateMetronomeBufferFx = createEffect(generateMetronomeBuffer);

const paramsChanged = debounce(
	merge([bpmState.setState, barsState.setState, withStressClickState.setState]),
	250,
);

sample({
	clock: [setup, paramsChanged],
	source: {
		bpm: bpmState.$state,
		bars: barsState.$state,
		beatClickUrl: $beatClickUrl,
		defaultClickUrl: $defaultClickUrl,
		stressClickUrl: $stressClickUrl,
		withStressClick: withStressClickState.$state,
		ratios: beatPatternState.$state,
	},
	target: generateMetronomeBufferFx,
});

chain(generateMetronomeBufferFx.doneData, $metronomeBuffer);

enable(metronomeSound.play, $autoplay);

disable(metronomeSound.stop, $autoplay);

export const metronomeModel = {
	$beatClickUrl,
	$defaultClickUrl,
	$metronomeBuffer,
	bpmState,
	barsState,
	withStressClickState,
	paramsChanged,
	generateMetronomeBufferFx,
	setup,
	metronomeSound,
};

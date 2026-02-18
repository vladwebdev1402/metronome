import { createEvent, createStore } from 'effector';
import { chain } from 'shared/lib';

const $volume = createStore(1);

const setVolume = createEvent<number>();

chain(setVolume, $volume);

export const waveSurferControlsModel = {
	$volume,
	setVolume,
};

import { createEvent } from 'effector';
import { metronomeModel } from 'entities/metronome';
import { audioEngine, chain } from 'shared/lib';

export const appStarted = createEvent();

chain(appStarted, metronomeModel.setup);

chain(appStarted, audioEngine.setup);

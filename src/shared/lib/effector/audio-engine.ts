import { createEvent } from 'effector';
import { createAudioEngine } from './create-audio-engine';

const setup = createEvent();

const [engine, createSound] = createAudioEngine({ setup });

const audioEngine = Object.assign(engine, { setup });

export { audioEngine, createSound, setup };

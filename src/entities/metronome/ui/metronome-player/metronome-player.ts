import { createAudioPlayer } from 'shared/ui';
import { metronomeModel } from '../../model';

const MetronomePlayer = createAudioPlayer(metronomeModel.metronomeSound);

export { MetronomePlayer };

import { useUnit } from 'effector-react';
import { WaveSurfer } from 'shared/ui';
import { waveSurferMetronomeModel } from '../model';

export const WaveSurferMetronome = () => {
	const [setWaveSurfer] = useUnit([waveSurferMetronomeModel.waveSurferModel.setWaveSurfer]);

	return (
		<WaveSurfer
			waveSurferParams={{
				minPxPerSec: 100,
				dragToSeek: true,
				waveColor: '#888',
				progressColor: '#444',
				height: 100,
			}}
			onInit={setWaveSurfer}
		/>
	);
};

import { useUnit } from 'effector-react';
import { WaveSurfer } from 'shared/ui';
import { waveSurferRecordModel } from '../../model';

export const WaveSurferRecord = () => {
	const [plugin, setWaveSurfer] = useUnit([
		waveSurferRecordModel.recordPlugin.$plugin,
		waveSurferRecordModel.waveSurferModel.setWaveSurfer,
	]);

	return (
		<WaveSurfer
			plugins={[plugin]}
			waveSurferParams={{
				minPxPerSec: 100,
				dragToSeek: true,
			}}
			onInit={setWaveSurfer}
		/>
	);
};

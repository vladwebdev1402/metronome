import { attach, createEffect, sample } from 'effector';
import { waveSurferMetronomeModel } from 'entities/wave-surfer-metronome/model';
import { waveSurferRecordModel } from 'entities/wave-surfer-record/model';
import { debug } from 'patronum';
import { chain, generateMetronomeBlob } from 'shared/lib';
import { waveSurferControlsModel } from 'widgets/wave-surfer-controls';

const beatSubdivision = 4;

const getTimeFx = attach({
	source: waveSurferRecordModel.waveSurferModel.$waveSurfer,
	effect: (waveSurfer) => waveSurfer!.getDuration(),
});

const createMetronomeTimeLineFx = createEffect(async (duration: number) => {
	const blob = await generateMetronomeBlob({
		duration,
		bpm: 138 / beatSubdivision,
		strongClickUrl: '/click.wav',
		normalClickUrl: '/mega-click.wav',
		beatSubdivision,
	});

	const url = URL.createObjectURL(blob);

	console.log(url);

	return url;
});

sample({
	clock: waveSurferMetronomeModel.waveSurferModel.init,
	fn: () => 120,
	target: createMetronomeTimeLineFx,
});

chain(createMetronomeTimeLineFx.doneData, waveSurferMetronomeModel.waveSurferModel.load);

chain(waveSurferControlsModel.$volume, waveSurferMetronomeModel.waveSurferModel.setVolume);

chain(waveSurferControlsModel.$volume, waveSurferRecordModel.waveSurferModel.setVolume);

chain(
	waveSurferRecordModel.waveSurferModel.playPause,
	waveSurferMetronomeModel.waveSurferModel.playPause,
);

chain(
	waveSurferRecordModel.waveSurferModel.audioprocess,
	waveSurferMetronomeModel.waveSurferModel.setTime,
);

chain(
	waveSurferRecordModel.recordPlugin.startRecording,
	waveSurferMetronomeModel.waveSurferModel.play,
);

chain(
	waveSurferRecordModel.recordPlugin.stopRecording,
	waveSurferMetronomeModel.waveSurferModel.pause,
);

chain(
	waveSurferRecordModel.recordPlugin.stopRecording,
	waveSurferMetronomeModel.waveSurferModel.reset,
);

chain(
	waveSurferRecordModel.recordPlugin.dataAvailable,
	waveSurferRecordModel.waveSurferModel.reset,
);

chain(waveSurferRecordModel.recordPlugin.dataAvailable, getTimeFx);

chain(getTimeFx.doneData, createMetronomeTimeLineFx);

debug(getTimeFx.doneData);

export const mainPageModel = {};

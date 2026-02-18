import { createRecordPlugin, createWaveSurferModel } from 'shared/lib';

const recordPlugin = createRecordPlugin({
	continuousWaveform: true,
});

const waveSurferModel = createWaveSurferModel();

export const waveSurferRecordModel = {
	waveSurferModel,
	recordPlugin,
};

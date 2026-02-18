import { reflect } from '@effector/reflect';
import { Button, Slider } from '@mantine/core';
import { waveSurferControlsModel } from 'widgets/wave-surfer-controls/model';
import { useUnit } from 'effector-react';
import { waveSurferRecordModel } from 'entities/wave-surfer-record/model';
import cls from './wave-surfer-controls.module.scss';

const VolumeSlider = reflect({
	view: Slider,
	bind: {
		value: waveSurferControlsModel.$volume,
		min: 0,
		max: 1,
		step: 0.01,
		onChange: waveSurferControlsModel.setVolume,
		label: null,
	},
});

export const WaveSurferControls = () => {
	const [paused, playPause] = useUnit([
		waveSurferRecordModel.waveSurferModel.$paused,
		waveSurferRecordModel.waveSurferModel.playPause,
	]);

	const { isRecording, startRecording, stopRecording } = useUnit(
		waveSurferRecordModel.recordPlugin,
	);

	return (
		<div className={cls.waveSurferControlsRoot}>
			<Button onClick={() => (isRecording ? stopRecording() : startRecording())}>
				{isRecording ? 'stopRecording' : 'startRecording'}
			</Button>
			<Button
				disabled={isRecording}
				onClick={() => playPause()}
			>
				{paused ? 'Play' : 'Pause'}
			</Button>
			<VolumeSlider className={cls.waveSurferControlsVolumeSlider} />
		</div>
	);
};

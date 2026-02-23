import { reflect } from '@effector/reflect';
import { Box, Stack, Group, Button, Text, Slider } from '@mantine/core';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';
import type { AudioModel } from 'shared/lib';
import { TimeSlider } from 'shared/ui';

export type AudioPlayerProps = {
	label?: ReactNode;
};

export const createAudioPlayer = (model: AudioModel) => {
	const VolumeSlider = reflect({
		view: Slider,
		bind: {
			value: model.$volume,
			onChange: model.setVolume,
			min: 0,
			max: 1,
			step: 0.01,
			label: null,
		},
	});

	const TimeProgress = reflect({
		view: TimeSlider,
		bind: {
			value: model.$time,
			max: model.$duration,
			step: 0.01,
			min: 0,
			label: null,
			onChangeEnd: (v) => model.seekTo(v),
		},
	});

	return ({ label }: AudioPlayerProps) => {
		const { play, ready, pause, resume, isPaused, isPlaying, loop, duration, time, stop, setLoop } =
			useUnit(model);

		return (
			<div>
				{ready && (
					<Box>
						<Text
							size='xl'
							fw='bold'
						>
							{label}
						</Text>
						<Stack gap={8}>
							<Stack gap={2}>
								<Group gap={4}>
									<Text
										size='md'
										fw='bold'
									>
										time:
									</Text>
									<Text size='md'>{`${time.toFixed(2)}`}</Text>
								</Group>
								<Group gap={4}>
									<Text
										size='md'
										fw='bold'
									>
										isPlaying:
									</Text>
									<Text size='md'>{`${isPlaying}`}</Text>
								</Group>
								<Group gap={4}>
									<Text
										size='md'
										fw='bold'
									>
										isPaused:
									</Text>
									<Text size='md'>{`${isPaused}`}</Text>
								</Group>
								<Group gap={4}>
									<Text
										size='md'
										fw='bold'
									>
										isLoop:
									</Text>
									<Text size='md'>{`${loop}`}</Text>
								</Group>
								<Group gap={4}>
									<Text
										size='md'
										fw='bold'
									>
										duration:
									</Text>
									<Text size='md'>{`${duration.toFixed(2)}`}</Text>
								</Group>
							</Stack>
							<Group gap={4}>
								<Button
									disabled={!isPlaying}
									onClick={stop}
								>
									Stop
								</Button>
								<Button onClick={() => (loop ? setLoop(false) : setLoop(true))}>Toggle Loop</Button>
								<Button onClick={play}>Play</Button>
								<Button
									disabled={!isPlaying}
									onClick={() => (isPaused ? resume() : pause())}
								>
									{isPaused ? 'Resume' : 'Pause'}
								</Button>
							</Group>
							<VolumeSlider />
							<TimeProgress />
						</Stack>
					</Box>
				)}
			</div>
		);
	};
};

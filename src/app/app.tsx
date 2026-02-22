import { Button, Group, MantineProvider, Slider, Stack, Text } from '@mantine/core';
import { chain, createAudioEngine, generateMetronomeBlobFx } from 'shared/lib';
import { reflect } from '@effector/reflect';
import { createStore, sample } from 'effector';
import { useUnit } from 'effector-react';
import { TimeSlider } from 'shared/ui';
import { appStarted } from './model';
import './styles/index.scss';

const [audioEngine, createSound] = createAudioEngine({ setup: appStarted });

const $audioBuffer = createStore<AudioBuffer | null>(null);

const music = createSound({
	src: '/audio.mp3',
	loop: false,
});

const VolumeSlider = reflect({
	view: Slider,
	bind: {
		value: music.$volume,
		onChange: music.setVolume,
		min: 0,
		max: 1,
		step: 0.01,
		label: null,
	},
});

const TimeProgress = reflect({
	view: TimeSlider,
	bind: {
		value: music.$time,
		max: music.$duration,
		step: 0.01,
		min: 0,
		label: null,
		onChangeEnd: (v) => music.seekTo(v),
	},
});

sample({
	clock: appStarted,
	fn: () => ({
		duration: 10,
		bpm: 120,
		strongClickUrl: '/click.wav',
		normalClickUrl: '/click.wav',
		beatSubdivision: 1,
	}),
	target: generateMetronomeBlobFx,
});

chain(generateMetronomeBlobFx.doneData, $audioBuffer);

export const App = () => {
	const { play, ready, pause, resume, isPaused, isPlaying, loop, duration, time, stop, setLoop } =
		useUnit(music);

	return (
		<MantineProvider>
			{ready && (
				<Stack gap={8}>
					<Stack gap={2}>
						<Group gap={4}>
							<Text
								size='md'
								fw='bold'
							>
								time:
							</Text>
							<Text size='md'>{`${time}`}</Text>
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
							<Text size='md'>{`${duration}`}</Text>
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
			)}
		</MantineProvider>
	);
};

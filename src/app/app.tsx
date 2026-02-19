import { Button, Group, MantineProvider, Slider, Stack, Text } from '@mantine/core';
import { chain, createAudioEngine, generateMetronomeBlobFx } from 'shared/lib';
import { reflect } from '@effector/reflect';
import { debug } from 'patronum';
import { useUnit } from 'effector-react';
import { createStore, sample } from 'effector';
import { appStarted } from './model';
import './styles/index.scss';

const [audioEngine, createSound] = createAudioEngine({ setup: appStarted });

const $audioBuffer = createStore<AudioBuffer | null>(null);

sample({
	clock: appStarted,
	source: audioEngine.$audioCtx,
	fn: (audioCtx) => ({
		duration: 5,
		bpm: 120 / 4,
		strongClickUrl: '/click.wav',
		normalClickUrl: '/click.wav',
		beatSubdivision: 4,
		audioContext: audioCtx,
	}),
	target: generateMetronomeBlobFx,
});

chain(generateMetronomeBlobFx.doneData, $audioBuffer);

const music = createSound({
	src: $audioBuffer,
	loop: false,
});

debug(music.failure);

export const VolumeSlider = reflect({
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

export const App = () => {
	const { play, ready, pause, resume, isPaused, isPlaying, loop, stop, setLoop } = useUnit(music);

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
				</Stack>
			)}
		</MantineProvider>
	);
};

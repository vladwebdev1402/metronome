import { MantineProvider, Stack } from '@mantine/core';
import { MetronomeControls, MetronomePlayer, MetronomeWave } from 'entities/metronome';
import './styles/index.scss';

export const App = () => (
	<MantineProvider defaultColorScheme='dark'>
		<Stack gap={32}>
			<MetronomeControls />
			<MetronomePlayer label='Metronome' />
			<MetronomeWave
				height={200}
				width={1200}
			/>
		</Stack>
	</MantineProvider>
);

import { MantineProvider } from '@mantine/core';
import './styles/index.scss';
import { MetronomeControls, MetronomePlayer } from 'entities/metronome';

export const App = () => (
	<MantineProvider defaultColorScheme='dark'>
		<MetronomeControls />
		<MetronomePlayer label='Metronome' />
	</MantineProvider>
);

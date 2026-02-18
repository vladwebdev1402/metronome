/* eslint-disable import/extensions */
import { MantineProvider } from '@mantine/core';
import { MainPage } from 'pages/main-page';
import './styles/index.scss';

export const App = () => (
	<MantineProvider>
		<MainPage />
	</MantineProvider>
);

import { WaveSurferRecord } from 'entities/wave-surfer-record';
import { WaveSurferMetronome } from 'entities/wave-surfer-metronome';
import { WaveSurferControls } from 'widgets/wave-surfer-controls';
import cls from './main-page.module.scss';

export const MainPage = () => (
	<div className={cls.mainPage}>
		<WaveSurferControls />
		<div className={cls.mainPageWaveSurfers}>
			<WaveSurferRecord />
			<WaveSurferMetronome />
		</div>
	</div>
);

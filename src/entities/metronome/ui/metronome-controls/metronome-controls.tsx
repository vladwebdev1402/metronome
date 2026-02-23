import { reflect } from '@effector/reflect';
import { Box, Slider, Stack, Switch } from '@mantine/core';
import { metronomeModel } from 'entities/metronome/model';

const BpmSlider = reflect({
	view: Slider,
	bind: {
		value: metronomeModel.bpmState.$state,
		onChange: metronomeModel.bpmState.setState,
		min: 40,
		max: 240,
		step: 1,
	},
});

const BeatSubdivisionSlider = reflect({
	view: Slider,
	bind: {
		value: metronomeModel.beatSubdivisionState.$state,
		onChange: metronomeModel.beatSubdivisionState.setState,
		min: 1,
		max: 6,
		step: 1,
	},
});

const BarsSlider = reflect({
	view: Slider,
	bind: {
		value: metronomeModel.barsState.$state,
		onChange: metronomeModel.barsState.setState,
		min: 1,
		max: 12,
		step: 1,
	},
});

const StressClickSwitch = reflect({
	view: Switch,
	bind: {
		checked: metronomeModel.withStressClickState.$state,
		onChange: (e) => metronomeModel.withStressClickState.setState(e.currentTarget.checked),
		label: 'Stress click',
	},
});

export const MetronomeControls = () => (
	<Box>
		<Stack>
			<BpmSlider />
			<BeatSubdivisionSlider />
			<BarsSlider />
			<StressClickSwitch />
		</Stack>
	</Box>
);

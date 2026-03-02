import { reflect } from '@effector/reflect';
import { Box, Slider, Stack, Switch, Text } from '@mantine/core';
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
			<Stack gap={0}>
				<Text>BPM</Text>
				<BpmSlider />
			</Stack>
			<Stack gap={0}>
				<Text>Bars</Text>
				<BarsSlider />
			</Stack>
			<StressClickSwitch />
		</Stack>
	</Box>
);

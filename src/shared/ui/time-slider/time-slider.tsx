import { Slider, type SliderProps } from '@mantine/core';
import { useEffect, useState } from 'react';

export type TimeSliderClassNames = Partial<Record<'root', string>>;

export type TimeSliderProps = {
	classNames?: TimeSliderClassNames;
} & SliderProps;

export const TimeSlider = ({ value, onChangeEnd, onChange, ...props }: TimeSliderProps) => {
	const [onChangeStarted, setOnChangeStarted] = useState(false);
	const [sliderValue, setSliderValue] = useState(value);

	useEffect(() => {
		!onChangeStarted && setSliderValue(value);
	}, [value, onChangeStarted]);

	return (
		<Slider
			className='time-slider-root'
			value={sliderValue}
			onChange={(v) => {
				setOnChangeStarted(true);
				setSliderValue(v);
				onChange?.(v);
			}}
			onChangeEnd={(v) => {
				setSliderValue(v);
				onChangeEnd?.(v);

				setTimeout(() => {
					setOnChangeStarted(false);
				});
			}}
			{...props}
		/>
	);
};

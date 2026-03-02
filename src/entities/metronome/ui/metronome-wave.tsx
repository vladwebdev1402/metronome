import { useUnit } from 'effector-react';
import { useRef, useEffect } from 'react';
import { audioEngine } from 'shared/lib';
import { metronomeModel } from '../model';

export type WaveformProps = {
	width: number;
	height: number;
	color?: string;
};

export const MetronomeWave = ({ width, height, color = '#00ff00' }: WaveformProps) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const [audioCtx, metronomeBuffer, duration, time] = useUnit([
		audioEngine.$audioCtx,
		metronomeModel.$metronomeBuffer,
		metronomeModel.metronomeSound.$duration,
		metronomeModel.metronomeSound.$time,
	]);

	const progress = time / duration;

	useEffect(() => {
		if (!canvasRef.current || !metronomeBuffer) return;

		const { currentTime } = audioCtx;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		canvas.width = width;
		canvas.height = height;

		// Получаем данные аудио
		const data = metronomeBuffer.getChannelData(0);
		const step = Math.ceil(data.length / width);
		const amp = height / 2;

		// Очищаем канвас
		ctx.clearRect(0, 0, width, height);

		// Рисуем waveform
		ctx.beginPath();
		ctx.strokeStyle = color;
		ctx.lineWidth = 1;

		for (let i = 0; i < width; i += 1) {
			let min = 1.0;
			let max = -1.0;

			for (let j = 0; j < step; j += 1) {
				const datum = data[i * step + j];
				if (datum < min) min = datum;
				if (datum > max) max = datum;
			}

			ctx.moveTo(i, (1 + min) * amp);
			ctx.lineTo(i, (1 + max) * amp);
		}

		ctx.stroke();

		// Рисуем линию прогресса (от 0 до 1)
		const progressX = progress * width;

		ctx.beginPath();
		ctx.strokeStyle = '#ff0000';
		ctx.lineWidth = 2;
		ctx.moveTo(progressX, 0);
		ctx.lineTo(progressX, height);
		ctx.stroke();

		// Для обратной совместимости - если передан currentTime
		if (currentTime !== undefined) {
			const timeX = (currentTime / metronomeBuffer.duration) * width;
			ctx.beginPath();
			ctx.strokeStyle = '#ff0000';
			ctx.lineWidth = 2;
			ctx.moveTo(timeX, 0);
			ctx.lineTo(timeX, height);
			ctx.stroke();
		}
	}, [metronomeBuffer, width, height, color, progress, audioCtx]);

	return (
		<canvas
			ref={canvasRef}
			style={{ display: 'block' }}
		/>
	);
};

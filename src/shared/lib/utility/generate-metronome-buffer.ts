/* eslint-disable @typescript-eslint/no-explicit-any */

export type MetronomeOptions = {
	bpm: number;
	beatClickUrl: string;
	stressClickUrl: string;
	defaultClickUrl: string;
	withStressClick?: boolean;
	bars?: number;
	ratios: number[];
	audioContext?: AudioContext;
};

export const generateMetronomeBuffer = async (options: MetronomeOptions): Promise<AudioBuffer> => {
	const {
		bpm,
		bars = 1,
		beatClickUrl,
		defaultClickUrl,
		stressClickUrl,
		withStressClick = false,
		ratios,
		audioContext,
	} = options;

	const audioCtx =
		audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();

	const fetchBuffer = async (url: string): Promise<AudioBuffer> => {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();

		return audioCtx.decodeAudioData(arrayBuffer);
	};

	const [strongBuffer, normalBuffer, stressBuffer] = await Promise.all([
		fetchBuffer(beatClickUrl),
		fetchBuffer(defaultClickUrl),
		fetchBuffer(stressClickUrl),
	]);

	const barDuration = 60 / bpm;

	// Количество долей в такте = длина ratios
	const beatSubdivision = ratios.length;

	// Базовая длительность одной доли (если бы все были равны)
	const baseNoteDuration = barDuration / beatSubdivision;

	// Нормализуем ratios, чтобы сумма = beatSubdivision
	const adjustedRatios = ratios.map((r) => (r === 0 ? 1 : r));

	// Шаг 2: нормализуем adjustedRatios, чтобы сумма = beatSubdivision
	const sumAdjusted = adjustedRatios.reduce((a, b) => a + b, 0);
	const scaleFactor = beatSubdivision / sumAdjusted;
	const scaledAdjusted = adjustedRatios.map((r) => r * scaleFactor);

	// Шаг 3: длительности
	const noteDurations = scaledAdjusted.map((r) => r * baseNoteDuration);

	const totalDuration = barDuration * bars;

	const { sampleRate } = audioCtx;
	const totalSamples = Math.floor(totalDuration * sampleRate);
	const outputBuffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
	const outputData = outputBuffer.getChannelData(0);

	const mixBuffer = (source: AudioBuffer, offsetSample: number): void => {
		const data = source.getChannelData(0);
		for (let i = 0; i < data.length && offsetSample + i < outputData.length; i += 1) {
			outputData[offsetSample + i] += data[i];
		}
	};

	let currentTime = 0;

	const startedIndex = ratios.findIndex((r) => r !== 0);

	for (let bar = 0; bar < bars; bar += 1) {
		for (let beat = 0; beat < ratios.length; beat += 1) {
			const duration = ratios[beat] > 0 ? noteDurations[beat] : baseNoteDuration;

			if (ratios[beat] > 0) {
				const sampleOffset = Math.floor(currentTime * sampleRate);

				const isFirstBeat = bar === 0 && beat === startedIndex;
				const isStrongBeat = beat === startedIndex;

				let clickBuffer;
				if (isFirstBeat && withStressClick) {
					clickBuffer = stressBuffer;
				} else if (isStrongBeat) {
					clickBuffer = strongBuffer;
				} else {
					clickBuffer = normalBuffer;
				}

				mixBuffer(clickBuffer, sampleOffset);
			}

			currentTime += duration;
		}
	}

	return outputBuffer;
};

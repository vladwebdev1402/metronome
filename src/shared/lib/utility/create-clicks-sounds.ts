/* eslint-disable @typescript-eslint/no-explicit-any */

export type MetronomeOptions = {
	bpm: number;
	beatClickUrl: string;
	stressClickUrl: string;
	defaultClickUrl: string;
	withStressClick?: boolean;
	bars?: number;
	beatSubdivision?: number;
	audioContext?: AudioContext;
};

export async function generateMetronomeBlob(options: MetronomeOptions): Promise<AudioBuffer> {
	const {
		bpm: paramsBpm,
		bars = 1,
		beatClickUrl,
		defaultClickUrl,
		stressClickUrl,
		withStressClick = false,
		beatSubdivision = 4,
		audioContext,
	} = options;

	const bpm = paramsBpm * beatSubdivision;

	const audioCtx =
		audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();

	const fetchBuffer = async (url: string) => {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();

		return audioCtx.decodeAudioData(arrayBuffer);
	};

	const [strongBuffer, normalBuffer, stressBuffer] = await Promise.all([
		fetchBuffer(beatClickUrl),
		fetchBuffer(defaultClickUrl),
		fetchBuffer(stressClickUrl),
	]);

	const barDuration = (60 / bpm) * beatSubdivision;

	const totalDuration = barDuration * bars;

	const { sampleRate } = audioCtx;

	const totalSamples = Math.floor(totalDuration * sampleRate);

	const outputBuffer = audioCtx.createBuffer(1, totalSamples, sampleRate);

	const outputData = outputBuffer.getChannelData(0);

	const beatInterval = 60 / bpm;

	const mixBuffer = (source: AudioBuffer, offsetSample: number) => {
		const data = source.getChannelData(0);
		for (let i = 0; i < data.length && offsetSample + i < outputData.length; i += 1) {
			outputData[offsetSample + i] += data[i];
		}
	};

	for (let beatIndex = 0; beatIndex < bars * beatSubdivision; beatIndex += 1) {
		const timeInSeconds = beatIndex * beatInterval;
		const sampleOffset = Math.floor(timeInSeconds * sampleRate);

		const isStrongBeat = beatIndex % beatSubdivision === 0;
		const clickBuffer = isStrongBeat ? strongBuffer : normalBuffer;

		mixBuffer(beatIndex === 0 && withStressClick ? stressBuffer : clickBuffer, sampleOffset);
	}

	return outputBuffer;
}

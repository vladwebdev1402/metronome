/* eslint-disable @typescript-eslint/no-explicit-any */
import { createEffect } from 'effector';

export type MetronomeOptions = {
	duration: number; // длительность трека в секундах
	bpm: number; // темп
	strongClickUrl: string; // URL "сильного" клика (1-я доля)
	normalClickUrl: string; // URL обычного клика
	beatSubdivision?: number; // количество долей в такте (например, 4 = четверти)
};

/**
 * Генерирует Blob с метрономом, который можно передать в wavesurfer.js
 */
export async function generateMetronomeBlob(options: MetronomeOptions): Promise<AudioBuffer> {
	const { duration, bpm, strongClickUrl, normalClickUrl, beatSubdivision = 4 } = options;

	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

	// Загружаем клики
	const fetchBuffer = async (url: string) => {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();

		return audioContext.decodeAudioData(arrayBuffer);
	};

	const [strongBuffer, normalBuffer] = await Promise.all([
		fetchBuffer(strongClickUrl),
		fetchBuffer(normalClickUrl),
	]);

	const { sampleRate } = audioContext;
	const totalSamples = Math.floor(duration * sampleRate);
	const outputBuffer = audioContext.createBuffer(1, totalSamples, sampleRate);
	const outputData = outputBuffer.getChannelData(0);

	const beatInterval = 60 / bpm; // одна четверть
	const subdivisionInterval = beatInterval / beatSubdivision;

	const mixBuffer = (source: AudioBuffer, offsetSample: number) => {
		const data = source.getChannelData(0);
		for (let i = 0; i < data.length && offsetSample + i < outputData.length; i += 1) {
			outputData[offsetSample + i] += data[i];
		}
	};

	let tick = 0;
	for (let currentTime = 0; currentTime < duration; currentTime += subdivisionInterval) {
		const offsetSample = Math.floor(currentTime * sampleRate);
		if (tick % beatSubdivision === 0) {
			mixBuffer(strongBuffer, offsetSample);
		} else {
			mixBuffer(normalBuffer, offsetSample);
		}
		tick += 1;
	}

	return outputBuffer;
}

export const generateMetronomeBlobFx = createEffect(generateMetronomeBlob);

// Конвертируем AudioBuffer в WAV Blob
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
	const numChannels = buffer.numberOfChannels;
	const { sampleRate } = buffer;
	const format = 1; // PCM
	const bitDepth = 16;

	const samples = buffer.length;
	const blockAlign = (numChannels * bitDepth) / 8;
	const byteRate = sampleRate * blockAlign;
	const dataSize = samples * blockAlign;

	const bufferSize = 44 + dataSize;
	const arrayBuffer = new ArrayBuffer(bufferSize);
	const view = new DataView(arrayBuffer);

	let offset = 0;

	const writeString = (s: string) => {
		for (let i = 0; i < s.length; i += 1) {
			view.setUint8(offset, s.charCodeAt(i));
			offset += 1;
		}
	};

	const writeUint32 = (v: number) => {
		view.setUint32(offset, v, true);
		offset += 4;
	};

	const writeUint16 = (v: number) => {
		view.setUint16(offset, v, true);
		offset += 2;
	};

	// RIFF header
	writeString('RIFF');
	writeUint32(36 + dataSize);
	writeString('WAVE');

	// fmt chunk
	writeString('fmt ');
	writeUint32(16);
	writeUint16(format);
	writeUint16(numChannels);
	writeUint32(sampleRate);
	writeUint32(byteRate);
	writeUint16(blockAlign);
	writeUint16(bitDepth);

	// data chunk
	writeString('data');
	writeUint32(dataSize);

	// PCM data
	for (let i = 0; i < samples; i += 1) {
		for (let ch = 0; ch < numChannels; ch += 1) {
			let sample = buffer.getChannelData(ch)[i];
			sample = Math.max(-1, Math.min(1, sample));
			const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
			view.setInt16(offset, intSample, true);
			offset += 2;
		}
	}

	return new Blob([arrayBuffer], { type: 'audio/wav' });
}

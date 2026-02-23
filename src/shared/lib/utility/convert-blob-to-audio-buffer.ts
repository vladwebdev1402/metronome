export const convertBlobToAudioBuffer = async (from: Blob | Blob[], audioCtx?: AudioContext) => {
	const audioContext = audioCtx || new window.AudioContext();

	const blob = Array.isArray(from) ? new Blob(from, { type: 'audio/webm' }) : from;

	const arrayBuffer = await blob.arrayBuffer();

	try {
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

		return audioBuffer;
	} catch (e) {
		return null;
	}
};

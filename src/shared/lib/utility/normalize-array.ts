export const normalizeArray = (arr: number[]) => {
	const min = Math.min(...arr);
	const max = Math.max(...arr);

	return arr.map((value) => (value - min) / (max - min));
};

import { sample, type StoreWritable, type Unit } from 'effector';

export const toggle = (clock: Unit<unknown>, source: StoreWritable<boolean>) => {
	sample({
		clock,
		source,
		fn: (value) => !value,
		target: source,
	});
};

import { sample, type StoreWritable, type Unit } from 'effector';

export const disable = (clock: Unit<unknown>, target: StoreWritable<boolean>) => {
	sample({
		clock,
		fn: () => false,
		target,
	});
};

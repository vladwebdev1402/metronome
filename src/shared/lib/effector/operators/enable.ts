import { type StoreWritable, type Unit, sample } from 'effector';

export const enable = (clock: Unit<unknown>, target: StoreWritable<boolean>) => {
	sample({
		clock,
		fn: () => true,
		target,
	});
};

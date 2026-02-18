import { sample, type Unit, type UnitTargetable } from 'effector';

export const chain = <T = unknown>(first: Unit<T>, second: UnitTargetable<T | void>) => {
	sample({
		clock: first,
		target: second,
	});
};

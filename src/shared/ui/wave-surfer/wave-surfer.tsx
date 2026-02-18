/* eslint-disable import/extensions */
import { forwardRef, useEffect, useId, type ComponentPropsWithoutRef } from 'react';
import WaveSurferJs, { type WaveSurferOptions } from 'wavesurfer.js';
import type { BasePluginEvents } from 'wavesurfer.js/dist/base-plugin.js';
import type BasePlugin from 'wavesurfer.js/dist/base-plugin.js';

export type WaveSurferBase = WaveSurferJs;

export type WaveSurferProps = {
	onInit?: (waveSurfer: WaveSurferBase) => void;
	onDestroyed?: () => void;
	waveSurferParams?: Omit<WaveSurferOptions, 'container' | 'plugins'>;
	plugins?: BasePlugin<BasePluginEvents, unknown>[];
} & ComponentPropsWithoutRef<'div'>;

export const WaveSurfer = forwardRef<HTMLDivElement, WaveSurferProps>(
	({ id, plugins, onInit, onDestroyed, waveSurferParams, ...props }, ref) => {
		const innerId = useId();

		const actualId = id || innerId;

		useEffect(() => {
			const waveSurfer = WaveSurferJs.create({
				...waveSurferParams,
				container: `#${actualId}`,
				plugins,
			});

			onInit?.(waveSurfer);

			return () => {
				waveSurfer.destroy();
				onDestroyed?.();
			};
		}, []);

		return (
			<div
				ref={ref}
				id={actualId}
				{...props}
			/>
		);
	},
);

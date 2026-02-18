import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			app: '/src/app',
			pages: '/src/pages',
			widgets: '/src/widgets',
			features: '/src/features',
			entities: '/src/entities',
			shared: '/src/shared',
		},
	},
	css: {
		devSourcemap: true,
		modules: {
			generateScopedName: '[local]__[hash:base64:4]',
			localsConvention: 'camelCaseOnly',
		},
	},
});

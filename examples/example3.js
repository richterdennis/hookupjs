import { EventEmitter } from 'node:events';
import boot from 'hookupjs';

boot('./boot', {
	base: new EventEmitter(),
	global: true,

	registerLoaders: {
		text: true,
		buffer: true,
	},

	resolve: {
		directories: true,
		extensions: true,
		handleSearch: true,
	},

	beforeLoading: () => {
		// Custom hooks registered with module.registerHooks here run first
	},

	wrapper: async (run) => {
		// This can be used for an AsyncLocalStorage or something similar where
		// you need the run logic wrapped
		const app = await run();

		// The return value of this wrapper function is also the return value of boot
		return app;
	},

	initialized: (app) => {
		console.log('Everything initialized!', app);
	},

	booted: (app) => {
		console.log('Everything booted!', app);
	},

	onError: (key, error) => {
		console.error(`Error during boot sequence "${key}"!`, error);
	},
});

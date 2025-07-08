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

import boot from 'hookupjs';

boot('./boot', import.meta.url, {
	registerLoaders: {
		text: true,
		buffer: true,
	},
	resolve: {
		directories: true,
	},
	onError: (key, error) => {
		console.error(`Error during boot sequence "${key}"!`, error);
	},
});

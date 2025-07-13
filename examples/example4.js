import boot from 'hookupjs';

boot('#/boot', {
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

	imports: {
		'#/boot': './boot2',
		'#/*': './*',
	},

	initialized: (app) => {
		console.log('Everything initialized!', app);
	},

	booted: (app) => {
		console.log('Everything booted!', app);
	},
});

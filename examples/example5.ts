import boot from 'hookupjs';
import swc from '@swc/core';

boot('./boot3', {
	registerLoaders: {
		// Node.js can execute TypeScript files. But if you want to use a
		// third-party package to compile / transpile / transform ts you can do it
		// like this:
		typescript: (source, url) => {
			const { code } = swc.transformSync(source.toString(), {
				filename: url,
				module: {
					type: "es6",
				},
				jsc: {
					parser: { syntax: "typescript" },
					target: "esnext",
				},
				sourceMaps: false,
			});

			return code;
		},
	},

	resolve: {
		directories: true,
		extensions: ['.js', '.ts'],
	},

	initialized: (app) => {
		console.log('Everything initialized!', app);
	},

	booted: (app) => {
		console.log('Everything booted!', app);
	},
});

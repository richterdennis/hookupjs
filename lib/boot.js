import { createRequire } from 'node:module';
import { registerLoaders, registerResolvers } from './hooks.js';
import { getCaller } from './util.js';

/**
 * boot(specifier)
 * boot(specifier, options)
 * boot(specifier, parentURL)
 * boot(specifier, parentURL, options)
 * boot(sequences)
 * boot(sequences, options)
 */
export default async function boot(...args) {
	let options;
	let specifier;
	let sequences;

	if (typeof args[0] === 'string') {
		options = typeof args[args.length - 1] === 'object' ? args.pop() : {};
		specifier = args;
	}
	else {
		sequences = args.shift();
		options = args.pop() || {};
	}

	const app = options.base || {};

	boot.app = app;
	if (options.global) global.app = app;

	if (options.registerLoaders) {
		if (!specifier) {
			throw new Error('The boot sequences needs to be loaded from a path if registerLoaders are defined!');
		}

		registerLoaders(options.registerLoaders);
	}

	if (options.resolve) {
		if (!specifier) {
			throw new Error('The boot sequences needs to be loaded from a path if resolve is defined!');
		}

		registerResolvers(options.resolve);
	}

	if (options.beforeLoading) options.beforeLoading(app);

	if (specifier) {
		if (specifier.length === 1) specifier.push(getCaller());
		const [bootPath, caller] = specifier;

		const require = createRequire(caller);
		sequences = require(bootPath);
	}

	if (sequences.default && typeof sequences.default === 'object') sequences = sequences.default;
	if (typeof sequences === 'function') sequences = { 'default': sequences };

	for (const [key, sequence] of (sequences && typeof sequences === 'object' ? Object.entries(sequences) : [])) {
		// Promise.resolve().then to publish all boot sequences before running first
		app[key] = Promise
			.resolve(app)
			.then(typeof sequence === 'function' ? sequence : () => sequence)
			.catch((error) => {
				if (options.onError) options.onError(key, error);
				else console.error(`Error during boot sequence "${key}"!`, error);

				process.exit(1);
			});
	}

	if (options.initialized) options.initialized(app);

	if (typeof sequences !== 'object') {
		if (options.booted) options.booted(app);
		return app;
	}

	return Promise
		.all(
			Object
				.keys(sequences)
				.map(key => app[key]),
		)
		.then(() => {
			if (options.booted) options.booted(app);
			return app;
		});
}

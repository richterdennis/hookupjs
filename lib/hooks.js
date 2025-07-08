import module from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STANDARD_EXTENSIONS = ['.js', '.mjs', '.cjs'];
const STANDARD_LOADERS = {
	text: source => `export default ${JSON.stringify(source.toString())}`,
	buffer: (_, url) => `import { readFileSync } from 'fs';export default readFileSync(${JSON.stringify(url)})`,
};

export function registerLoaders(loaders) {
	if (!module.registerHooks) throw new Error('module.registerHooks not supported by this node version!');

	for (const [type, loader] of Object.entries(loaders)) {
		if (loader === true && type in STANDARD_LOADERS) {
			loaders[type] = STANDARD_LOADERS[type];
			continue;
		}

		if (typeof loader !== 'function') throw new Error(`Loader "${type}" needs to be of type function!`);
	}

	module.registerHooks({ load });

	function load(url, context, nextLoad) {
		const type = context.importAttributes?.type || 'javascript';

		if (type in loaders) {
			const loadSource = type !== 'buffer';

			let source;
			if (loadSource) {
				({ source } = nextLoad(url, { ...context, format: type }));
			}

			return {
				source: loaders[type](source, fileURLToPath(url)),
				format: 'module',
				shortCircuit: !loadSource,
			};
		}

		return nextLoad(url, context);
	}
}

export function registerResolvers(options) {
	if (!module.registerHooks) throw new Error('module.registerHooks not supported by this node version!');

	const hooks = { resolve };

	if (options.handleSearch) {
		hooks.load = load;
	}

	if (options.extensions && !Array.isArray(options.extensions)) {
		options.extensions = STANDARD_EXTENSIONS;
	}

	module.registerHooks(hooks);

	function resolve(specifier, context, nextResolve) {
		// Paths having a "?" needs to be resolved without
		const searchIndex = options.handleSearch && specifier.indexOf('?');
		let search = '';
		if (options.handleSearch && searchIndex >= 0) {
			search = specifier.slice(searchIndex);
			specifier = specifier.slice(0, searchIndex);
		}

		// Resolving directories or extensions only works for file imports
		if (
			(options.directories || options.extensions)
			&& !context.conditions?.has?.('require') // Don't resolve for require()
			&& ['.', '#'].some(v => specifier.startsWith(v))
		) {
			const parentURL = context?.parentURL || undefined;
			const parentExt = parentURL && path.extname(parentURL);
			let filePath = fileURLToPath(new URL(specifier, parentURL).href);

			// Try to resolve extensions before resolve directory to match require behavior
			if (options.extensions && !isFile(filePath)) {
				const ext = findExtension(filePath, options.extensions, parentExt);
				specifier += ext;
				filePath += ext;
			}

			if (options.directories && isDir(filePath)) {
				specifier += '/index';
				filePath += `${path.sep}index`;

				const ext = findExtension(filePath, options.extensions || STANDARD_EXTENSIONS, parentExt);
				specifier += ext;
			}
		}

		const result = nextResolve(specifier, context);

		// Add search value back so it can be read by import.meta.url
		if (search) result.url += search;

		return result;
	}

	function load(url, context, nextLoad) {
		// Paths having a "?" needs to be loaded without
		if (options.handleSearch) {
			const searchIndex = url.indexOf('?');
			if (searchIndex >= 0) url = url.slice(0, searchIndex);
		}

		return nextLoad(url, context);
	}
}

function isDir(path) {
	return fs.statSync(path, { throwIfNoEntry: false })?.isDirectory() || false;
}

function isFile(path) {
	return fs.statSync(path, { throwIfNoEntry: false })?.isFile() || false;
}

function findExtension(filePath, baseExtensions, parentExt) {
	const extensions = new Set();

	if (parentExt) extensions.add(parentExt);
	baseExtensions.forEach(ext => extensions.add(ext));

	for (const ext of extensions) {
		if (!isFile(`${filePath}${ext}`)) continue;
		return ext;
	}

	return '';
}

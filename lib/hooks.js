import module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Specifier from './specifier.js';

const STANDARD_EXTENSIONS = ['.js', '.mjs', '.cjs'];
const STANDARD_LOADERS = {
	text: source => `export default ${JSON.stringify(source.toString())}`,
	buffer: (_, url) => `import { readFileSync } from 'node:fs';export default readFileSync(${JSON.stringify(url)})`,
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
		if (
			// Don't hook into other modules
			context.parentURL?.includes('/node_modules/')

			// Don't resolve for require() because it resolves directories and extensions by default
			|| [...(context.conditions || [])].includes('require')
		) return nextResolve(specifier, context);

		// Paths having a "?" needs to be resolved without
		const searchIndex = options.handleSearch && specifier.indexOf('?');
		let search = '';
		if (options.handleSearch && searchIndex >= 0) {
			search = specifier.slice(searchIndex);
			specifier = specifier.slice(0, searchIndex);
		}

		if (
			(options.directories || options.extensions)

			// Resolving directories or extensions only for file imports
			&& ['.', '#', 'file://'].some(v => specifier.startsWith(v))
		) {
			specifier = internalResolve(specifier, context.parentURL, options);
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

export function registerCustomImports(importMap, baseURL) {
	importMap = prepareImportMap(importMap, baseURL);

	module.registerHooks({ resolve });

	function resolve(specifier, context, nextResolve) {
		if (
			// Don't hook into other modules
			context.parentURL?.includes('/node_modules/')
		) return nextResolve(specifier, context);

		specifier = resolveImportMap(specifier, importMap);

		// Require cannot resolve file urls
		if (specifier.startsWith('file://') && [...(context.conditions || [])].includes('require')) {
			specifier = fileURLToPath(specifier);
		}

		return nextResolve(specifier, context);
	}
}

export function createImportMapGetter(baseURL) {
	let importMap;

	return () => {
		if (importMap !== undefined) return importMap;

		const pkgPath = module.findPackageJSON(baseURL);
		const pkg = module.createRequire(baseURL)(pkgPath);

		if (!pkg.imports) return importMap = false;

		return importMap = prepareImportMap(pkg.imports, pkgPath);
	};
}

function internalResolve(specifier, parentURL, options) {
	const parentExt = parentURL && path.extname(parentURL);

	// There is no official way to resolve specifiers that needs to be resolved against the imports field map in the package.json
	if (specifier.startsWith('#')) specifier = resolveImportMap(specifier, options.importMap);
	if (specifier.startsWith('#')) return specifier;

	specifier = Specifier.from(specifier, parentURL);

	// Try to resolve extensions before resolve directory to match require behavior
	if (options.extensions && !specifier.isFile()) {
		specifier = specifier.findExtension(parentExt, options.extensions);
	}

	if (options.directories && specifier.isDir()) {
		specifier = specifier
			.append('/index')
			.findExtension(parentExt, options.extensions || STANDARD_EXTENSIONS);
	}

	return specifier.url;
}

function prepareImportMap(importMap, base) {
	base = Specifier.from(base);
	const prepared = new Map();

	for (let [search, replace] of Object.entries(importMap)) {
		if (typeof search !== 'string' || typeof replace !== 'string') continue;

		if (replace.startsWith('.')) replace = base.join(replace).url;

		if (search.includes('*') && replace.includes('*')) {
			search = search.split('*');
			replace = replace.split('*');
		}

		prepared.set(search, replace);
	}

	return prepared;
}

function resolveImportMap(specifier, importMap) {
	if (!importMap) return specifier;

	if (importMap.has(specifier)) return importMap.get(specifier);

	for (let [search, replace] of importMap) {
		if (typeof search === 'string') continue;

		if (
			!specifier.startsWith(search[0])
			|| !specifier.endsWith(search[1])
		) continue;

		specifier = ''.concat(
			replace[0],
			specifier.slice(search[0].length, -search[1].length || undefined),
			replace[1],
		);

		break;
	}

	return specifier;
}

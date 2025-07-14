import path from 'node:path/posix';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDir, isFile } from './util.js';

export default class Specifier {
	#path;

	static from(specifier, base) {
		if (path.isAbsolute(specifier)) specifier = pathToFileURL(specifier);
		else if (base && path.isAbsolute(base)) base = pathToFileURL(base);

		return new Specifier(
			URL.parse(specifier, base)?.pathname || specifier,
		);
	}

	constructor(path) {
		this.#path = path;
	}

	join(...paths) {
		const newPath = path.join(
			path.dirname(this.#path),
			...paths,
		);

		return new Specifier(newPath);
	}

	append(str) {
		return new Specifier(this.#path + str);
	}

	findExtension(...extensions) {
		extensions = new Set(extensions.flat());

		for (const ext of extensions) {
			if (!ext || !isFile(this.path + ext)) continue;
			return this.append(ext);
		}

		return this;
	}

	isDir() {
		return isDir(this.path);
	}

	isFile() {
		return isFile(this.path);
	}

	get path() {
		return fileURLToPath(this.url);
	}

	get url() {
		return this.#path.startsWith('/') ? `file://${this.#path}` : this.#path;
	}
}

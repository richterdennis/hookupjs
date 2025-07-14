import util from 'node:util';
import fs from 'node:fs';

export function getCaller(depth = 0) {
	if (util.getCallSites) {
		const callSites = util.getCallSites(3 + depth);
		const caller = callSites.pop()?.scriptName;
		if (caller) return caller;
	}

	// Backup get caller algorithm
	const originalPrepare = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => stack;

	try {
		let stack = {};
		Error.captureStackTrace(stack, getCaller);
		stack = stack.stack;

		if (!Array.isArray(stack)) {
			return undefined;
		}

		return stack[1 + depth]?.getFileName() || undefined;
	}
	finally {
		Error.prepareStackTrace = originalPrepare;
	}
}

export function isDir(path) {
	return fs.statSync(path, { throwIfNoEntry: false })?.isDirectory() || false;
}

export function isFile(path) {
	return fs.statSync(path, { throwIfNoEntry: false })?.isFile() || false;
}

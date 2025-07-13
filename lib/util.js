import util from 'node:util';

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

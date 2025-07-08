import { EventEmitter } from 'node:events';
import boot from 'hookupjs';

import { default as api } from './boot/api.boot.js';
import { default as db } from './boot/db.boot.js';
import { default as session } from './boot/session.boot.js';

const sequences = {
	api,
	db,
	session,
};

boot(sequences, {
	base: new EventEmitter(),
	global: true,
	initialized: app => app.emit('app.initialized'),
	onError: (key, error) => {
		console.error(`Error during boot sequence "${key}"!`, error);
	},
});

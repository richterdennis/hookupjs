import { setTimeout } from 'node:timers/promises';
import app from 'hookupjs/app';

export default async function({ session }) {
	await app.db;
	// await global.app.api; // if global = true
	await session;

	await setTimeout(300);

	console.log('cronjobs successfully booted!');
	return 'cronjobs';
}

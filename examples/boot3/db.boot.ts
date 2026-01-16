import { setTimeout } from 'node:timers/promises';

export default async function db() {
	await setTimeout(300);
	console.log('db successfully booted!');
	return 'db';
}

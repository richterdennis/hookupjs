import { setTimeout } from 'node:timers/promises';

export default async function api() {
	await setTimeout(500);
	console.log('api successfully booted!');
	return 'api';
}

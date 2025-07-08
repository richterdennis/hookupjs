import { setTimeout } from 'node:timers/promises';

export default async function() {
	await setTimeout(500);
	console.log('api successfully booted!');
	return 'api';
}

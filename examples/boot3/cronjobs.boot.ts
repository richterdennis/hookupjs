import { setTimeout } from 'node:timers/promises';

export default async function cronjobs({ session, db }) {
	await db;
	await session;

	await setTimeout(300);

	console.log('cronjobs successfully booted!');
	return 'cronjobs';
}

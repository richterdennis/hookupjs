import { spawn } from 'node:child_process';
import prompts from 'prompts';

run().catch(console.error);

async function run() {
	const { rank } = await prompts({
		type: 'select',
		name: 'rank',
		message: 'Publish a patch or a feature?',
		hint: 'This command bumps the version, create a git tag and push it to the remote.',
		choices: [
			{ title: 'Patch (Bugfix/Hotfix)', description: 'npm version patch', value: 'patch' },
			{ title: 'Feature (Minor Update)', description: 'npm version minor', value: 'feature' },
		],
	});

	if (!rank) return;

	console.log();
	console.log('>', 'npm', 'run', `pub:${rank}`);

	spawn('npm', ['run', `pub:${rank}`], {
		stdio: 'inherit',
		shell: true,
	}).on('error', console.error);
}

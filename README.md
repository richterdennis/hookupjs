# hookupjs

In larger projects, it's common to have multiple components that take varying amounts of time to start. It makes sense to start these components in parallel to ensure a fast and efficient application startup.

This project aims to make this as simple and fast as possible, while also offering some handy features that can be enabled—such as importing files without extensions or entire directories (via `index.js` lookup).

These features, along with importing other file types, are enabled using the new `module.registerHook` functionality in Node.js.

Zero dependencies and highly configurable.

```js
import boot from 'hookupjs';

boot('./boot');
```

## Table of Contents
**[Installation](#installation)**<br>
**[Usage](#usage)**<br>
**[App](#app)**<br>
**[Examples](#examples)**<br>

## Installation
```bash
npm i hookupjs
```

## Usage

```js
function boot(specifier: string, parentURL?: string, options?: BootOptions): Promise<App>

function boot(sequences: Sequences, options?: BootOptions): Promise<App>
```

### `specifier` and `parentURL`

| Option       | Type           | Description |
|--------------|----------------|-------------|
| `specifier`  | `string`       | Path to the boot module that exports the `Sequences`. |
| `parentURL?` | `string` `URL` | Base path used to import the specifier. Must be a file URL object, file URL string, or absolute path string. Optional due to auto-detection. Startup is faster if this is specified. Example: `import.meta.url`. |

```js
boot('./boot/sequences.js', import.meta.url);
```

### `Sequences`

| Option       | Type           | Description |
|--------------|----------------|-------------|
| `[key]`      | `Function`     | Executed in parallel with other boot sequences. The return value is registered under the name (`key`) in the resulting `App` object returned by `boot`. `App` is also the first parameter passed to the function. |

```js
// boot/sequences.js
export { default as api } from './api.js';
export { default as db } from './db.js';
export { default as session } from './session.js';

// Exports something like this:
// { api: [AsyncFunction], db: [AsyncFunction], session: [AsyncFunction] }
```

```js
// boot/db.js
import DatabaseClient from 'database';

export default async function db() {
	const client = new DatabaseClient();
	await client.connect();

	return client.getDb();
}
```

```js
// boot/api.js
import http from 'node:http';

export default async function api() {
	const server = http.createServer((req, res) => {
		// Handle HTTP API calls
	});

	server.listen(3000);

	return server;
}
```

```js
// boot/session.js
export default async function session(app) {
	const db = await app.db;

	const session = await db.getSession();
	return session;
}
```

### `BootOptions`

| Option           | Type                               | Description |
|------------------|------------------------------------|-------------|
| `base`           | `App`                              | An optional base object to which each boot sequence will be attached. |
| `global`         | `boolean`                          | If `true`, the `App` will be attached to the global scope (`global.app`). |
| `registerLoaders`| [`LoaderOptions`](#loaderoptions)  | Custom loaders that enables different import types. |
| `resolve`        | [`ResolveOptions`](#resolveoptions)| Options to customize how modules/resources are resolved. |
| `beforeLoading`  | `(app: App) => void`               | Hook called before loading the sequences. |
| `initialized`    | `(app: App) => void`               | Hook called after the sequences have initialized. |
| `booted`         | `(app: App) => void`               | Hook called after the app is fully booted. |
| `onError`        | `(app: App) => void`               | Hook called if any error occurs during boot. |

#### `LoaderOptions`

```js
// Import type json works by default
import pkg from './package.json' with { type: 'json' };

// Enable other types for import
import emailTemplate from './resources/email-template.html' with { type: 'text' };
import logo from './resources/logo.png' with { type: 'buffer' };
```

| Option   | Type                                             | Description |
|----------|--------------------------------------------------|-------------|
| `text`   | `true` `Function` | Enables import with type text. Use a function for custom implementation. |
| `buffer` | `true` `Function` | Enables import with type buffer. Use a function for custom implementation (`source` is not available). |
| `[key]`  | `Function`        | Use custom functions to enable import with custom types. |

Function definition: `(source: Buffer, url: string) => string`

```js
// ...
const registerLoaders = {
	text: true,
	yaml: (source) => `export default ${yaml.parse(source.toString())}`,
	json5: (source) => `export default ${JSON5.parse(source.toString())}`,
	properties: (source) => `export default ${properties.parse(source.toString())}`,
	toml: (source) => `export default ${toml.parse(source.toString())}`,
	xml: (source) => `export default ${xml2js(source.toString())}`,
	// ...
};
// ...
```

#### `ResolveOptions`

```js
// Import directories (auto-resolve index file)
import { SpecialService } from './services';

// Import modules without extensions (auto-resolve extensions)
import model from './model';
import controller from './controller';

// Enable search string forwarding (logger module can read the query params via import.meta.url)
import childLogger from 'logger?child=db';
```

| Option         | Type             | Description |
|----------------|------------------|-------------|
| `directories`  | `true`           | Enables importing directories (specifically, imports the index file from the directory). |
| `extensions`   | `true` `string[]`| Enables importing without extensions. Provide an array of strings defining which extensions to auto-complete. |
| `handleSearch` | `true`           | Enables forwarding of the search string (or query string). Can be accessed via `import.meta.url` in the imported module. |

```js
// ...
const resolve = {
	directories: true,
	extensions: ['.js', '.mjs', '.cjs'],
	handleSearch: true,
}
// ...
```
## App

The returned promises by the sequence functions are registered under there respective names into the `App`. Use `await` on these promises where you need the actual value. There are two ways to access the `App` everywhere in the project.

```js
import app from 'hookupjs/app';
// or
global.app // if global is set to true in the options

// This function getting called by an incoming http request
export async function uploadImage(userId, imageBuffer) {
	// Image upload logic here
	// ...

	const db = await app.db;
	db.save('image', { uuid, userId, imageUrl });

	const sockets = await app.sockets;
	sockets.sendMessage(userId, 'image uploaded');
}

// or e. g. services/db.js
export async function query(query, params) {
	const db = await app.db;
	const result = await db.query(query, params);
	logger.verbose(query, params, result);
	return result;
}

// or e. g. services/queue.js
export async function handleMessage(uuid, payload) {
	// handle logic here
	// ...

	const queue = await app.queue;
	queue.ack(uuid, result);
}
```

## Examples

Check the examples folder for more ideas.

```js
// main.js
import { EventEmitter } from 'node:events';
import logger from 'logger';
import boot from 'hookupjs';

const app = await boot('./boot', {
	base: new EventEmitter(),
	global: true, // global.app = base
	registerLoaders: {
		text: true,
	},
	resolve: {
		directories: true,
	},
	initialized: app => app.emit('app.initialized'),
	booted: (app) => {
		app.emit('app.boot.complete');
	},
	onError: (key, error) => {
		logger.fatal(`Error during boot sequence "${key}"!`, error);
	},
});

// global.app === app && app instanceof EventEmitter
app.emit('app.boot.complete.too');
```

```js
// boot.js
export async function queue(app) {
	// global.app === app
	const db = await app.db;
	const queueRaw = db.getAll('queue');
	const queue = await QueueService.init(queueRaw);

	return queue;
}

export async function db() {
	const connection = await DatabaseClient.connect();
	const db = connection.getDb();

	return db;
}
```

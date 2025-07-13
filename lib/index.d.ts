type App = { [key: PropertyKey]: any };

// Boot options
interface BootOptions<T extends App = App> {
	base?: T;
	global?: boolean;
	registerLoaders?: LoaderOptions;
	resolve?: ResolveOptions;
	imports?: { [key: string]: string };
	beforeLoading?: (ctx: T) => void;
	imported?: (sequences: Sequences<T>) => Sequences<T> | void;
	wrapper?: (run: Function) => T | void;
	initialized?: (ctx: T) => void;
	booted?: (ctx: T) => void;
	onError?: (key: PropertyKey, error: Error) => void;
}

// LoaderOptions
type LoaderOptions = LoaderOptionsBase & {
	[K in Exclude<string, SpecialKeys>]: Loader;
};

interface LoaderOptionsBase {
	text?: true | Loader,
	buffer?: true | BufferLoader,
}
type Loader = (source: Buffer, url: string) => string;
type BufferLoader = (source: undefined, url: string) => string;
type SpecialKeys = 'text' | 'buffer';

// ResolveOptions
interface ResolveOptions {
	directories?: boolean;
	extensions?: boolean | readonly string[];
	handleSearch?: boolean;
}

// Sequences
interface Sequences<T extends App = App> {
	[key: PropertyKey]: (ctx: T) => Promise<any>;
}

// boot function
declare function boot<T extends App>(sequences: Sequences<T>, options?: BootOptions<T>): Promise<T>

declare function boot<T extends App>(specifier: string, options?: BootOptions<T>): Promise<T>

declare function boot<T extends App>(specifier: string, parentURL?: string, options?: BootOptions<T>): Promise<T>

declare namespace boot {
	const app: App;
}

export default boot;

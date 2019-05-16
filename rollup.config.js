import nodeResolve from 'rollup-plugin-node-resolve';

const root = __dirname.replace(/(?:\/packages)?\/markout\/?$/, '');
const scope = `${__dirname}/packages/markout`;
// const [root, scope] = __dirname.split(/(?=(?:\/packages)?\/markout\/?$|$)/, 2);

// throw Error(console.log({root, __dirname}));

const SCOPED = /^(?:(?:\.\.\/)*|\/)(markup|markout)\/(?:lib|dist)\//;

const resolver = new class RollupHooks {
	resolveScope(specifier, referrer) {
		const absolute = specifier.startsWith('/');
		const relative = !absolute && specifier.startsWith('../');
		const scoped = (absolute || relative) && SCOPED.test(specifier);
		const bundled = specifier.includes('/dist/') || (referrer && referrer.includes('/dist/'));
		const external = scoped || bundled;
		const stats = `${absolute ? 'absolute ' : ''}${relative ? 'relative ' : ''}${scoped ? 'scoped ' : ''}${
			bundled ? 'bundled ' : ''
		}`.trim();
		const id = specifier.startsWith(root)
			? specifier
			: specifier.startsWith('/')
			? specifier.replace(/^[./]*/, `${root}/`)
			: specifier;
		return {specifier, referrer, id, external, absolute, relative, scoped, bundled, stats};
	}
	resolveId(specifier, referrer) {
		let returned, resolution;
		try {
			const {id, external, absolute} = (resolution = resolver.resolveScope(specifier, referrer));
			// if (external) return (resolution.returned = false);
			// if (external) return {external}; // (resolution.returned = {external: true, id});
			if (referrer && external) return (returned = {external, id: specifier});
			// return (returned = specifier.startsWith(scope)
			// 	? specifier.replace(scope, root)
			// 	: `${root}${specifier}`);
			if (id !== specifier) return (returned = {id});
			return (returned = null);
		} finally {
			if (resolution) {
				console.group(
					`\n\nresolveId(${'\n  %O, '.repeat(arguments.length).slice(0, -2)}\n) => %O\n`,
					...arguments,
					returned,
				);
				resolution.id && console.log(resolution.id);
				resolution.stats && console.dir(resolution.stats, {compact: true});
				console.groupEnd();
			}
		}
	}
}();

// SEE: https://rollupjs.org/
const defaults = {
	// ...{context: 'this', root, base: './packages/markout/dist'},
	context: 'this',
	cache: false,
	output: {
		chunkFileNames: 'common.js',
		dir: `${root}/markout/dist/`,
		format: 'esm',
		sourcemap: true,
		interop: false,
		paths: {
			'/markout/lib/helpers.js': '/markout/lib/helpers.js',
			'/markup/dist/tokenizer.browser.js': '/markup/dist/tokenizer.browser.js',
		},
		preferConst: true,
	},
	plugins: [resolver],
	// treeshake: { moduleSideEffects: false, },
};

const sources = {
	lib: {
		helpers: `./lib/helpers.js`,
		renderer: `./lib/renderer.js`,
		normalizer: `./lib/normalizer.js`,
		markout: `./lib/markout.js`,
		browser: `./lib/browser.js`,
		markup: `./lib/markup.js`,
		components: `./lib/components.js`,
		entities: `./lib/entities.js`,
	},
	elements: {
		'markout-content': `./elements/markout-content.js`,
	},
};

export default [
	{
		...defaults,
		input: {
			markout: sources.lib.markout,
			components: sources.lib.components,
			browser: sources.lib.browser,
		},
		manualChunks: {
			// common: ['./lib/'],
			// helpers: [sources.lib.helpers],
			// markout: [sources.lib.markout, sources.lib.renderer],
			// components: [sources.lib.components, sources.elements['markout-content']],
		},
		// experimentalOptimizeChunks: true,
	},
	// {input: sources.lib.markout, output: {...defaults.output}, ...defaults},
	// {input: sources.lib.markup, output: {...defaults.output}, ...defaults},
];

// const bundles = ((
// 	{browser, components, markout, markup, helpers},
// 	options = {
// 		output: {dir: '/'},
// 		// external: resolver.external,
// 		// external: (specifier, referrer) => (
// 		// 	console.log('external: %O from %O', specifier, referrer),
// 		// 	specifier.startsWith('/') ||
// 		// 		(specifier.startsWith('../') && ((referrer && referrer.includes('/dist/')) || specifier.includes('/dist/')))
// 		// ),
// 		// resolve: (specifier, referrer) => console.log({specifier, referrer}),
// 		// experimentalOptimizeChunks: true,
// 		// manualChunks: {helpers: [helpers]},
// 	},
// ) => ({
// 	// ['helpers:es']: {input: {helpers}, external, output: {dir: '/'}},
// 	// ['components:es']: {input: {components}, ...options},
// 	['helpers:es']: {input: {helpers}, ...options},
// 	['markup:es']: {input: {markup}, ...options},
// 	['markout:es']: {input: {markout}, ...options},
// 	['browser:es']: {input: {browser, manualChunks: {components: [components]}}, ...options},
// }))(sources);

// const configurations = [
// 	// esm('helpers', '.m.js'),
// 	// esm('components', '.m.js'),
// 	esm('browser', '.m.js'),
// 	esm('markout', '.m.js'),
// 	esm('markup', '.m.js'),
// ];

// // console.log({defaults, bundles}, configurations);

// export default configurations;

// function esm(name, naming = '[name].js', bundle = bundles[(name = `${name}:es` in bundles ? `${name}:es` : name)]) {
// 	return configure(name, 'es', naming, bundle, defaults);
// }

// function umd(name, naming = '[name].js', bundle = bundles[(name = `${name}:umd` in bundles ? `${name}:umd` : name)]) {
// 	return configure(name, 'umd', naming, bundle, defaults);
// }

// function configure() {
// 	const normalize = location => location && String.prototype.replace.call(location, /(:\/{0,3}|)([/]+)/g, '$1/');
// 	const dirname = dirname => dirname && normalize(`${dirname}/`);
// 	const resolve = (specifier, referrer = cwd, asURL = referrer && `${referrer}`.includes('://')) =>
// 		asURL
// 			? `${new URL(specifier, referrer)}`
// 			: /^[.]{1,2}[/]/.test(specifier)
// 			? new URL(specifier, `file:///${referrer || ''}`).pathname
// 			: `${specifier}`;

// 	resolve.node = nodeResolve();

// 	const cwd =
// 		typeof process === 'object'
// 			? dirname(process.cwd())
// 			: typeof location === 'object' && location && location.pathname;

// 	return (configure = (
// 		bundle,
// 		format = 'umd',
// 		fileNames = '', // entryFileNames, //
// 		{input, output: {dir: dir = '', name, ...output} = {}, ...options},
// 		{root, base, ...defaults} = {},
// 	) => {
// 		const seen = new WeakSet();
// 		root = root ? dirname(root) : cwd;
// 		base = base ? dirname(base).replace(root, './') : './dist/';

// 		const [packageID, buildID] = bundle.split(/:(.*)$/, 2);
// 		const [
// 			,
// 			pathname = '',
// 			filename = '[name]',
// 			extension = '[extname]',
// 		] = /^(?:(.*\/|)(?:((?:\[name\]|\[hash\]|[^\/.\[]+?|\[(?:(?!ext\])(?!extname\])))+?))?)?(?:(\.\[ext\]|\[extname\]|(?:\.\w+)+))?$/.exec(
// 			fileNames,
// 		); // /^(.*\/|)([^\/]*?)(\.[^\/]+|[extname]|)$/.exec(fileNames);

// 		dir = normalize(
// 			packageID && (!dir || dir.startsWith('./'))
// 				? resolve(dir || './', `${root}${base.slice(2)}${packageID}/`)
// 				: resolve(`./${dir || ''}`, `${root}${base.slice(2)}`),
// 		);

// 		if (typeof input === 'string') {
// 			// input = normalize(resolve(input, root));
// 			const suffix = buildID && format !== buildID ? `.${buildID.replace(/:.*$/, '')}` : '';
// 			const name = `${packageID || output.name || root.replace(/.*\/([^/]+)\/$/, '$1') || 'bundle'}${suffix}`;
// 			input = {[name]: input};
// 		} else if (!seen.has(input)) {
// 			seen.add(input);
// 			for (const key of Object.keys(input)) {
// 				// const path = input[key];
// 				input[key] = input[key].replace(/^\.\//, root);
// 				// input[key] = resolve(input[key], root);
// 			}
// 		}

// 		output = {...defaults.output, ...output, dir, format};

// 		(name = name || packageID) && (output.name = name);

// 		const entryFileNames = `${filename}${extension}`;
// 		output.entryFileNames = entryFileNames;

// 		if (options.manualChunks && !seen.has(options.manualChunks)) {
// 			output.chunkFileNames || (output.chunkFileNames = entryFileNames);
// 			seen.add(options.manualChunks);
// 			// for (const chunk of Object.values(options.manualChunks)) {
// 			// 	for (const key of Object.keys(chunk)) {
// 			// 		chunk[key] = chunk[key].replace(/^\.\//, root);
// 			// 	}
// 			// }
// 		}
// 		// !options.manualChunks || output.chunkFileNames || (output.chunkFileNames = entryFileNames);

// 		return {...defaults, ...options, input, output};
// 	})(...arguments);
// }

// // if (Array.isArray(input)) {
// // 	for (let i = 0, n = input.length; n--; input[i] = resolve(input[i++], root));
// // } else {
// // for (const entry of Object.getOwnPropertyNames(input)) {
// // 	const source = input[entry];
// // 	if (typeof source === 'string') {
// // 		input[entry] = normalize(resolve(source, root));
// // 	} else if (Array.isArray(source)) {
// // 		for (let i = 0, n = source.length; n--; source[i] = normalize(resolve(source[i++], root)));
// // 	} else {
// // 		throw TypeError(`Invlaid input "${input}"`);
// // 	}
// // }
// // }

// // const dist = `./dist`;

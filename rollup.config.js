import nodeResolve from 'rollup-plugin-node-resolve';

const root = __dirname.replace(/(?:\/packages)?\/markout\/?$/, '');

const SCOPED = /^(?:(?:\.\.\/)*|\/)(markup|markout)\/(?:lib|dist)\//;

const resolver = new class RollupHooks {
	resolveScope(specifier, referrer) {
		const absolute = specifier.startsWith('/');
		const relative = !absolute && specifier.startsWith('../');
		const scoped = (absolute || relative) && SCOPED.test(specifier);
		const bundled = specifier.includes('/dist/') || (referrer && referrer.includes('/dist/'));
		const id = scoped ? specifier.replace(/^(?:(?:\.\.\/)*|\/)/, `${root}/`) : specifier;
		const external = scoped || bundled;
		return {specifier, referrer, id, external, absolute, relative, scoped, bundled};
	}
	resolveId(specifier, referrer) {
		let returned;
		try {
			const {id, external} = resolver.resolveScope(specifier, referrer);
			if (external) return false;
			if (id !== specifier) return {id};
			return null;
			// if (scoped || bundled) {
			// 	// scoped && specifier.replace(/^(?:(?:\.\.\/)*|\/)/, `${root}/`);
			// 	return id;
			// 	// return (returned = {id: specifier, external: true});
			// }
			// console.log('resolveId(%O, %O) [%O] => %O', specifier, referrer, root, null);
		} finally {
			returned === undefined ||
				console.log(
					`resolveId(${'\n\t\t%O, '.repeat(arguments.length).slice(0, -2)}\n\t) => %O`,
					...arguments,
					returned,
				);
		}
	}
	// external(specifier, referrer) {
	// 	let returned;
	// 	try {
	// 		// console.log('external(%O, %O) =>', specifier, referrer);
	// 		if (
	// 			(specifier.startsWith('/') && SCOPED.test(specifier)) ||
	// 			(specifier.startsWith('../') && ((referrer && referrer.includes('/dist/')) || specifier.includes('/dist/')))
	// 		)
	// 			return (returned = true);
	// 	} finally {
	// 		returned === undefined ||
	// 			console.log(`external(${'%O, '.repeat(arguments.length).slice(0, -2)}) => %O`, ...arguments, returned);
	// 	}
	// }
}();

// SEE: https://rollupjs.org/
const defaults = {
	...{context: 'this', root, base: './packages/markout/dist'},
	cache: false,
	output: {sourcemap: true, preferConst: true},
	// chunkGroupingSize: 100000,
	// treeshake: {propertyReadSideEffects: false},
	plugins: [
		resolver,
		// /// SEE: https://github.com/rollup/rollup-plugin-node-resolve
		// nodeResolve(),
	],
};

const sources = {
	helpers: `./packages/markout/lib/helpers.js`,
	markout: `./packages/markout/lib/markout.js`,
	browser: `./packages/markout/lib/browser.js`,
	markup: `./packages/markout/lib/markup.js`,
	// entities: `./lib/entities.js`,
	// common: `./packages/parser/lib/common.js`,
};

const bundles = ((
	{browser, markout, markup, helpers},
	options = {
		output: {dir: '/'},
		// external: resolver.external,
		// external: (specifier, referrer) => (
		// 	console.log('external: %O from %O', specifier, referrer),
		// 	specifier.startsWith('/') ||
		// 		(specifier.startsWith('../') && ((referrer && referrer.includes('/dist/')) || specifier.includes('/dist/')))
		// ),
		// resolve: (specifier, referrer) => console.log({specifier, referrer}),
		// experimentalOptimizeChunks: true,
		// manualChunks: {helpers: [helpers]},
	},
) => ({
	// ['helpers:es']: {input: {helpers}, external, output: {dir: '/'}},
	['helpers:es']: {input: {helpers}, ...options},
	['markup:es']: {input: {markup}, ...options},
	['markout:es']: {input: {markout}, ...options},
	['browser:es']: {input: {browser}, ...options},
}))(sources);

const configurations = [
	// esm('helpers', '.m.js'),
	esm('browser', '.m.js'),
	esm('markout', '.m.js'),
	esm('markup', '.m.js'),
];

// console.log({defaults, bundles}, configurations);

export default configurations;

function esm(name, naming = '[name].js', bundle = bundles[(name = `${name}:es` in bundles ? `${name}:es` : name)]) {
	return configure(name, 'es', naming, bundle, defaults);
}

function umd(name, naming = '[name].js', bundle = bundles[(name = `${name}:umd` in bundles ? `${name}:umd` : name)]) {
	return configure(name, 'umd', naming, bundle, defaults);
}

function configure() {
	const normalize = location => location && String.prototype.replace.call(location, /(:\/{0,3}|)([/]+)/g, '$1/');
	const dirname = dirname => dirname && normalize(`${dirname}/`);
	const resolve = (specifier, referrer = cwd, asURL = referrer && `${referrer}`.includes('://')) =>
		asURL
			? `${new URL(specifier, referrer)}`
			: /^[.]{1,2}[/]/.test(specifier)
			? new URL(specifier, `file:///${referrer || ''}`).pathname
			: `${specifier}`;

	resolve.node = nodeResolve();

	const cwd =
		typeof process === 'object'
			? dirname(process.cwd())
			: typeof location === 'object' && location && location.pathname;

	return (configure = (
		bundle,
		format = 'umd',
		fileNames = '', // entryFileNames, //
		{input, output: {dir: dir = '', name, ...output} = {}, ...options},
		{root, base, ...defaults} = {},
	) => {
		const seen = new WeakSet();
		root = root ? dirname(root) : cwd;
		base = base ? dirname(base).replace(root, './') : './dist/';

		const [packageID, buildID] = bundle.split(/:(.*)$/, 2);
		const [
			,
			pathname = '',
			filename = '[name]',
			extension = '[extname]',
		] = /^(?:(.*\/|)(?:((?:\[name\]|\[hash\]|[^\/.\[]+?|\[(?:(?!ext\])(?!extname\])))+?))?)?(?:(\.\[ext\]|\[extname\]|(?:\.\w+)+))?$/.exec(
			fileNames,
		); // /^(.*\/|)([^\/]*?)(\.[^\/]+|[extname]|)$/.exec(fileNames);

		dir = normalize(
			packageID && (!dir || dir.startsWith('./'))
				? resolve(dir || './', `${root}${base.slice(2)}${packageID}/`)
				: resolve(`./${dir || ''}`, `${root}${base.slice(2)}`),
		);

		if (typeof input === 'string') {
			// input = normalize(resolve(input, root));
			const suffix = buildID && format !== buildID ? `.${buildID.replace(/:.*$/, '')}` : '';
			const name = `${packageID || output.name || root.replace(/.*\/([^/]+)\/$/, '$1') || 'bundle'}${suffix}`;
			input = {[name]: input};
		} else if (!seen.has(input)) {
			seen.add(input);
			for (const key of Object.keys(input)) {
				// const path = input[key];
				input[key] = input[key].replace(/^\.\//, root);
				// input[key] = resolve(input[key], root);
			}
		}

		output = {...defaults.output, ...output, dir, format};

		(name = name || packageID) && (output.name = name);

		const entryFileNames = `${filename}${extension}`;
		output.entryFileNames = entryFileNames;

		if (options.manualChunks && !seen.has(options.manualChunks)) {
			output.chunkFileNames || (output.chunkFileNames = entryFileNames);
			seen.add(options.manualChunks);
			for (const chunk of Object.values(options.manualChunks)) {
				for (const key of Object.keys(chunk)) {
					chunk[key] = chunk[key].replace(/^\.\//, root);
				}
			}
		}
		// !options.manualChunks || output.chunkFileNames || (output.chunkFileNames = entryFileNames);

		return {...defaults, ...options, input, output};
	})(...arguments);
}

// if (Array.isArray(input)) {
// 	for (let i = 0, n = input.length; n--; input[i] = resolve(input[i++], root));
// } else {
// for (const entry of Object.getOwnPropertyNames(input)) {
// 	const source = input[entry];
// 	if (typeof source === 'string') {
// 		input[entry] = normalize(resolve(source, root));
// 	} else if (Array.isArray(source)) {
// 		for (let i = 0, n = source.length; n--; source[i] = normalize(resolve(source[i++], root)));
// 	} else {
// 		throw TypeError(`Invlaid input "${input}"`);
// 	}
// }
// }

// const dist = `./dist`;

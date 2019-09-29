//@ts-check

/** @template T @param {T} pairs @returns {Readonly<T>} */
export const Enum = pairs => Object.freeze(Object.setPrototypeOf(Enum.reflect({...pairs}), null));

/** @template T @param {T} pairs @returns {T & {[K in PropertyKey & T[keyof T]]?: PropertyKey}} */
Enum.reflect = pairs => {
	/** @type {{[K in PropertyKey & T[keyof T]]?: {value: K}}} */
	const descriptors = {};
	for (const [key, value] of Object.entries(pairs))
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'symbol')
			descriptors[value] = {value: key, enumerable: false};
	Object.defineProperties(pairs, descriptors);

	return pairs;
};

/** @param {string} context @param {object} meta @param {(string | boolean)[]} [flags] */
export const debugging = (context, meta, flags) =>
	!(meta && context && flags) ||
	typeof meta.url !== 'string' ||
	typeof context !== 'string' ||
	typeof flags !== 'object' ||
	(Array.isArray(flags) && flags.includes(false)) ||
	Object.entries(flags).reduce(
		Array.isArray(flags)
			? (meta, [, flag]) => (typeof flag === 'string' && (meta[`debug:${context}:${flag}`] = true), meta)
			: (meta, [flag, value = meta[flag]]) => (
					typeof flag === 'string' && (meta[`debug:${context}:${flag}`] = value), meta
			  ),
		meta,
	);

/** @type {(text: string, matcher: RegExp | string) => IterableIterator<RegExpExecArray>} */
export const matchAll = Function.call.bind(
	String.prototype.matchAll ||
		{
			/**
			 * @this {string}
			 * @param {RegExp | string} pattern
			 */
			*matchAll() {
				const matcher = arguments[0] && (arguments[0] instanceof RegExp ? arguments[0] : RegExp(arguments[0], 'g'));
				const string = String(this);
				for (
					let match, lastIndex = -1;
					lastIndex <
					// (((arguments[0].lastIndex = lastIndex > -1 ? lastIndex : null), (match = next()))
					(((matcher.lastIndex = lastIndex > -1 ? lastIndex + 1 : null), (match = matcher.exec(string)))
						? (lastIndex = matcher.lastIndex)
						: lastIndex);
					yield match
				);
			},
		}.matchAll,
);

/** @param {string} string */
export const normalizeString = string => Object.keys({[string]: true})[0];

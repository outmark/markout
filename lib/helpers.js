/**
 * @param {string} context
 * @param {object} meta
 * @param {(string | boolean)[]} [flags]
 */
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
		// meta[`debug:${context}`] || (meta[`debug:${context}`] = {}),
	);

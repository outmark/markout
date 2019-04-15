import {debugSegmenter} from '/markout/lib/debug.js';

export class Segmenter extends RegExp {
	/**
	 * @param {string | RegExp} pattern
	 * @param {string} [flags]
	 * @param {(string|undefined)[]} [types]
	 */
	constructor(pattern, flags, types) {
		(pattern &&
			pattern.types &&
			Symbol.iterator in pattern.types &&
			((!types && (types = pattern.types)) || types === pattern.types)) ||
			Object.freeze((types = (types && Symbol.iterator in types && [...types]) || []));
		const {LOOKAHEAD = Segmenter.LOOKAHEAD, INSET = Segmenter.INSET, UNKNOWN = Segmenter.UNKNOWN} = new.target;
		Object.defineProperties(super(pattern, flags), {
			types: {value: types, enumerable: true},
			LOOKAHEAD: {value: LOOKAHEAD},
			INSET: {value: INSET},
			UNKNOWN: {value: UNKNOWN},
			// lookaheads: {value: (typeof LOOKAHEAD === 'symbol' && types.indexOf(LOOKAHEAD) + 1) || false},
			// insets: {value: (typeof insets === 'symbol' && types.indexOf(INSET) + 1) || false},
		});
	}

	/**
	 * @param {RegExpExecArray} match
	 */
	matchType(text, index) {
		return index > 0 && text !== undefined && match.types[index - 1] != null;
	}

	capture(text, index, match) {
		// let typeOf;
		if (index === 0 || text === undefined) return;

		const typeIndex = index - 1;
		const type = this.types[typeIndex];

		if (type === INSET) {
			match.inset = text;
			return;
		} else if (type === LOOKAHEAD) {
			match.lookahead = text;
			return;
		} else if (type !== UNKNOWN) {
			switch (typeof type) {
				case 'string':
					if (match.typeIndex > -1) return;
					match.type = type;
					match.typeIndex = typeIndex;
				case 'symbol':
					match[type] = text;
					return;
				case 'function':
					type(text, index, match);
					return;
			}
		}

		// !(type = this.types[(typeIndex = index) - 1]) ||
		// 	(typeIndex === this.insets
		// 		? (match.inset = text)
		// 		: typeIndex === this.lookaheads
		// 		? (match.lookahead = text)
		// 		: (type !== UNKNOWN &&
		// 				typeIndex > -1 &&
		// 				((typeOf = typeof type) === 'string'
		// 					? ((match[type] = text),
		// 					  match.typeIndex > -1 || ((match.typeIndex = typeIndex), (match.type = type)),
		// 					  true)
		// 					: typeOf === 'symbol'
		// 					? ((match[type] = text), true)
		// 					: typeOf !== 'function' || type(text, index, match))) ||
		// 		  (match.typeIndex > -1 || ((match.type = 'unknown'), (match.typeIndex = typeIndex))));
		// console.log({text, index, match, type, typeIs: typeOf, this: this});
	}

	/**
	 * @param {RegExpExecArray} match
	 * @returns {typeof match & {slot: number, type: string}}
	 */
	exec(source) {
		const match = super.exec(source);
		// match && (match.type = this.types[(match.matcher = match.findIndex(this.matchType, match)) - 1]);
		match &&
			// ((match.types = this.types),
			((match.typeIndex = -1),
			match.forEach(this.capture || Segmenter.prototype.capture, this),
			match.typeIndex > -1 || ((match.type = 'unknown'), (match.typeIndex = -1)),
			// this.lastIndex = match.index + match[0].length,
			null);

		return match;
	}

	async debug(sourceText) {
		debugSegmenter(this, sourceText);
		// (await import()).debugSegmenter(this, sourceText);
	}

	static define(factory, flags) {
		const types = []; // [ 'stub', 'feed', 'fence-block', 'code-block', 'table', 'heading', 'list', 'reference', 'divider', 'paragraph'],
		let pattern;
		const RegExp = (this && (this.prototype === Segmenter || this.prototype instanceof Segmenter) && this) || Segmenter;
		return new RegExp(
			(pattern = factory(type => (types.push((type != null || undefined) && type), ''))),
			(flags = `${(flags == null ? pattern && pattern.flags : flags) || ''}`),
			types,
		);
	}
}

export const {INSET, UNKNOWN, LOOKAHEAD} = Object.defineProperties(Segmenter, {
	INSET: {value: Symbol.for('INSET')},
	UNKNOWN: {value: Symbol.for('UNKNOWN')},
	LOOKAHEAD: {value: Symbol.for('LOOKAHEAD')},
});

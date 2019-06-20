import {patterns, ranges} from './expressions.js';

export class ComposableList extends Array {
	toString(
		listInset = this.listInset || '',
		listType = this.listType || 'ul',
		listStyle = this.listStyle,
		listStart = this.listStart,
	) {
		listStart &&
			typeof listStart !== 'number' &&
			(listStart = `${
				listStyle === 'lower-latin' || listStyle === 'upper-latin'
					? ComposableList.parseLatin(listStart)
					: listStyle === 'lower-roman' || listStyle === 'upper-roman'
					? ComposableList.parseRoman(listStart)
					: parseInt(listStart) || ''
			}`);

		const attributes = `${
			// TODO: Explore using type attribute instead
			(listStyle && `style="list-style: ${listStyle}"`) || ''
		} ${
			// TODO: Check if guard against invalid start is needed
			(listStart && `start="${listStart}"`) || ''
		}`.trim();

		const listRows = [`${listInset}<${listType}${(attributes && ` ${attributes}`) || ''}>`];
		for (const item of this) {
			if (item && typeof item === 'object') {
				if (item instanceof ComposableList) {
					const last = listRows.length - 1;
					const row = listRows[last];
					last > 0
						? (listRows[listRows.length - 1] = `${row.slice(0, -5)}\n${item.toString(
								`${listInset}\t\t`,
						  )}\n${listInset}\t</li>`)
						: listRows.push(`${listInset}\t<li>\n${item.toString(`${listInset}\t\t`)}\n${listInset}\t</li>`);
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of listInset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					listRows.push(text);
				}
			} else {
				const [, checked, content] = /^\s*(?:\[([-xX]| )\] |)(.+?)\s*$/.exec(item);

				content &&
					listRows.push(
						checked
							? `${listInset}\t<li type=checkbox ${
									checked === ' ' ? '' : checked === '-' ? 'indeterminate' : ' checked'
							  }>${content}</li>`
							: `${listInset}\t<li>${content}</li>`,
					);
			}
		}
		listRows.push(`${listInset}</${listType}>`);
		return `\n${listRows.join('\n')}\n`;
	}
}

const ChecklistMarker = new RegExp(patterns.ChecklistMarker);
const SquareMarker = new RegExp(patterns.SquareMarker);
const DiscMarker = new RegExp(patterns.DiscMarker);
const ArabicMarker = new RegExp(patterns.ArabicMarker);
const ZeroLeadingArabicMarker = new RegExp(patterns.ZeroLeadingArabicMarker);
const LatinMarker = new RegExp(patterns.LatinMarker);
const LowerLatinMarker = new RegExp(patterns.LowerLatinMarker);
const UpperLatinMarker = new RegExp(patterns.UpperLatinMarker);
const RomanMarker = new RegExp(patterns.RomanMarker);
const LowerRomanMarker = new RegExp(patterns.LowerRomanMarker);
const UpperRomanMarker = new RegExp(patterns.UpperRomanMarker);
const OrderedMarker = new RegExp(patterns.OrderedMarker);
const UnorderedMarker = new RegExp(patterns.UnorderedMarker);

LATIN: {
	const parseLatin = latin => parseLatin.mappings[latin] || NaN;

	parseLatin.mappings = {};

	'abcdefghijklmnopqrstuvwxyz'.split('').forEach((latin, index) => {
		parseLatin.mappings[(parseLatin.mappings[latin] = parseLatin.mappings[latin.toUpperCase] = index + 1)] = latin;
	});

	ComposableList.parseLatin = parseLatin;
}

ROMAN: {
	const parseRoman = roman =>
		/[^ivxlcdm]/i.test((roman = String(roman)))
			? NaN
			: roman
					.toLowerCase()
					.split('')
					.reduce(parseRoman.reducer, 0);
	// prettier-ignore
	parseRoman.mappings = Object.freeze({i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000, 1: 'i', 5: 'v', 10: 'x', 50: 'l', 100: 'c', 500: 'd', 1000: 'm'});

	parseRoman.reducer = (decimal, character, index, characters) =>
		decimal +
		(parseRoman.mappings[character] < parseRoman.mappings[characters[index + 1]]
			? -parseRoman.mappings[character]
			: parseRoman.mappings[character]);

	ComposableList.parseRoman = parseRoman;
}

ComposableList.ORDERED_STYLE = /^(?:(0+[1-9]\d*)(?=\. )|(\d+)(?=\. )|([ivx]+)(?=\. )|([a-z])(?=[.)] ))|/i;
ComposableList.ORDERED_STYLE.key = ['decimal-leading-zero', 'decimal', 'roman', 'latin'];

ComposableList.orderedStyleOf = (marker, variant, fallback) => {
	const category =
		ComposableList.ORDERED_STYLE.key[
			ComposableList.ORDERED_STYLE.exec(marker)
				.slice(1)
				.findIndex(Boolean)
		];
	return (
		(category !== undefined &&
			(category === 'latin' || category === 'roman'
				? `${
						variant === 'lower' || (variant !== 'upper' && marker === marker.toLowerCase()) ? 'lower' : 'upper'
				  }-${category}`
				: category === 'decimal'
				? variant !== 'leading-zero'
					? 'decimal'
					: 'decimal-leading-zero'
				: variant !== 'decimal'
				? 'decimal-leading-zero'
				: 'decimal')) ||
		fallback
	);
};

ComposableList.markerIsLike = (marker, expected) =>
	expected in ComposableList.LIKE ? ComposableList.LIKE[expected].test(marker) : undefined;

ComposableList.LIKE = {
	['square']: SquareMarker,
	['disc']: DiscMarker,
	['decimal']: ArabicMarker,
	['decimal-leading-zero']: ZeroLeadingArabicMarker,
	['latin']: LatinMarker,
	// NOTE: We allow cases insenstivity as a common convencience feature
	['lower-latin']: LatinMarker,
	['upper-latin']: LatinMarker,
	['roman']: RomanMarker,
	// NOTE: We allow cases insenstivity as a common convencience feature
	['lower-roman']: RomanMarker,
	['upper-roman']: RomanMarker,
	['ol']: OrderedMarker,
	['ul']: UnorderedMarker,
	['checkbox']: ChecklistMarker,
};

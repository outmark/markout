export class ComposableList extends Array {
	toString(
		listInset = this.listInset || '',
		listType = this.listType || 'ul',
		listStyle = this.listStyle,
		listStart = this.listStart,
	) {
		listStart &&
			typeof listStart !== 'number' &&
			// console.log(
			// 	listStart,
			(listStart = `${
				listStyle === 'lower-latin' || listStyle === 'upper-latin'
					? ComposableList.parseLatin(listStart)
					: listStyle === 'lower-roman' || listStyle === 'upper-roman'
					? ComposableList.parseRoman(listStart)
					: // listStyle === 'lower-latin'
					  // 	? 'abcdefghijklmnopqrstuvwxyz'.indexOf(listStart) + 1
					  // 	: listStyle === 'upper-latin'
					  // 	? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(listStart) + 1
					  parseInt(listStart) || ''
			}`);
		// );
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
				const [, checkbox, content] = /^\s*(?:\[([xX]| )\] |)(.+?)\s*$/.exec(item);

				content &&
					listRows.push(
						checkbox
							? // ? `${listInset}\t<label><input type=checkbox ${checkbox === ' ' ? '' : ' checked'}/>${content}</label>`
							  // ? `${listInset}\t<label><input type=checkbox ${checkbox === ' ' ? '' : ' checked'}/>${content}</label>`
							  `${listInset}\t<li type=checkbox ${checkbox === ' ' ? '' : ' checked'}>${content}</li>`
							: `${listInset}\t<li>${content}</li>`,
					);
			}
		}
		listRows.push(`${listInset}</${listType}>`);
		return `\n${listRows.join('\n')}\n`;
	}
}

ComposableList.CHECKBOX = /^[-] \[[ xX]\](?=\s|$)/;
ComposableList.SQUARE = /^[-](?! \[[ xX]\])(?=\s|$)/;
ComposableList.DISC = /^[*](?=\s|$)/;
ComposableList.DECIMAL = /^0*\d+\./;

LATIN: {
	const parseLatin = latin => parseLatin.mappings[latin] || NaN;

	parseLatin.mappings = {};

	'abcdefghijklmnopqrstuvwxyz'.split('').forEach((latin, index) => {
		parseLatin.mappings[(parseLatin.mappings[latin] = parseLatin.mappings[latin.toUpperCase] = index + 1)] = latin;
	});

	ComposableList.parseLatin = parseLatin;
	ComposableList.LATIN = /^[a-z]+\./i;
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
	ComposableList.ROMAN = /^[ivxlcdm]+\./i;
}

// ComposableList.ORDERED = /^(?:0+[1-9]\d*|\d+|[ivx]+|[a-z])(?=\. |$)/i;
ComposableList.ORDERED = /^(?:0+[1-9]\d*|\d+|[ivx]+|[a-z])(?=\. |$)|^[a-z](?=\) |$)/i;
ComposableList.UNORDERED = /^[-*](?= |$)/i;

// ComposableList.ORDERED_STYLE = /^(?:(0+[1-9]\d*)|(\d+)|([ivx]+)|([a-z]))(?=\. )|/i;
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
	['checkbox']: ComposableList.CHECKBOX,
	['square']: ComposableList.SQUARE,
	['disc']: ComposableList.DISC,
	['decimal']: ComposableList.DECIMAL,
	['decimal-leading-zero']: ComposableList.DECIMAL,
	['roman']: ComposableList.ROMAN,
	['lower-roman']: ComposableList.ROMAN,
	['upper-roman']: ComposableList.ROMAN,
	['latin']: ComposableList.LATIN,
	['lower-latin']: ComposableList.LATIN,
	['upper-latin']: ComposableList.LATIN,
	['ul']: ComposableList.UNORDERED,
	['ol']: ComposableList.ORDERED,
};

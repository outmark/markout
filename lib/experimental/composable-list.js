export class ComposableList extends Array {
	toString(inset = this.inset || '', type = this.type || 'ul', style = this.style, start = this.start) {
		const attributes = `${
			// TODO: Explore using type attribute instead
			(style && `style="list-style: ${style}"`) || ''
		} ${
			// TODO: Check if guard against invalid start is needed
			(start && `start="${start}"`) || ''
		}`.trim();

		const rows = [`${inset}<${type}${(attributes && ` ${attributes}`) || ''}>`];
		for (const item of this) {
			if (item && typeof item === 'object') {
				if (item instanceof ComposableList) {
					const last = rows.length - 1;
					const row = rows[last];
					last > 0
						? (rows[rows.length - 1] = `${row.slice(0, -5)}\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`)
						: rows.push(`${inset}\t<li>\n${item.toString(`${inset}\t\t`)}\n${inset}\t</li>`);
				} else {
					const insetText = `${item}`;
					let text = insetText;
					for (const character of inset) {
						if (!text.startsWith(character)) break;
						text = text.slice(1);
					}
					rows.push(text);
				}
			} else {
				const [, checkbox, content] = /^\s*(?:\[([xX]| )\] |)(.+?)\s*$/.exec(item);

				content &&
					rows.push(
						`${inset}\t<li>${
							checkbox
								? `<label><input type=checkbox ${checkbox === ' ' ? '' : ' checked'}>${content}</label>`
								: content
						}</li>`,
					);
			}
		}
		rows.push(`${inset}</${type}>`);
		return `\n${rows.join('\n')}\n`;
	}
}

ComposableList.SQUARE = /^[-](?=\s|$)/;
ComposableList.DISC = /^[*](?=\s|$)/;
ComposableList.DECIMAL = /^0*\d+\./;
ComposableList.LATIN = /^[a-z]\./i;
ComposableList.ROMAN = /^[ivx]+\./i;
ComposableList.ORDERED = /^(?:0+[1-9]\d*|\d+|[ivx]+|[a-z])(?=\. |$)/i;
ComposableList.UNORDERED = /^[-*](?= |$)/i;

ComposableList.ORDERED_STYLE = /^(?:(0+[1-9]\d*)|(\d+)|([ivx]+)|([a-z]))(?=\. )|/i;
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
	['square']: ComposableList.SQUARE,
	['disc']: ComposableList.DISC,
	['decimal']: ComposableList.DECIMAL,
	['decimal-leading-zero']: ComposableList.DECIMAL,
	['roman']: ComposableList.ROMAN,
	['lower-roman']: ComposableList.ROMAN,
	['upper-roman']: ComposableList.ROMAN,
	['latic']: ComposableList.LATIN,
	['lower-latic']: ComposableList.LATIN,
	['upper-latic']: ComposableList.LATIN,
	['ul']: ComposableList.UNORDERED,
	['ol']: ComposableList.ORDERED,
};

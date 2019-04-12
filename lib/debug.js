import {matchAll} from '/markout/lib/helpers.js';

const SEGMENT_MARGIN = `\u{00A0}`.repeat(10);
const RESET_STYLE = 'font-family: monospace; padding: 1px 0; margin: 1px 0; line-height: 1.75em;';
const SPACE = `\u{2423}`;
const TAB = `\u{2192}`;

export const debugSegmenter = {
	async debug(segmenter, sourceText) {
		const stamp = '' && ` #${Date.now()}`;
		console.time(`segmenting${stamp}`);
		const matches = [...matchAll(sourceText, segmenter)];
		console.timeEnd(`segmenting${stamp}`);
		const {length} = matches;
		await new Promise(resolve => setTimeout(resolve, 100));
		console.time(`printing${stamp}`);
		console.group('output');
		const logs = [];
		try {
			let format, segment;
			let lastIndex = -1;
			for (const [segment, match] of Object.entries(matches)) {
				if (!match) continue;
				format = '';
				let string, lines, index, type, typeIndex, properties, lookahead, inset;
				({0: string, index, type, typeIndex, lookahead, inset, ...properties} = match);
				const values = [];

				const delta = index - lastIndex;

				const skipped =
					(delta > 1 &&
						sourceText
							.slice(lastIndex, index - 1)
							.replace(/^\n/, '')
							.split(/\n/)) ||
					'';
				//

				lastIndex = index + string.length;

				format = '';

				if (skipped.length) {
					// (values.push(initial, `border: 1px solid coral; border-inline-width: 1px;  color: coral;`, skipped, initial),
					values.push(
						...skipped.flatMap((line, index) => [
							`${RESET_STYLE} color: coral;`,
							index ? `\n${SEGMENT_MARGIN}` : `${'skipped'.padStart(SEGMENT_MARGIN.length - 1)}\u{00A0}`,
							`${RESET_STYLE} border: 0 solid coral; border-left-width: 1.5px; border-right-width: 1.5px; color: coral;  background: #FFFAFA;`,
							line,
						]),
						RESET_STYLE,
					),
						(format += `${`%c%s%c%s`.repeat(skipped.length)}%c\0`);

					logs.push(['log', format, ...values.splice(0, values.length)]);
					format = '';
				}

				inset !== undefined && (properties.inset = inset);

				const overlap = (delta < 1 && string.slice(0, 1 - delta)) || '';
				overlap && logs.push(['warn', 'overlap:', overlap, match]);

				const color = ['#3366FF', '#FF6633', '#33FF66', '#CCCC33', '#33CCCC', '#CC33CC'][(typeIndex + 1 || 0) % 6];

				(lines = string.slice((inset && inset.length) || 0).split(`\n${inset || ''}`)),
					(inset = (inset && inset.replace(/ /g, SPACE).replace(/\t/g, TAB)) || ''),
					values.push(
						...lines.flatMap((line, index) => [
							`${RESET_STYLE} color: ${color};`,
							`${RESET_STYLE} border: 1px solid ${color}99; background: ${color}; color: white; font-weight: bold;`,
							inset || '\u200D',
							`${RESET_STYLE} border: 1px solid ${color}99; color: ${color}; background: ${color}11; font-weight: bold;`,
							line || '\u200D',
							RESET_STYLE,
						]),
					),
					(format += `%c${type.padStart(
						SEGMENT_MARGIN.length - 1,
					)}\u{00A0}%c%s%c%s%c${`%c\n${SEGMENT_MARGIN}%c%s%c%s%c`.repeat(lines.length - 1)}`);

				lookahead !== undefined &&
					(values.push(
						// RESET_STYLE,
						// `${LOOKAHEAD_STYLE} color: white; background: darkgrey;`,
						// '?=',
						`${RESET_STYLE} border: 1px solid #99999911; color: #99999999;`,
						`${
							JSON.stringify(`${(properties.lookahead = lookahead).slice(0, 5)}${lookahead.length > 5 ? '…' : ''}`)
								.replace(/\\\\/g, '\\')
								.replace(/^"(.*)"$/, '$1')
							// .replace(/%/g, '&x34;')
						}`,
						// RESET_STYLE,
					),
					(format += `%c%s`));

				logs.push(['log', `${format}`.trimRight(), ...values.splice(0, values.length)]);
				// return values;
			}
		} catch (exception) {
			logs.push(['warn', exception]);
		}
		console.timeEnd(`printing${stamp}`);
		for (const [method, ...args] of logs) Reflect.apply(console[method], console, args);
		console.groupEnd();
	},
}.debug;

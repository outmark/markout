import {matchAll} from '/markout/lib/helpers.js';

const SEGMENT_MARGIN = `\u{00A0}`.repeat(10);
const RESET_STYLE = 'font-family: monospace; padding: 1px 0; margin: 1px 0; line-height: 1.75em;';
const SPACE = `\u{2423}`;
const TAB = `\u{2192}`;

export const debugSegmenter = {
	async debug(segmenter, sourceText) {
		const stamp = '' && ` #${Date.now()}`;
		console.time(`segmenting${stamp}`);
		const allMatches = [...matchAll(sourceText, segmenter)];
		console.timeEnd(`segmenting${stamp}`);
		const {length} = allMatches;
		await new Promise(resolve => setTimeout(resolve, 100));
		console.time(`printing${stamp}`);
		console.group('output');
		const output = [];
		try {
			let outputFormat;
			let lastMatchOffset = -1;
			for (const [segmentIndex, currentMatch] of Object.entries(allMatches)) {
				if (!currentMatch) continue;
				outputFormat = '';
				let matchText,
					matchTextLines,
					matchOffset,
					matchType,
					matchTypeIndex,
					matchProperties,
					matchLookahead,
					matchInset;
				({
					0: matchText,
					index: matchOffset,
					type: matchType,
					typeIndex: matchTypeIndex,
					lookahead: matchLookahead,
					inset: matchInset,
					...matchProperties
				} = currentMatch);
				const outputValues = [];

				const offsetDifference = matchOffset - lastMatchOffset;

				const skippedText =
					(offsetDifference > 1 &&
						sourceText
							.slice(lastMatchOffset, matchOffset - 1)
							.replace(/^\n/, '')
							.split(/\n/)) ||
					'';
				//

				lastMatchOffset = matchOffset + matchText.length;

				outputFormat = '';

				if (skippedText.length) {
					// (values.push(initial, `border: 1px solid coral; border-inline-width: 1px;  color: coral;`, skipped, initial),
					outputValues.push(
						...skippedText.flatMap((skippedLined, skippedLineIndex) => [
							`${RESET_STYLE} color: coral;`,
							skippedLineIndex ? `\n${SEGMENT_MARGIN}` : `${'skipped'.padStart(SEGMENT_MARGIN.length - 1)}\u{00A0}`,
							`${RESET_STYLE} border: 0 solid coral; border-left-width: 1.5px; border-right-width: 1.5px; color: coral;  background: #FFFAFA;`,
							skippedLined,
						]),
						RESET_STYLE,
					),
						(outputFormat += `${`%c%s%c%s`.repeat(skippedText.length)}%c\0`);

					output.push(['log', outputFormat, ...outputValues.splice(0, outputValues.length)]);
					outputFormat = '';
				}

				matchInset !== undefined && (matchProperties.inset = matchInset);

				const overlappingText = (offsetDifference < 1 && matchText.slice(0, 1 - offsetDifference)) || '';
				overlappingText && output.push(['warn', 'overlap:', overlappingText, currentMatch]);

				const color = ['#0066FF', '#FF6600', '#00FF66', '#CCCC00', '#00CCCC', '#CC00CC'][(matchTypeIndex + 1 || 0) % 6];

				(matchTextLines = matchText.slice((matchInset && matchInset.length) || 0).split(`\n${matchInset || ''}`)),
					(matchInset = (matchInset && matchInset.replace(/ /g, SPACE).replace(/\t/g, TAB)) || ''),
					outputValues.push(
						...matchTextLines.flatMap((line, index) => [
							`${RESET_STYLE} color: ${color};`,
							`${RESET_STYLE} border: 1px solid ${color}99; background: ${color}; color: white; font-weight: bold;`,
							matchInset || '\u200D',
							`${RESET_STYLE} border: 1px solid ${color}99; color: ${color}99; background: ${color}11; font-weight: bold; text-shadow: 0 0 0 #999F;`,
							line || '\u200D',
							RESET_STYLE,
						]),
					),
					(outputFormat += `%c${matchType.padStart(
						SEGMENT_MARGIN.length - 1,
					)}\u{00A0}%c%s%c%s%c${`%c\n${SEGMENT_MARGIN}%c%s%c%s%c`.repeat(matchTextLines.length - 1)}`);

				matchLookahead !== undefined &&
					(outputValues.push(
						// RESET_STYLE,
						// `${LOOKAHEAD_STYLE} color: white; background: darkgrey;`,
						// '?=',
						`${RESET_STYLE} border: 1px solid #99999911; color: #99999999;`,
						`${
							JSON.stringify(
								`${(matchProperties.lookahead = matchLookahead).slice(0, 5)}${matchLookahead.length > 5 ? '…' : ''}`,
							)
								.replace(/\\\\/g, '\\')
								.replace(/^"(.*)"$/, '$1')
							// .replace(/%/g, '&x34;')
						}`,
						// RESET_STYLE,
					),
					(outputFormat += `%c%s`));

				output.push(['log', `${outputFormat}`.trimRight(), ...outputValues.splice(0, outputValues.length)]);
				// return values;
			}
		} catch (exception) {
			output.push(['warn', exception]);
		}
		console.timeEnd(`printing${stamp}`);
		for (const [method, ...args] of output) Reflect.apply(console[method], console, args);
		console.groupEnd();
	},
}.debug;

import { k as raw, j as entities } from './helpers.m.js';

const {
	UnicodeIdentifier,
	MarkdownIdentityPrefixer,
	MarkdownIdentityJoiner,
	MarkdownIdentityWord,
	MarkdownIdentity,
} = (({
	IdentifierStart,
	IdentifierPart,
	UnicodeIdentifierStart = IdentifierStart.slice(2),
	UnicodeIdentifierPart = IdentifierPart.slice(2),
	UnicodeIdentifier = raw`[${UnicodeIdentifierStart}][${UnicodeIdentifierPart}]*`,
	MarkdownWordPrefixes = raw`$@`,
	MarkdownWordPrefix = raw`[${MarkdownWordPrefixes}]?`,
	MarkdownWord = raw`${MarkdownWordPrefix}${UnicodeIdentifier}`,
	MarkdownWordJoiners = raw` \\\/:_\-\xA0\u2000-\u200B\u202F\u2060`,
	MarkdownWordJoiner = raw`[${MarkdownWordJoiners}]+`,
	MarkdownIdentity = raw`(?:\s|\n|^)(${MarkdownWord}(?:${MarkdownWordJoiner}${MarkdownWord})*(?=\b[\s\n]|$))`,
}) => ({
	UnicodeIdentifier: new RegExp(UnicodeIdentifier, 'u'),
	MarkdownIdentityPrefixer: new RegExp(raw`^[${MarkdownWordPrefixes}]?`, 'u'),
	MarkdownIdentityJoiner: new RegExp(raw`[${MarkdownWordJoiners}]+`, 'ug'),
	MarkdownIdentityWord: new RegExp(MarkdownWord, 'u'),
	MarkdownIdentity: new RegExp(MarkdownIdentity, 'u'),
	// MarkdownIdentitySeparators: new RegExp(raw`[${MarkdownWordPrefixes}${MarkdownWordJoiners}]+`, 'ug')
}))(entities.es);

export { UnicodeIdentifier, MarkdownIdentityPrefixer, MarkdownIdentityJoiner, MarkdownIdentityWord, MarkdownIdentity };
//# sourceMappingURL=entities.m.js.map

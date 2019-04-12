import {readFileSync, writeFileSync} from 'fs';
// import suite from './suite.json';

const root = import.meta.url;
const base = new URL('./markdown-testsuite/', root);
const suite = JSON.parse(readFileSync(new URL('./suite.json', base)));

const fragments = [];

for (const file of suite) {
	fragments.push(`## ${'`'}${file}${'`'}\n\n<figure>\n\n${readFileSync(new URL(`./${file}`, base))}\n\n</figure>\n`);
}

const generated = `${fragments.join('\n<hr/>\n')}`;

writeFileSync(new URL(`./markdown-testsuite.md`, root), generated, {flag: 'w'});

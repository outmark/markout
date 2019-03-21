// export * from './markout.js';
import '../../../quench/elements/markout-content.js';
import {loadSourceTextFrom} from '../../../components/lib/fetch.js';

(async () => {
	const {load} = {
		async load(src) {
			arguments.length || (src = this.getAttribute('src'));
			if (!src) return;
			const url = new URL(src, this.baseURI);
			this.sourceURL = url;
			this.sourceText = (await loadSourceTextFrom(url)) || '';
		},
	};

	for (const section of document.body.querySelectorAll('markout-content[src]') || '')
		section.load || (section.load = load), section.load();
})();

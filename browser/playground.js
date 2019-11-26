if (typeof self === 'object' && self && self === self.self) {
  (typeof globalThis === 'object' && globalThis) || (1, eval)('this.globalThis = this');

  if (/^about:/.test(self.location)) {
    import('./frame.js?resize');

    const inDevelopment = /\?.*?\bdev\b/i.test(import.meta.url);
    const markoutURL = inDevelopment ? '../lib/browser.js' : '../dist/browser.js';
    const stylesURL = '/markout/styles/styles.css';
    const rootStylesURL = '/markout/styles/root.css';
    const contentStyleID = 'style:styles/markout.css';
    const contentStyleURL = '/markout/styles/markout.css';

    // Content Styles
    document.head.querySelector(`link[id="${contentStyleID}"][rel=preload][as=style]`) ||
      document.head.appendChild(
        Object.assign(document.createElement('link'), {
          id: contentStyleID,
          rel: 'preload',
          as: 'style',
          href: contentStyleURL,
        }),
      );

    // Root Styles
    document.head.querySelector(
      `link[rel=stylesheet][href*="${stylesURL}"],link[rel=stylesheet][href*="${rootStylesURL}"]`,
    ) ||
      document.head.appendChild(
        Object.assign(document.createElement('link'), {
          rel: 'stylesheet',
          href: rootStylesURL,
        }),
      );

    import(markoutURL);
  } else if (typeof self.customElements === 'object') {
    customElements.get('markout-playground') || import('../elements/markout-playground.js');
  }
} else {
  console.warn('Unsupported Environment');
}

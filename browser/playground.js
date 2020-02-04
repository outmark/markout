if (typeof self === 'object' && self && self === self.self) {
  (typeof globalThis === 'object' && globalThis) || (1, eval)('this.globalThis = this');

  if (/^about:/.test(self.location)) {
    import('./frame.js?resize');

    const inDevelopment = /\?.*?\bdev\b/i.test(import.meta.url);
    const markoutScope = `${new URL('../', import.meta.url)}`;
    const bootstrapURL = inDevelopment ? `${markoutScope}/lib/browser.js` : `${markoutScope}/dist/browser.js`;

    // const pageStyleElement = document.head.querySelector(
    //   `link[id="${contentStyleID}"][rel=preload][as=style], link[id="${contentStyleID}"][prefetch]`,
    // );
    const pageStylesURL = `${markoutScope}styles/styles.css`;
    const rootStylesURL = `${markoutScope}styles/root.css`;
    const contentStyleID = 'style:styles/markout.css';
    const contentStyleURL = `${markoutScope}styles/markout.css`;

    // Content Styles
    document.head.querySelector(
      `link[id="${contentStyleID}"][rel=preload][as=style], link[id="${contentStyleID}"][prefetch]`,
    ) ||
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
      `link[rel=stylesheet][href*="${pageStylesURL}"],link[rel=stylesheet][href*="${rootStylesURL}"]`,
    ) ||
      document.head.appendChild(
        Object.assign(document.createElement('link'), {
          rel: 'stylesheet',
          href: rootStylesURL,
        }),
      );

    import(bootstrapURL);
  } else if (typeof self.customElements === 'object') {
    customElements.get('markout-playground') || import('../elements/markout-playground.js');
  }
} else {
  console.warn('Unsupported Environment');
}

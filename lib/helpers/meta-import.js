// @ts-check

/**
 * @typedef {{<T extends string, V extends {} = Record<string, unknown>>(url: T): Promise<Readonly<V>>, url: string, meta: MetaImport}} Import
 * @typedef {ImportMeta & {import: Import}} MetaImport
 * @param {ImportMeta & Partial<MetaImport>} importMeta
 * @returns {MetaImport}
 */
export const createMetaImport = importMeta => {
  if (!importMeta.import) {
    Object.defineProperty(importMeta, 'import', {
      value: (ƒ => {
        importMeta.import = ƒ;
        // @ts-ignore
        ƒ = importMeta[`‹${(ƒ.url = importMeta.url)}›`] = ƒ.bind((ƒ.meta = importMeta));
        // console.log(importMeta);
        return ƒ;
      })(
        /** @type {Import} */ ({
          /**
           * @template {string} T
           * @template {Record<string, unknown>} V
           * @param {T} url
           * @returns {Promise<Readonly<V>>}
           */
          async import(url) {
            let key, exports;
            key = 'import()';
            exports = this.import[key] || (this.import[key] = Object.freeze(Object.create(null)));
            url = `${url}`;
            try {
              if (url.includes('/') || url.startsWith('data:')) {
                key = `import(‹${url}›)`; //new URL(url, 'file:///').href;
                exports =
                  key in this
                    ? this.import[key]
                    : (this.import[key] = await (
                        this['‹@›'] || (this['‹@›'] = (1, eval)('specifier => import(specifier)'))
                      )(url));
              }
            } finally {
              exports !== this.import['import()'] || key in this || (this.import[key] = this.import['import()']);
            }
            return exports;
          },
        }.import),
      ),
      writable: false,
    });
  }
  return /** @type {MetaImport} */ (importMeta);
};

// /**
//  * @template {string} T
//  * @template V
//  * @typedef {(url: T) => V extends {} ? V : import(T)} import.from
//  */

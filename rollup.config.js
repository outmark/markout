import {createRequire} from 'module';
import helpers from '@smotaal.io/tools/rollup/helpers.cjs';

const project = {};

project.root = new helpers.Locator(/(?:\/packages)?\/(markout)(?:\/.*|)$/[Symbol.replace](import.meta.url, '/$1/'));
project.package = new helpers.Locator('./package.json', project.root);
project.manifest = new helpers.Locator('./rollup.config.json', project.root);
project.logging = 0;
project.configuation = (typeof require === 'function' ? require : createRequire(import.meta.url))(
  project.manifest.filename,
);

export default (project => {
  let {
    root,
    configuation,
    logging = configuation.logging || 0,

    configuation: {bundles, defaults: {plugins = [], ...defaults} = {}, scopes},
  } = project;

  let resolver = new helpers.Resolver({
    root: root.filename,
    scopes: scopes,
    logging,
  });

  let builds = [];
  plugins = [
    {
      resolveId() {
        return resolver.resolveId(this, ...arguments);
      },
    },
    ...plugins,
  ];

  if (bundles && bundles.length > 0) {
    for (const {input, output, chunks, watch, ...build} of bundles) {
      builds.push(
        Object.assign(build, defaults, {
          input,
          output: {...defaults.output, ...output},
          watch: {...defaults.watch, ...watch},
          plugins,
        }),
      );
    }
  }

  return builds;
})(project);

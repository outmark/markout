if (typeof document === 'object' && document.currentScript) {
  const {currentScript, links} = document;

  const snaps = {};
  const counter = (target, first = 'a', field = 'index') => String.fromCharCode((target[field] == null && (target[field] = first.charCodeAt(0)), target[field]++));

  // const snap = (id = String.fromCharCode((snap.index || (snap.index = 'a'.charCodeAt(0)), snap.index++))) => console.log.bind(null, '%O ‹%s› — %o', currentScript, id, (snaps[id] = {links: [... links]}));
  const snap = (id = counter(snap)) => console.log.bind(null, '%O ‹%s› — %o', currentScript, id, (snaps[id] = {links: [... links]}));

  snap()();

  const template = document.createElement('template');
  template.innerHTML = `
		<link rel="stylesheet" href="/pholio/styles/fonts/iosevka/iosevka.css" />
    <link rel="stylesheet" href="/pholio/styles/styles.css" />
    <!-- <link rel="preload" as="style" href="/pholio/styles/styles.css" /> -->
		<link rel="preload" as="style" href="/pholio/styles/typography.css" />
		<link rel="preload" as="style" href="/pholio/styles/layouts/grids.css" />
		<link rel="preload" as="style" href="/pholio/styles/common.css" />
  `;

  snap()();

  currentScript.after(template.content.cloneNode(true));

  snap()();

  requestAnimationFrame(() => {
    snap()();
    currentScript.after(template.clone);
    snap()();
  });
}

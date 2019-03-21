if (typeof document === 'object' && document.currentScript) {
	const {currentScript, links} = document;

	const snaps = false; // {};
	const counter = (target, first = 'a', field = 'index') =>
		String.fromCharCode((target[field] == null && (target[field] = first.charCodeAt(0)), target[field]++));

	const snap = (id = counter(snap)) =>
		console.log.bind(null, '%O ‹%s› — %o', currentScript, id, (snaps[id] = {links: [...links]}));

	snaps && snap()();

	const template = document.createElement('template');
	template.innerHTML = `
		<link rel="stylesheet" href="/pholio/styles/fonts/iosevka/iosevka.css" />
    <link rel="stylesheet" href="/pholio/styles/styles.css" />
    <!-- <link rel="preload" as="style" href="/pholio/styles/styles.css" /> -->
		<link rel="preload" as="style" href="/pholio/styles/typography.css" />
		<link rel="preload" as="style" href="/pholio/styles/layouts/grids.css" />
		<link rel="preload" as="style" href="/pholio/styles/common.css" />
  `;

	snaps && snap()();

	currentScript.after(template.content.cloneNode(true));

	snaps && snap()();

	requestAnimationFrame(() => {
		snaps && snap()();
		currentScript.after(template.clone);
		snaps && snap()();
	});
}

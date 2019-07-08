<!doctype html markout playground>

<markout-playground>

# PostScript Matcher

## Initialize Playground

Since Playgrounds don't make any assumptions, we will need to define a global namespace object to keep track of things.

```js
const Playground = {};
```

## Grammar

```js
Playground.createPostScriptEntities = async () => {
	const {Matcher} = import('/markup/experimental/matcher/matcher.js');
	const {capture, forward, fault, open, close} = await import('markup/experimental/es/helpers.js');

	const Entities = (Playground.PostScriptEntities = {
		Break: ({lf = true, crlf = false}) =>
			Matcher.define(
				entity => Matcher.sequence`
        ${Matcher.join(
					// The default break is \n
					(lf || !crlf) && '\\n',
					// The optional break is \r\n
					crlf && '\\r\\n',
				)}
        ${entity((text, entity, match, state) => {
					match.format = 'whitespace';
					capture('break', match);
				})}
      `,
			),
	});

	return Entities;
};
```

## Matcher

```js
(async () => {
	const {Matcher} = import('/markup/experimental/matcher/matcher.js');

	Matcher.define(entity => Matcher.join(entity()));
})();
```

</markout-playground>

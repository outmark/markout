# Markout › Playground

Playgrounds in Markout are as straightforward as it gets, and then some.

## Straightforward

When you create a `<markout-playground>` element, think `<iframe>`, the contents of which will be populated from the fenced code blocks within your narrative. This means that the narrative and its playground will each get their own DOM.

---

> **Why?** This divide will actually feel a lot more intuitive because your narrative and the thing it narrates will only rarely be the same thing.

---

<markout-playground>

### Playground

Everything inside a `<markout-playground>` is considered a single playground, which will be appended in the end of the element. Alternatively, you can use the `<output here><!--and you can leave some just-in-case markup here--></output>` placeholder (as shown here).

<output style:=fenced here>

<script type=module src="/markout/elements/markout-playground.js"></script>

**Oops**! Playground should have render here!

</output>

### Fenced Blocks

Since fenced code can sometimes be just for narrative, it makes sense to want to explicitly indicate which fenced code blocks will end up in the playground's DOM.

Let's look at the different ways to do that!

#### HTML Fragments

To turn your <code>\`\`\`html</code> block into actual content, simply change it to <code>\`\`\`html fragment</code>.

```html fragment
First html content fragment!

<!-- Explicit reset stylesheet (preferred way) -->
<link rel="stylesheet" href="/markout/styles/playground.css" />

<!-- Explicit reset stylesheet (alternative way) -->
<!-- <style>@import '/markout/styles/playground.css';</style> -->

<script>
	// This is to trace when it executes
	console.trace(document.currentScript);
</script>
```

#### Markout Fragments

You can also do the same with a <code>\`\`\`md fragment</code> which will automatically create and bootstrap the `<markout-content>` wrapper for you.

```md fragment
First `<markout-content>`-wrapped fragment!
```

#### You're Just Weird Fragments

If you `fragment` weird, that's okay… you will likely get an `object`-wrapped fragment that will be escaped as needed unless you throw `preserve-entities` in the mix.

```text fragment
First <object>-wrapped fragment… weird!
```

---

It's a little different if you want the block to output inside of a tag, which must also be explicitly indicated by the qualifying tag name instead of `fragment`.

By default, the resulting tags will have a `type` attribute derived from the markup syntax for the block — which is a normalized value set to the `markup-syntax` attribute of the rendered `<pre>`.

---

#### Cascading Styles

You define a `<style>` tag using <code>\`\`\`css style</code> block.

```css style
/* This is to know it works as expected */
body > style:first-of-type::before {
	content: 'First <style> tag… works!';
	display: block;
}
body > style:first-of-type {
	display: block;
	height: 1.75em;
	overflow: hidden;
}
```

#### Classic Scripts

You define a `<script>` tag using <code>\`\`\`js script</code> block.

```js script
// This is to trace when it executes
console.trace(document.currentScript);

// This is to know it works as expected
document.currentScript.before(
	Object.assign(document.createElement('p'), {textContent: 'First classic <script> tag… works!'}),
);
```

You can further specify simple attributes of well-defined intent by appending them to the header — like `async` or `defer` for a `<script>` using <code>\`\`\`js script async defer</code>.

#### Modules

And equally unexpected as it is goes for a `<script type=module>` tag, you use a <code>\`\`\`js script=module</code> block, and that's simply because the type of the tag will picked up from the attribute.

```js script=module
// This is to trace when it executes
console.trace(
	// This is to know it works as expected
	document.body.appendChild(
		Object.assign(document.createElement('p'), {
			textContent: 'First <script type=module> tag… works!',
		}),
	),
);
```

---

That's all!

</markout-details>

</markout-playground>

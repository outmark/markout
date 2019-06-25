# Markout Playground

Playgrounds in Markout are as straightforward as it gets, and then more.

## Straightforward

When you create a `<markout-playground>` element, think `<iframe>`, the contents of which will be populated from the fenced code blocks within your narrative. This means that the narrative and its playground will each get their own DOM.

> **Why?** This divide will actually feel a lot more intuitive because your narrative and the thing it narrates will only rarely be the same thing.

<markout-playground>

Everything inside a `<markout-playground>` is considered a single playground.

Since fenced code can often times be just narrative, it makes sense to want to explicitly indicate which fenced code blocks will end up in the playground's DOM.

For instance, an <code>\`\`\`html</code> block is considered narrative, unless you annotate it <code>\`\`\`html fragment</code>.

```html fragment
This is the first html fragment!
```

You can also do that for <code>\`\`\`md fragment</code>.

```md fragment
This is the first `markdown` fragment!
```

It's a little different if you want the block to output inside of a tag, which must also be explicitly indicated by the qualifying tag name instead of `fragment`.

So you would define a `<style>` block using <code>\`\`\`css style</code>.

```css style
body::after {
	content: 'This is the first style tag!';
	display: block;
}
```

Or define a `<script>` block using <code>\`\`\`js script</code>.

```js script
document.write('<div>This is the first script tag!</div>');
```

By default, the resulting tags will have a `type` attribute derived from the markup syntax for the block — which is a normalized value set to the `markup-syntax` attribute of the rendered `<pre>`.

So, if you wanted to define a `<script type=module>` block, simply use <code>\`\`\`js script=module</code>.

```js script=module
document.write('<div>This is the first script tag!</div>');
```

You can further specify simple attributes of well-defined intent by appending them to the header — like `async` or `defer` for a `<script>` using <code>\`\`\`js script async defer</code>.

Support for additional attributes for tags is not yet possible due to the higher potential for ambiguities they pose. One idea being considered is to use prepending. This all has to balance with other considerations, like supporting `template` and other [metadata content](https://html.spec.whatwg.org/multipage/dom.html#metadata-content) tags.

And since explicitness is our motto, don't forget that you always need to actually import `markout-playground.js` for all this to actually work.

```js
<script type=module src="/markout/elements/markout-playground.js"></script>
```

<script type=module src="/markout/elements/markout-playground.js"></script>

---

<center>

### Playground

</center>

</markout-playground>

---

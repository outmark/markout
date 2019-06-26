<markout-playground class=primer>

# The First Markout Playground

Playgrounds in Markout are as straightforward as it gets, and this is a walk-through of the underlying concepts behind Markout's Playgrounds. Here we are throwing everything together in a single playground, mainly to show how it holds up together. <!-- Consider [this walk-through](./Playgrounds.md) for more granular examples. -->

<aside><div max-height:=15em overflow-y:=scroll mask-image:="linear-gradient(black 75%, transparent)">

## The Backstory

For someone like myself who has been developing web things all their life, it is fascinating to see how far it has come along. Yet, with everything moving so fast, details often get lost, and hard lessons earned start fading away amid flashy things of viral appeal.

So I always like to slow things down, go as grassroots as it gets… here you start to see things in as blunt and shocking as it really is. From this view, you keep hacking at problems from all the angles, as baremetal as it gets.

This creates a lot of junk code, which could also be good code, usually is depending on the narrative. So what do you with potentially good code that is not what you are looking for right here? Do you just hit delete?!

In my journey I discovered the practice of weekly logging, ie blogging but without the traditional audience. It's where I pull together all those threads and trimmings to capture in review what I've accomplished and learned.

What was elusive was a more vivid way to actually capture those things. And it took just a little over a year to find the right framing for it — narratives.

This is a narrative that evolved while hacking at the first Playground… enjoy!

</div></aside>

<figure>

## The Playground

When you create a `<markout-playground>` element, think `<iframe>`, the contents of which will be populated from the fenced code blocks within your narrative. This means that the narrative and its playground will each get their own DOM, and this divide will actually feel a lot more intuitive as your narrative and what it captures begin to flow in their own ways.

Everything inside a `<markout-playground>` element is considered a single playground. And normally, the actual playground will be appended in the end of the element.

<output here><aside align=center>

**Oops**! Playground should have render here!

</aside></output>

Alternatively, you can use the `<output here><!--and you can leave some just-in-case markup here--></output>` placeholder as shown here, and your narrative for can give the necessary context, ie to make this point.

</figure>

<figure>

## The Narrative

---

Since fenced code can sometimes be just for narrative, it makes sense to want to explicitly indicate which fenced code blocks will end up in the playground's DOM.

Let's look at the different ways to do that!

---

### HTML Fragments

To turn your <code>\`\`\`html</code> block into actual content, simply change it to <code>\`\`\`html fragment</code>.

<!--prettier-ignore-->
```html fragment
First html content fragment!

<!-- Explicit reset stylesheet (preferred way) -->
<link rel="stylesheet" href="/markout/styles/playground.css" />

<!-- Explicit reset stylesheet (alternative way) -->
<!-- <style>@import '/markout/styles/playground.css';</style> -->

<!-- This is to trace when it works -->
<script>console.trace(document.currentScript);</script>
```

---

> **Note**: For easier viewing, all blocks which will be rendered in the playground are additionally decorated with the fencing from the source text, and alternatively those decorations will show the open and close tags on clicking and holding anywhere inside the blocks margin.

---

Nothing prevents you from throwing scripts and styles right in your fragment, and sometimes it makes sense (as shown above), otherwise, it is far more useful to give those their own fenced code blocks (as will be shown below).

It's a little different for fenced blocks which are meant for a specific tag, which still need to be explicitly indicated in the header but instead of `fragment` the qualifying tag name (like `script` or `style`). However, you can expect the `type` attribute to be derived based on the markup syntax for the block, at least for the usual cases.

---

### Cascading Styles

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

---

### Classic Scripts

You define a `<script>` tag using <code>\`\`\`js script</code> block.

```js script
// This is to trace when it works
console.trace(document.currentScript);

// This is to know it works as expected
document.currentScript.before(
	Object.assign(document.createElement('p'), {textContent: 'First classic <script> tag… works!'}),
);
```

You can further specify simple attributes of well-defined intent by appending them to the header — like `async` or `defer` for a `<script>` using <code>\`\`\`js script async defer</code>.

---

### Modules

And equally unexpected as it is goes for a `<script type=module>` tag, you use a <code>\`\`\`js script=module</code> block, and that's simply because the type of the tag will picked up from the attribute.

```js script=module
// This is to trace when it works
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

Aside from the usual HTML things, sometimes you want to incorporate things that are not quite HTML fragments and yet they are a cohesive fragment that is either intended for rendering via extensions.

One example is the Markout content renderer upon which this all works. Other examples to consider here would be content for browser handlers, and those might be a little trickier to pull off.

---

### Markout Fragments

You can also do the same with a <code>\`\`\`md fragment</code> which will automatically create and bootstrap the `<markout-content>` wrapper for you.

```md fragment
First `<markout-content>`-wrapped fragment!
```

---

### Weird Fragments

If you're just too weird or simply `fragment` weird, that's okay… you will likely get an `object`-wrapped fragment that will be escaped as needed unless you throw `preserve-entities` in the mix.

```text fragment
First <object>-wrapped fragment… weird!
```

</figure>

---

<center>

**That's all!**

</center>

---

</markout-playground>

<script type=module src="/markout/elements/markout-playground.js"></script>

<style>

	markout-playground.primer h1,
	markout-playground.primer h2 {
		text-align: center;
	}

	markout-playground.primer * + h1,
	markout-playground.primer * + h2,
	markout-playground.primer * + h3,
	markout-playground.primer * + h4 {
		margin-block-start: 2rem;
	}

	markout-playground.primer p {
		margin: 0.75em 1.5rem;
	}

	markout-playground.primer iframe,
	markout-playground.primer pre {
			margin: 1.5em 1.0rem;
			max-width: -webkit-fill-available;
			max-width: -moz-available;
			max-width: fill-available;
	}

	markout-playground.primer aside,
	markout-playground.primer figure {
		margin-block-start: 3rem;
		margin-block-end: 3rem;
	}

	markout-playground.primer details[open] {
		padding-block-end:1em;
	}

	markout-playground.primer hr {
		border-width: 1px;
	}

	@media print {
		* {
			overflow-y: initial !important;
			max-height: initial !important;
			-webkit-mask-image: unset !important;
		}
	}

</style>

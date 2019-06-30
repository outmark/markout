<markout-playground class=primer>

# The First Markout Playground

Playgrounds in Markout are as straightforward as it gets, and this is a walk-through of the underlying concepts behind Markout's Playgrounds. Here we are throwing everything together in a single playground, mainly to show how it holds up together. <!-- Consider [this walk-through](./Playgrounds.md) for more granular examples. -->

<center media=print hidden>

_See it in action and read the full story at <u>smotaal.io/markout/examples/Playground</u>._

</center>
<div media=screen style:=fence border-radius:=0.25ex padding-block-start:=0><div max-height:=10em overflow-y:=scroll mask-image:="linear-gradient(black 75%, transparent)" padding:="0 1rem 2rem 1rem">

## The Backstory

For someone like myself who has been developing web things all their life, it is fascinating to see how far it has come along. Yet, with everything moving so fast, details often get lost, and hard lessons earned start fading away amid flashy things of viral appeal.

So I always like to slow things down, go grassroots, and here you start to see things in as blunt and shocking as it really is. From this viewpoint, you keep hacking at the fundamentals of the problem(s) from all the different angles, but you keep it all baremetal as it can be — where packages from out there only rarely come in the form of tooling and nothing more.

This creates a lot of junk code, but which could also be good code, and usually is, depending on how you slice that narrative. But assuming it is, now what do you with all this potentially good code just not being in the right place? Do you just hit delete?!

Some people always like to say that _writing code_ is easy. It is not if you're the one doing it, or if all you write is easy code, as in not good code, or just really bad, which ever falls nicer on the ears when we do it… but, writing code without a good frame is certainly bad, only you don't just know it yet…

And I was unwittingly on a quest to figure this all out for myself. Along this quest I discovered the practice of weekly logging, ie blogging but without the traditional audience. It's where I pull together all those threads and trimmings to capture in review what I've accomplished and learned and frame things moving forward.

What was elusive was a more vivid way to actually capture those things, not that it was not always intended to make this about playgrounds. But, it took just a little over a year to find the right framing for it — narratives.

So, let's dig into it, the first narrative that evolved while hacking at the first Playground… enjoy!

</small></div></div>

<section>

## The Playground

When you create a `<markout-playground>` element, think `<iframe>`, the contents of which will be populated from the fenced code blocks within your narrative. This means that the narrative and its playground will each get their own DOM, and this divide will actually feel a lot more intuitive as your narrative and what it captures begin to flow in their own ways.

Everything inside a `<markout-playground>` element is considered a single playground, with its own narrative consisting of all the content enclosed between the opening `<markout-playground>` and closing `</markout-playground>` tags.

Normally, the actual playground will be appended in the end of the element. Alternatively, you can use the `<output here></output>` placeholder as shown immediately below, to better frame it within the context of your narrative.

<output here><aside align=center>

**Oops**! Playground should have render here!

</aside></output>
<blockquote><details><summary><b>Tip</b>: If you are not familiar with HTML inline frames…</summary>

When you author HTML documents, sometimes you want to embed other documents, like ads... etc. The way you do this is by including an `<iframe src="‹some url›"></iframe>` fragment which tells the browser to create a nested container within the current page and use to show another — usually by loading it from `‹some url›`.

Playgrounds uses this approach, but instead of loading a document from `‹some url›`, it will derive the document from content in your narrative — ie what you see above is generated from content that is narrated further down.

</details></blockquote>

Let's look at the narrative behind this rendered playground below.

</section>

<section>

<!--prettier-ignore-start-->
## The Narrative
### 1.  Fragments
<!--prettier-ignore-end-->

---

Since fenced code can sometimes be just for narrative, it makes sense to want to explicitly indicate which fenced code blocks will end up in the playground's DOM.

Let's look at the different ways to do that!

---

### HTML Fragments

Let's start with an example of narrative-only fragment — those are fragments that you want to be talking about only and so you still want them to format nicely in your narrative without them ending up inside the actual playground.

<!--prettier-ignore-->
```html
<html> is awesome but that's besides the point!
```

<blockquote>

<details><summary><b>Tip</b>: If you are not familiar with fenced code blocks…</summary>

Fencing is a notation used to indicate to parsers when a fragment of text is of a different syntax than its surrounding.

Historically was complicated but Markdown's clean and simplistic notation revolutionized that problem space.

<!--prettier-ignore-start-->
```md
  In Markdown you can:

    1. Fence \`code\` inline.
	  2. Or in blocks where you can also indicate its syntax:

       ```syntax
       code
       ```
```
<!--prettier-ignore-end-->

</details>

</blockquote>

You don't want the above fragment to be in the playground, and besides of it being to make a point, this fragment which is actually malformed `html` syntax would likely break everything else you actually wanted in your playground.

With this in mind, it is reasonable to say that if fragments needed to be differentiated, it is safer to rely on very explicit indicators to distinguish a playground fragment from narrative or otherwise ones.

So in order to indicate a playground fragment, you would change the opening fence <code>\`\`\`html</code> block into actual content, we <code>\`\`\`html fragment</code>.

<!--prettier-ignore-->
```html fragment
First html content fragment!

<!-- This is to trace when it works -->
<script>
	console.trace(document.currentScript);
</script>
```

> **Note**: For easier viewing, all blocks which will be rendered in the playground are additionally decorated with the fencing from the source text, and alternatively those decorations will show the open and close tags on clicking and holding anywhere inside the margins of the block.

As you can see, nothing prevents you from throwing scripts, styles... etc. right into your fragment when it makes sense.

So the `<script>` element that's included in the above fragment which outputs to the console a stack trace is meant to let us know that everything worked as exected, ie the fragment did in fact end up in the playground — and practically speaking, how else would you want to go about knowing that it did, right!

<!--prettier-ignore-->
```html fragment
<!-- Markout's minimal reset styles and root variables -->
<link rel="stylesheet" href="/markout/styles/root.css" />

<!-- Additional reset styles not assumed by Markout  -->
<style>
	body {
		overflow-x: hidden;
		background-color: transparent;
		line-height: 175%;
		-webkit-text-size-adjust: 100%;
		text-align: center;
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
	}

	body > * {
		padding: 0;
		margin: 0;
	}
</style>
```

In this second fragment, we also include things inline as functional necessities or boilerplate secondary to the narrative.

But, you don't want all your markup to be in `html` fragments, this makes it a lot more difficult for tooling to lend you a good development experience — which is just foresight based on reasonable experience with today's related tools.

You also don't want to lock yourself into just `html` so that this would all translate to other platforms as we move forward.

So let's see how other fenced blocks can be used to make a good narrative.

</section>

<section>

<!--prettier-ignore-start-->
## The Narrative
### 2.  Tags
<!--prettier-ignore-end-->

---

It's a little different for fenced blocks which are meant for a specific tag, which still need to be explicitly indicated in the header but instead of `fragment` we will simply just append a qualifying tag name (like `script` or `style` for starters).

Naturally, we now start thinking of how to go about specifying attributes for those tags, but we'll need to work on this with careful consideration.

Now the interesting thing about Markout is that it already assumes that the header of the fence block which starts right after the opening <code>\`\`\`</code> mark defines the `markup-syntax` attribute from the word that immediately follows and considers everything after a separating whitespace to be additional and well-formed attributes.

Still, just because you have attributes on an otherwise inert `<pre>` rendering inside a `<markout-content>` does not mean that you want those attributes to end up on the `<script>` or `<style>` tags of your playground.

So for starters, the right amount of mojo will be needed here at least to properly handle critical attributes for such tags, ie infering `type` for common use cases.

---

### Styles

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

### Scripts

You define a `<script>` tag using <code>\`\`\`js script</code> block.

```js script
// This is to trace when it works
console.trace(document.currentScript);

// This is to know it works as expected
document.currentScript.before(
	Object.assign(document.createElement('p'), {textContent: 'First 𝘤𝘭𝘢𝘴𝘴𝘪𝘤 <script> tag… works!'}),
);
```

> **Note**: You can specify simple attributes of well-defined intent by appending them to the header — like `async` or `defer` for a `<script>` using <code>\`\`\`js script async defer</code>… details below.

---

<div style:=fence border-radius:=0.25ex padding-block-start:=0><div max-height:=10em overflow-y:=scroll mask-image:="linear-gradient(black 75%, transparent)" padding:="0 1rem 2rem 1rem"><span>

**How about more serious attributes… say `type`?!** It's just too early to lock up the design space around attributes, and so expect those to be very intentionally awkward hacks for now.

But as we move into places where such attributes become necessary, we will need ways to achieve the intended outcomes. And we need to do that without closing the door for more intuitive ways to be explored later on. And so to play it safe, we will mostly opt for things with very minimalistic and hard-coded logic, smelly enough, easy to find, and more importantly, not cause unintentionally side-effects today or in the future where we didn't expect.

Sounds reasonable enough, at least for now… right? Maybe it help's to reflect on this more concretely…

If we consider the possible implications of appending `async` or `defer` directly into the opening fence of a <code>\`\`\`js script async defer</code> block, specifically once they are rendered by Markout or another engine with similar semantics, this code will likely result in a `<pre async defer markup-syntax="js">`, and they will not go any further without a parent `<markout-playground>` or similar giving those useless attributes additional meaning.

However, to be fair, `markup-syntax` which is what Markout chooses to reflect the syntax of the fenced code is just one opinion on how to retain that detail. Another one could just as well be `type` with a seemingly good assumption that the name is spec-conforming and that it historically bares no significance to the semantics of a `pre` tag in an `html` document. And so the risks are not equal across all attributes, and it is too early to make those kinds of commitments design-wise.

So we will punt on having to deal with such complexities until there is better clarity, and specifically for `type` we'll simply repurpose our intentionally non-conforming `script` or `style` attributes to override the default inferred `type` of the resulting playground tags.

Good to keep that in mind before the next bit!

</span></div></div>

---

### Modules

With modules, we hit the scenario pointed out above, which in `html` looks something like:

<!--prettier-ignore-->
```html
<script type=module>
	// NOTE: module code works here BUT throws elsewhere… for example:
	import something from 'somewhere';
</script>
```

Fun fact to consider here is that while `<script type=text/javascript>` **unambiguously means** it is _classic_ script and **not** _module_ code, in reality, and aside of how bizarre you may find it, all javascript code irrespective of flavor (ie parsing goal) is of the same content/mime type `text/javascript`.

And so at lease for now and just to pair nicely with those smelly and somewhat distasteful specifications, we will use <code>\`\`\`js script=module</code> for module blocks, thusly and intuitively (not), coercing onto them in the playground the `type=module` attribute they would require.

```js script=module
// This is to trace when it works
console.trace(
	// This is to know it works as expected
	document.body.querySelector('script[type=module],:last-child').after(
		Object.assign(document.createElement('p'), {
			textContent: 'First 𝘮𝘰𝘥𝘶𝘭𝘦 <script> tag… works!',
		}),
	),
);
```

---

> **Note**: This is all just work-in-progress intended to evolve while keeping with to standards, all of which is subject to change (let's hope).

</section>

<section>

<!--prettier-ignore-start-->
## The Narrative
### 3. Content
<!--prettier-ignore-end-->

---

Aside from the usual HTML things, sometimes you want to incorporate things that are not quite HTML fragments and yet they are a cohesive fragment that is handled by special extensions.

> **Note**: We'll call those content for stipulation — as in fragments, tags, and tags of fragments which we call content.

One example is the Markout content renderer upon which this all works. Other examples to consider here would be content for browser handlers, and those might be a little trickier to pull off.

---

### Markout Content

To turn your <code>\`\`\`md</code> block into actual content, simply change it to <code>\`\`\`md fragment</code>, and the way this works is that it will wrap the fragment inside a `<markout-content>` element.

```md fragment
First `<markout-content>`-wrapped fragment!
```

This is still considered a fragment because what lies within it is content and not metadata that might be content.

---

### Weird Content

If you're just too weird or simply `fragment` weirdly, that's more than okay… you will likely get an `object`-wrapped fragment that will be escaped as needed unless you throw `preserve-entities` in the mix.

```text fragment
First <object>-wrapped fragment… weird!
```

Should this all work out for you, be sure to share your own narrative!

</section>

---

<center>

**That's all… for now!**

</center>

---

</markout-playground>

<script type=module src="/markout/elements/markout-playground.js"></script>

<style src="/markout/styles/playground.primer.css"></style>

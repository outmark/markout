# My Markout Story

As some point during the summer of 2018, while trying to come up with an idea for my project for the HackerYou's Full-Stack course, I was really getting pissed at how my gists feel too dull compared to my browser's console and how that feels to elusive compared to my gists — I was left wondering, why the hell don't the two just make the effort!

This goes to the root problem I was really looking to solve for myself and certainly others (in due time) and that was to find a good to document my experimental development with just the right balance of playground and markdown-like features.

While this is not very different from what you see in many notebook platforms, it's all client-side with nothing but a static server. And as someone later on pointed me to [Literate CoffeeScript](https://coffeescript.org/#literate), which I must admit was hitting many of the right checkboxes from a compositional standpoint, my goal was to remain baremetal, as in HTML, CSS, and JavaScript (frameworkless) and so the CoffeeScript aspect here was a little out of place for the task.

To date, technically, my project remains outsanding and I never really finished the course. And while all that's true, if you set out to solve a problem, you have to be more than just willing to pivot away from ideas. This is equally true for ones that you feel attached to for any reason, which can be hard, but critical to the problem-solving process.

But this realization that my initial idea was not the right one only become evident after exploring the existing solutions in more depth in order to figure why they failed in meeting my specific expectations. So let's start with some of those highlights which may be of use to folks designing in those spaces, and see where things went from there.

**_Console Snippets_**

Snippets, avoided by most, and that's because they are nothing more than a glorified console `eval` that gets saved somewhere that is intuitive to maybe the people who designed it but hardly anyone else… what now folks?!

This had so much potential once, but aside from those few who use it because it made sense, imho it is deadweight we all carry as endusers and it being there makes me wonder if developers are not keeping their priorities straight here!

**_Playgrounds_**

Let's skip to when you save your pen/bin to a gist… If you `html`, `css` and `js` does not work exactly as it did without the playground doing its magic, you are really better off without it.

This is increasingly true today because all those playgrounds work from the assumption that bundlers and transforms are how the web works… but there is a difference between what people prefer and what is fact, and a good fact is that your preferences are not fact, they are opinions. And since playgrounds are afterall meant for learning (et al), forcing opinions here is at the very least bad form.

But the bigger issue I am having with all this is because while you are using all this mojo shit to cater to a browser that no longer exists, I am no longer able to write code that is actually supported by the browser in your playground, and yet writing the same code in the console works — And that is what I would actually call the bleeding edge, where you are putting all this work only to go retro, and a year later, with a paid subscripton, you are still working on the issue.

How does one ever come up with ideas, if all everyone is really offering in lieu of sandbox is more like quicksand?

**_It eventually hit me…_**

This is when I realized, sure, I can do a little better in terms of a playground, but won't I really be hurting more than helping if I just end up creating new gaps along the way?!

So instead, I decided to go back to basics, start from scratch, and a repo on GitHub was the way to go, that is experimental repos, and to focus instead on a GitHub pages engine that can deliver on the things I really needed along the way.

This is a road less travelled, and is full of many learning opportunities, and so it goes.

## _So, by design…_

From the start, I wanted Markout to become its own thing which borrows some cleaner aspects from Markdown but is different on many levels from any Markdown implementation. It is not just another flavour or self-claimed spec of Markdown, it was ridiculous to think of it in such a narrow view.

I am still prototyping away on the engine (highlights below), and aside from links, ATX headings, lists, fenced code/blocks, and inline font styling aspects, everything uses HTML (for now at least).

### _It translates to HTML_

I found that one common demoninator in popular many markdown places, like GitHub, discouse... etc. is that they really puke when you introduce HTML things.

This felt very counter-intuitive when you are ultimately always rendering HTML, which is almost true today for all Markdown, only they carry the legacy burdens of times where pipelines and backends were necessary and would lead to safety and semantics concerns that are no longer relevant in my view.

And so, Markout just got a little more interesting, because it technically does not have pipelines, just a simple `markout => <document-fragment›` and that technically puts almost all HTML things back on the table (but not quite).

To get there, I needed to really get intimate with all things [markup](/markup/Story.md) and be comfortable enough generating and parsing `html`, `css`, `es` and `md` all in the main thread and fast enough that it would work on somewhat decent phones.

### _It uses the DOM_

Since Markout is not HTML, you don't want to ever have to operate on a so called Markout DOM and decided to do away with this notion completely.

The only DOM you ever work on is the `document-fragment` of generated content, which is inert and ready to be bootstrapped and inserted directly into your `document`.

With this kind of framing, it is straightforward to reason about relative links of any kind being relative to the absolute location of the markout file itself (which is still `.md` all the same).

### _It only has Do's_

If it works for you, go with it. If you push it, either the browser will let you know, you will know when it doesn't show up, we will find a way to close the gap to make it more intuitive.

The only "don't" here is introducing things that will break syntax or semantics of the rendered HTML or make the source file painful to author or read directly.

So while I found that `<script>…</script>` and `<style>…</style>` tags come what I refer to as an immediacy gap, ie their semantics in the rendered HTML are not directly relatable to exactly one intent in the source text, I decided to simply discourage myself from relying on them for now until a clean path becomes more clear.

Instead, with `<script src=…>` or a `<style src=…>`, you add automatically add some distance cognitively, because you end up writing those in separate file. This was very different from my initial project's goal, but that's a more tenable starting point anyhow.

### _It scripts nicely when…_

Since you might want your code to operate directly on the document, which is kind of the point of all of this. I found that in special cases where you use an encapsulating parent tag (specifically for not `<output><script src=…>`), you can close this immediacy gap by relating the script to a specific parent.

The same would apply to `<script type=module>` because as far as the specs are concerned, those tags have no relationship to the immediate parent element. So they are simply like doing an `import(…)` in the global scope, and this is exactly how it is handled by the renderer now except I did not yet work out some of the details to make this work for inline code.

### _It styles and inline-styles too…_

Having `<style src>` is nice in a sense that any document can decide to have its own personality, it was not really suited for small inline styles, which are a non-concept for Markdown, ie only HTML.

So, at least for now, inline styling is for HTML tags, but since those tags are not actual HTML elements until they are rendered, it made sense to find a more elegant way to minimize on the noise of having `<… style="">` getting in the way of your source text.

My goal was to make life a little easier with valid HTML things that could go a long way with as little magic as possible. Ultimately, what was annoying me about the proforma styling is that it has quotes to wrap a completely different syntax, and that gets in the way of both legibility and linting of the original `.md` files.

Instead, I came up with a subtle notation to inline styles directly along with your HTML attributes because for all I care, this content-layout-style division goes out of the window when you are inline-styling, and more so if you are not writing actual HTML in an actual HTML document!

So instead of `<… style="font-size:smaller" …>` in HTML documents, you simply go with `<… font-size:=smaller …>` in Markout and that `:=` actually has [a lot of thought behind it][markout-styles] that makes it absolutely valid syntax-wise in HTML so that it parses as expected in any browser.

Just keep in mind that styling in HTML attributes carries with it all the implied syntax expectations, and that makes it less intuitive for edge cases like `content:="'nonyaefenbiz is why!'"` which is one edge I personally don't fancy, but if that's your `biz`, I say `biz`-away…

[markout-styles]: https://smotaal.io/#/meta/logs/2019/2019-05/2019-05-24-Weekly.md#markout-styles

## _Now What?!_

I started working on this because I was struggling to stay on track with my development efforts, a lot of which is experimental, which is my calling. What I ended up with is my own GitHub pages engine, built from scratch, literally. In fact, unless you are reading this directly from my GitHub repo or on some other website, what you are seeing is Markout.

Now I rely on Markout for all my work, and I am involved in a lot of research venues, like the Secure ECMAScript (SES) Strategy group and the Node.js Modules group.

And while I don't see myself finishing the project from which this all started, I am now on track on previous projects that were on the slow path for the past few years.

Markout is meant to be open-source, so if you want to help see it evolve, I'd love to see where we can take it.

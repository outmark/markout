<markout-details style:=fence><summary color:=transparent>

<!-- `markout-details` renders like `div` in markdown and as actual `details` in markout -->

<center width:=100% color:="var(--markout--band-text, initial)">

<!-- any CSS property can be inlined using the `:=` notation without a leading space -->

<img display:=block min-width=25em max-height:=25vh title="smotaal.io/markout" src="./assets/markout-icon.svg"/>

<!-- sometimes elements can have special styling facilities like `<img/>` with `width` and `height` -->

HTML-flavoured Markdown-inspired client-side renderer

<kbd>`Markdown` Previewed</kbd> <kbd>`Markout` Unleashed</kbd>

<!-- Markout is a lot more fogriving about mysterious rules like needing linebreaks when you open tags — if you are targeting markdown renderers you should adhere to them  -->

<small hidden display:=inline-block opacity:=0.5>Read More</small>

<!-- This is a hack to make sure that is only visible in markout -->

</center>

</summary>

<center><div max-width:=40em text-align:=left margin:=1em>

Markout borrows a lot of nice features from Markdown, but uses a completely different rendering architecture that makes it easy to also leverage builtin features of the actual HTML renderer.

While the engine caters primarily to the richer features of the DOM, it does so with clear intent to make it work in a shell-based environment longer-term.

Current experimental efforts divide the rendering into two phases, the first portion uses a custom tokenizer that captures HTML and other notation, yielding the static content (HTML for now) output, the second portion uses a custom element and real-time DOM operations to yield the dynamic content (HTML for now) tailored to every aspect of the user experience.

</div></center>

</markout-details>

<small><blockquote float:=right><details><summary>Compatibility Notes</summary>

- [x] <details><summary>Headings</summary>

  - [x] HTML Headings
  - [x] ATX Headings
  - [ ] Ruled Headings <kbd>Excluded</kbd>

- [x] <details><summary>Fenced Blocks</summary>

  - [x] _Syntaxes_

        > one of `md`/`markdown`, `html`, `css`, `json`, `js`/`javascript`, `es`/`ecmascript`
        >
        > defaults to `markup`

  - [x] Markdown _Triple-Grave-Block_ Notation

        > **Note**: Additionally allows annotations after close fence — not recommended for cross-compatibility.

  - [ ] Markdown _Triple-Tilde-Block_ <kbd>Excluded</kbd>
  - [ ] Markdown _Indented-Block_ <kbd>Excluded</kbd>

- [ ] <details><summary>Block Quotes</summary>

  - [x] HTML Block/Inline Quotes
  - [-] Markdown Block Quote Notation

        > **Note**: Not yet fully implemented in some places, not limited to lists.

- [ ] <details><summary>Tables</summary>

  - [x] HTML Tables
  - [ ] Markdown Tables <kbd>Excluded</kbd>

<small><footer>

---

<kbd>Excluded</kbd> notation is not planned to be supported by the engine directly, but indirect support can potentially be introduced in pre/post transformations.

</footer></small>

</details></blockquote></small>

## Features

<markout-details open><summary type=checkbox>

### Styles

</summary>

<!-- prettier-ignore-start -->
<div>

- [x] <figcaption>Markout Attribute Styles</figcaption> <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=html margin:=0 padding:=0>`<span color:=red>one</span>`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><span color:=red>one</span></figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><span style="color:red">one</span></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=html margin:=0 padding:=0>`… <span style:=fence>one</span> …`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>…<span style:=fence>one</span>…</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>…<span style="border:var(--fence--border--); background:var(--fence--background--); color:var(--fence--color--); font:var(--fence--font--);">one</span>…</pre>
        </figure>

- [x] <figcaption>Markdown-Style Italics</figcaption> <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one _two_ three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one _two_ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <i>two</i> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one_two_three_`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>_one_two_three_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one_two_three</i></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one__two__three_`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>_one__two__three_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one__two__three</i></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one *two* three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one *two* three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <i>two</i> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one*two*three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one*two*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<i>two</i>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`*one*_two_*three*`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>*one*_two_*three*</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one</i><i>two</i><i>three</i></pre>
        </figure>


- [x] <figcaption>Markdown-Style Bold</figcaption> <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one **two** three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one **two** three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b>two</b> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one**two**three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one**two**three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<b>two</b>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`**one****two****three**`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>**one****two****three**</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one</b><b>two</b><b>three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one __two__ three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one __two__ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b>two</b> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one__two__three_`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__one__two__three__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one&#x5F;&#x5F;two&#x5F;&#x5F;three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`__one____two____three__`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__one____two____three__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one&#x5F;&#x5F;&#x5F;&#x5F;two&#x5F;&#x5F;&#x5F;&#x5F;three</b></pre>
        </figure>

- [x] <figcaption>Markdown-Style Bold + Italics</figcaption> <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one **_two_ three**`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one **_two_ three**</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b><i>two</i> three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`__*one*two*three*__`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__*one*two*three*__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b><i>one</i>two<i>three</i></b></pre>
        </figure>

- [x] <figcaption>Markdown-Style Strikethrough</figcaption> <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one ~~two~~ three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one ~~two~~ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <s>two</s> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one~~two~~three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one~~two~~three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<s>two</s>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`~~one~~two~~three~~`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>~~one~~two~~three~~</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><s>one</s>two<s>three</s></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`~~one~~~~two~~~~three~~`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>~~one~~~~two~~~~three~~</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><s>one</s><s>two</s><s>three</s></pre>
        </figure>


- [x] <figcaption>Markdown-Style Escapes  (ie not styled)</figcaption><figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\*two\*three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\*two\*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;two&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`\_one_two_three\_`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>\_one_two_three\_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>&#x5F;one&#x5F;two&#x5F;three&#x5F;</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\**two\**three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\**two\**three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;&#x2A;two&#x2A;&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\*\*two\*\*three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\*\*two\*\*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;&#x2A;two&#x2A;&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\~~two\~~three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\~~two\~~three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x7E;&#x7E;two&#x7E;&#x7E;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\~\~two\~\~three`</pre>
        <figure debug=all title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\~\~two\~\~three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x7E;&#x7E;two&#x7E;&#x7E;three</pre>
        </figure>
</div>
<!-- prettier-ignore-end -->

</markout-details>

<markout-details open><summary type=checkbox>

### Links

</summary>

- [x] Markdown-Style References

<div column-grid font-size:=75%>

```md
[unreferenced]: ./README.md
[referenced]: ./README.md
```

<figure debug=all>

> **Note**: renders as hidden anchors

[unreferenced]: ./README.md
[referenced]: ./README.md
</figure>

</div>

- [x] Markdown-Style Links

<div column-grid font-size:=75%>

```md
- [Link](./README.md)
- [Referenced Link][referenced]
- [Not Referenced Link]
- [Not Referenced Link][not-referenced]
```

<figure debug=all>

- [Link](./README.md)
- [Referenced Link][referenced]
- [Not Referenced Link]
- [Not Referenced Link][not-referenced]

</figure>

</div>
</markout-details>

<markout-details open><summary type=checkbox>

### Lists

</summary>

> **Note**: Markdown handles this differently


- [x] <figcaption>Markout's Unordered Lists</figcaption> <figure columns:=20em>

  - [x] Square <figure debug=ul font-size:=90%>

    - Square
      - Square
      * Disc

  - [x] Disc <figure debug=ul font-size:=90%>

    * Disc
      - Square
      * Disc

- [x] <figcaption>Markout's Ordered Lists</figcaption> <figure columns:=20em>

  - [x] Latin Numbering <figure debug=ol font-size:=90%>

    a) `    a) Latin     (auto)   `
      iv. `  iv. Roman  (coerced)`
      11. `  11. Arabic (coerced)`
      g.  `  g.  Latin  (coerced)`
      a.  `  h.  Latin  (auto)   `

  - [x] Arabic Numbering <figure debug=ol font-size:=90%>

    1) `  1) Arabic    (auto)   `
      g.  `g.  Latin  (coerced)`
      iv. `iv. Roman  (coerced)`
      11. `11. Arabic (coerced)`
      1.  `1.  Arabic (auto)   `

  - [x] Roman Numbering <figure debug=ol font-size:=90%>

    i. `  i. Roman     (auto)   `
      11. `11. Arabic (coerced)`
      g.  ` g. Latin  (coerced)`
      iv. `iv. Roman  (coerced)`
      i.  ` i. Roman  (auto)   `

- [x] <figcaption>Markout's Checklists</figcaption> <figure columns:=20em>

  - [x] Force-Checked <figure debug=ul font-size:=90%>

    - [x] `- [x] Checked           `
      - [x] `- [x] Checked       `
      - [-] `- [-] Indeterminate `
      - [ ] `- [ ] Unchecked     `

  - [x] Force-Indeterminated <figure debug=ul font-size:=90%>

    - [-] `- [-] Indeterminate     `
      - [x] `- [x] Checked       `
      - [-] `- [-] Indeterminate `
      - [ ] `- [ ] Unchecked     `

  - [x] Auto-Unchecked <figure debug=ul font-size:=90%>

    - [ ] `- [ ] Unchecked        `
      - [x] `- [x] Checked      `
      - [-] `- [-] Indeterminate`
      - [ ] `- [ ] Unchecked    `

</markout-details>

<!-- prettier-ignore-start -->

<markout-details open><summary type=checkbox>

### Heading Groups

</summary>

- [x] Heading groups are created from well-chained heading blocks

<div column-grid font-size:=75%>

```md
# Heading 1
## Subheading
---
## Heading 2
### Subheading
#### Subsubheading
---
# Heading 1
### Heading 3
---
# Heading 1

## Heading 2
```

<figure debug=all><div font-size:=75%>

# Heading 1
## Subheading
---
## Heading 2
### Subheading
#### Subsubheading
---
# Heading 1
### Heading 3
---
# Heading 1

## Heading 2
</div></figure>
</div>
</markout-details>

<!-- prettier-ignore-end -->

<!-- prettier-ignore-start -->

<markout-details open><summary type=checkbox>

### Headings

</summary>

- [x] ATX headings

<div column-grid font-size:=75%>

```md
# Heading 1
---
## Heading 2
---
### Heading 3
---
#### Heading 4
---
##### Heading 5
---
###### Heading 6
---
####### No Heading 7
```

<figure debug=all><div font-size:=75%>

# Heading 1
---
## Heading 2
---
### Heading 3
---
#### Heading 4
---
##### Heading 5
---
###### Heading 6
---
####### No Heading 7

</div></figure>
</div>

- [x] HTML headings

<div column-grid font-size:=75%>

```md
<h1>Heading 1</h1>
---
<h2>Heading 2</h2>
---
<h3>Heading 3</h3>
---
<h4>Heading 4</h4>
---
<h5>Heading 5</h5>
---
<h6>Heading 6</h6>
---
<h7>No Heading 7</h7>
```

<figure debug=all><div font-size:=75%>

<h1>Heading 1</h1>
---
<h2>Heading 2</h2>
---
<h3>Heading 3</h3>
---
<h4>Heading 4</h4>
---
<h5>Heading 5</h5>
---
<h6>Heading 6</h6>
---
<h7>No Heading 7</h7>

</div></figure>
</div>

</markout-details>

<!-- prettier-ignore-end -->

<style src=./styles/markout.debug.css></style>

<script>
  console.log('a');
</script>

<style>
  /* * { color: blue; } */
</style>

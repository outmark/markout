<markout-details style:=fence><summary color:=transparent>

<!-- `markout-details` renders like `div` in markdown and as actual `details` in markout -->

<center color:="var(--markout--band-text, initial)">

<!-- any CSS property can be inlined using the `:=` notation without a leading space -->

<img width=50% min-width:=75% max-width:=50em title="smotaal.io/markout" src="./assets/markout-banner.png"/>

<!-- sometimes elements can have special styling facilities like `<img/>` with `width` and `height` -->

HTML-flavoured markup-inspired client-side renderer

<kbd>`Markdown` Previewed</kbd> <kbd>`Markout` Unleashed</kbd>

<!-- Markout is a lot more fogriving about mysterious rules like needing linebreaks when you open tags — if you are targeting markdown renderers you should adhere to them  -->

<small hidden display:=inline-block opacity:=0.5>Read More</small>

<!-- This is a hack to make sure that is only visible in markout -->

</center>

</summary>

<center><div width:=40em text-align:=left>

Markout borrows a lot of nice features from Markdown, but uses a completely different rendering architecture that makes it easy to also leverage builtin features of the actual HTML renderer.

While the engine caters primarily to the richer features of the DOM, it does so with clear intent to make it work in a shell-based environment longer-term.

Current experimental efforts divide the rendering into two phases, the first portion uses a custom tokenizer that captures HTML and other notation, yielding the static content (HTML for now) output, the second portion uses a custom element and real-time DOM operations to yield the dynamic content (HTML for now) tailored to every aspect of the user experience.

</div></center>

</markout-details>

## Features

<markout-details open><summary type=checkbox>

### Styles

</summary>

<!-- prettier-ignore-start -->
<div>

- [x] Markout Attribute Styles <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=html margin:=0 padding:=0>`<span color:=red>one</span>`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><span color:=red>one</span></figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><span style="color:red">one</span></pre>
        </figure>

- [x] Markdown-Style Italics <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one _two_ three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one _two_ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <i>two</i> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one_two_three_`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>_one_two_three_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one_two_three</i></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one__two__three_`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>_one__two__three_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one__two__three</i></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one *two* three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one *two* three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <i>two</i> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one*two*three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one*two*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<i>two</i>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`*one*_two_*three*`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>*one*_two_*three*</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><i>one</i><i>two</i><i>three</i></pre>
        </figure>


- [x] Markdown-Style Bold <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one **two** three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one **two** three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b>two</b> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one**two**three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one**two**three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<b>two</b>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`**one****two****three**`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>**one****two****three**</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one</b><b>two</b><b>three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one __two__ three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one __two__ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b>two</b> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`_one__two__three_`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__one__two__three__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one&#x5F;&#x5F;two&#x5F;&#x5F;three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`__one____two____three__`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__one____two____three__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b>one&#x5F;&#x5F;&#x5F;&#x5F;two&#x5F;&#x5F;&#x5F;&#x5F;three</b></pre>
        </figure>

- [x] Markdown-Style Bold + Italics <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one **_two_ three**`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one **_two_ three**</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <b><i>two</i> three</b></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`__*one*two*three*__`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>__*one*two*three*__</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><b><i>one</i>two<i>three</i></b></pre>
        </figure>

- [x] Markdown-Style Strikethrough <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one ~~two~~ three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one ~~two~~ three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one <s>two</s> three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one~~two~~three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one~~two~~three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one<s>two</s>three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`~~one~~two~~three~~`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>~~one~~two~~three~~</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><s>one</s>two<s>three</s></pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`~~one~~~~two~~~~three~~`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>~~one~~~~two~~~~three~~</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column><s>one</s><s>two</s><s>three</s></pre>
        </figure>


- [x] Markdown-Style Escapes (ie not styled) <figure columns:=20em font-size:=90%>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\*two\*three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\*two\*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;two&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`\_one_two_three\_`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>\_one_two_three\_</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>&#x5F;one&#x5F;two&#x5F;three&#x5F;</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\**two\**three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\**two\**three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;&#x2A;two&#x2A;&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\*\*two\*\*three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\*\*two\*\*three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x2A;&#x2A;two&#x2A;&#x2A;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\~~two\~~three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\~~two\~~three</figure>
        <pre title=expected text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one&#x7E;&#x7E;two&#x7E;&#x7E;three</pre>
        </figure>

  - [x] <figure display:=grid align-items:=center>
        <pre title=source text-align:=center source-type=markdown margin:=0 padding:=0>`one\~\~two\~\~three`</pre>
        <figure title=rendered text-align:=center margin:=0 padding:=0 display:=grid grid-auto-flow:=column>one\~\~two\~\~three</figure>
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

<figure>

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

<figure>

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


<div column-grid font-size:=75%>

```md
2. abc

a. 123

3. efg
```

<figure>

2. abc

a. 123

3. efg

</figure>
</div>

- [x] Hybrid Lists <aside columns:=20em>

  - Unordered
    - Nested

  1. Ordered

    a. Typed
    3. Forced

  - [x] Checked
  - [-] Indeterminate
  - [ ] Unchecked

- [ ] Dynamic Checklists <aside columns:=20em>
  - [ ] Auto-fill by Recursion
    - [x] Partial when unchecked
    - [ ] Unchecked when all unchecked
    - [ ] Checked when all checked
  - [ ] Auto-append by Recursion
    - [ ] After `::marker` of `<details><summary>`

</markout-details>

<markout-details open><summary type=checkbox>

### Heading Groups

</summary>

- [x] Heading groups are created from well-chained heading blocks

<!-- prettier-ignore-start -->
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

<figure><div font-size:=75%>

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
<!-- prettier-ignore-end -->
</markout-details>

<markout-details open><summary type=checkbox>

### Headings

</summary>

- [x] ATX headings

<!-- prettier-ignore-start -->
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

<figure><div font-size:=75%>

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

<!-- prettier-ignore-end -->

- [x] HTML headings

<!-- prettier-ignore-start -->
<div column-grid font-size:=75%>

<!-- prettier-ignore-start -->
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
<!-- prettier-ignore-end -->

<figure><div font-size:=75%>
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
<!-- prettier-ignore-end -->

</markout-details>

<markout-details hidden><summary type=checkbox>

### Titles

</summary>

- [ ] Title are implicitly defined from leading heading(s)

<div>

```md
# Hello World <!-- Title --->
```

</div>

- [ ] Title are explicitly defined from first `<title>` tag

```md
# Hello World

<title>Hello World!</title> <!-- Title --->
<title>Hello World!!</title>
```

</markout-details>

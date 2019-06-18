<title>smotaal.io/markout</title>

<pre align=center text-align:=center white-space:=pre-wrap>

<img width=50% min-width:=75% max-width:=50em title="smotaal.io/markout" src="./assets/markout-banner.png"/>

HTML-flavoured markdown-inspired client-side renderer

</pre>

## Features

Markout borrows a lot of nice features from Markdown, but uses a completely different rendering architecture that makes it easy to also leverage builtin features of the actual HTML renderer.

<blockquote align=center border:=none><details><summary>

**Rendering**

</summary>

While the engine caters primarily to the richer features of the DOM, it does so with clear intent to make it work in a shell-based environment longer-term.

Current experimental efforts divide the rendering into two phases, the first portion uses a custom tokenizer that captures HTML and other notation, yielding the static content (HTML for now) output, the second portion uses a custom element and real-time DOM operations to yield the dynamic content (HTML for now) tailored to every aspect of the user experience.

</details></blockquote>

<details open><summary><h3>

- [-] Inline Styles

</summary><ul>

<!-- prettier-ignore-start -->
<div>

- [x] Declarative

  - [x] `<span color:=red>one</span>`<figure><span color:=red>one</span></figure>

- [ ] Italics

  - [x] `one *two* three` — <samp>"two"</samp><figure>one _two_ three</figure>
  - [ ] `one*two*three` — <samp>"two"</samp><figure>one*two*three</figure>
  - [ ] `_one_*two*_three_` — <samp>all</samp><figure>_one**two**three_</figure>
  - [x] `one\*two\*three` — <samp>escape</samp><figure>one\*two\*three</figure>
  - [x] `one_two_three` — <samp>sic</samp><figure>one_two_three</figure>

- [ ] Bold

  - [x] `one **two** three` — <samp>"two"</samp><figure>one **two** three</figure>
  - [ ] `one**two**three` — <samp>"two"</samp><figure>one**two**three</figure>
  - [ ] `**one****two****three**` — <samp>all</samp><figure>**one\*\***two\***\*three**</figure>
  - [x] `one\**two\**three` — <samp>escape</samp><figure>one\*\*two\*\*three</figure>
  - [x] `one\*\*two\*\*three` — <samp>escape</samp><figure>one\*\*two\*\*three</figure>

- [ ] Bold + Italics

  - [x] `one **_two_ three**` — <samp>"two"</samp><figure>one **_two_ three**</figure>
  - [ ] `**_one_****_two_****_three_**` — <samp>all</samp><figure>**_one_\*\***_two_\***\*_three_**</figure>

- [ ] Strikethrough
  - [x] `one ~~two~~ three` — <samp>"two"</samp><figure>one ~~two~~ three</figure>
  - [ ] `one~~two~~three` — <samp>"two"</samp><figure>one~~two~~three</figure>
  - [ ] `~~one~~~~two~~~~three~~` — <samp>all</samp><figure>~~one~~~~two~~~~three~~</figure>
  - [x] `one\~~two\~~three` — <samp>sic</samp><figure>one\~~two\~~three</figure>

</div>
<!-- prettier-ignore-end -->

</details>

<details open><summary><h3>

- [-] Lists

</summary><ul>

- [x] Unordered Lists
- [x] Ordered Lists
- [x] Checklists
  - [x] Nested Checklist
- [x] Hybrid Lists
  - Unordered
  1. Ordered
  - [x] Checked
  - [-] Indeterminate
  - [ ] Unchecked
- [ ] Dynamic Checklists

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

</details>

<details open><summary><h3>

- [x] Heading Groups

</summary><ul>

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
</details>

<details open><summary><h3>

- [x] Headings

</summary><ul>

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

</details>

<details hidden><summary>

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

</details>

<title>smotaal.io/markout</title>

<pre align=center text-align:=center display:=flex place-self:=center>


<img width=50% min-width:=75% max-width:=50em title="smotaal.io/markout" src="./assets/markout-banner.png"/>


The HTML-flavoured markdown-inspired client renderer.

</pre>

## Features

Markout borrows a lot of nice features from Markdown, but uses a completely different rendering architecture that makes it easy to also leverage builtin features of the actual HTML renderer.

<details open><summary>

### Inline Styles

</summary>

<!-- prettier-ignore-start -->
<div>

- Italics

  - [x] `one *two* three` — <samp>"two"</samp><figure>one *two* three</figure>
  - [x] `one*two*three` — <samp>"two"</samp><figure>one*two*three</figure>
  - [ ] `_one_*two*_three_` — <samp>all</samp><figure>_one_*two*_three_</figure>
  - [x] `one\*two\*three` — <samp>escape</samp><figure>one\*two\*three</figure>
  - [x] `one_two_three` — <samp>sic</samp><figure>one_two_three</figure>

- Bold

  - [x] `one **two** three` — <samp>"two"</samp><figure>one **two** three</figure>
  - [x] `one**two**three` — <samp>"two"</samp><figure>one**two**three</figure>
  - [ ] `**one****two****three**` — <samp>all</samp><figure>**one****two****three**</figure>
  - [x] `one\**two\**three` — <samp>escape</samp><figure>one\**two\**three</figure>
  - [x] `one\*\*two\*\*three` — <samp>escape</samp><figure>one\*\*two\*\*three</figure>

- Strikethrough
  - [x] `one ~~two~~ three` — <samp>"two"</samp><figure>one ~~two~~ three</figure>
  - [ ] `one~~two~~three` — <samp>"two"</samp><figure>one~~two~~three</figure>
  - [ ] `~~one~~~~two~~~~three~~` — <samp>all</samp><figure>~~one~~~~two~~~~three~~</figure>
  - [x] `one\~~two\~~three` — <samp>sic</samp><figure>one\~~two\~~three</figure>

</div>
<!-- prettier-ignore-end -->
</details>

<details open><summary>

### Lists

</summary>

- [x] Unordered Lists
- [x] Ordered Lists
- [x] Checklists
  - Nested Lists
  - [x] Nested Checklist
- [x] Complex Lists
- [ ] Dynamic Checklists

<div column-grid>

<!-- prettier-ignore-start -->

<div>

```md
2. abc

a. 123

3. efg
```

</div>

<figure>

2. abc

a. 123

3. efg

</figure>

<!-- prettier-ignore-end -->

</div>
</details>

### Markout is an expressive way to author HTML

<details><summary>

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

<details><summary>

### Headings

</summary>

- [ ] Headings are created per conventional `#` prefix

<div column-grid>

<!-- prettier-ignore-start -->

<div>


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

</div>

<figure>
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

</figure>

<!-- prettier-ignore-end -->

</div>

- [ ] Headings are created using `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, and `<h6>` tags

<div column-grid>

<!-- prettier-ignore-start -->

<div>

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

</div>

<figure>
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
</figure>
<!-- prettier-ignore-end -->

</div>

</details>

<details><summary>

### Heading Groups
</summary>

- [ ] Heading groups are created from well-chained heading blocks

<div column-grid>

<!-- prettier-ignore-start -->

<div>

```md
# Heading
## Subheading
---
## Heading
### Subheading
---
# Heading
### Heading
```

</div>

<figure>
# Heading
## Subheading
---
## Heading
### Subheading
---
# Heading
### Heading
</figure>
<!-- prettier-ignore-end -->

</div>
</details>

<details><summary>

### Titles
</summary>

- [ ] Heading groups are created from well-chained heading blocks

<div column-grid>

<!-- prettier-ignore-start -->

<div>

```md
markdown
```

</div>

<figure>
markout
</figure>

<!-- prettier-ignore-end -->

</div>
</details>

# `www.smotaal.io`

## `/markout`

Renders markout from any URL by appending it as a hash.

## Concepts

Markout shares a lot of similarities with many markdown renderers, but uses a very different syntax with completely different processing mechanics.

### Markout is an expressive way to author HTML

<details><summary>
#### Titles
</summary>

- [ ] Title are implicitly defined from leading heading(s)

```md
# Hello World <!-- Title --->
```

- [ ] Title are explicitly defined from first `<title>` tag

```md
# Hello World

<title>Hello World!</title> <!-- Title --->
<title>Hello World!!</title>
```

</details>

<details><summary>
#### Headings
</summary>

- [ ] Headings are created per conventional `#` prefix

<div column-grid>

<!-- prettier-ignore-start -->
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
#### Heading Groups
</summary>

- [ ] Heading groups are created from well-chained heading blocks

<div column-grid>

<!-- prettier-ignore-start -->
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
#### Titles
</summary>

- [ ] Heading groups are created from well-chained heading blocks

<div column-grid>

<!-- prettier-ignore-start -->

```md
markdown
```

<figure>
markout
</figure>

<!-- prettier-ignore-end -->

</div>
</details>

<table>

<tr><th>

# Markout Refactor `v0.5`

<tr><th>

## Architecture

<tr><td>

<dl>

---

<dt>

Eliminate DOM dependence [<kbd>card</kbd>](https://github.com/SMotaal/markout/projects/1#card-29629808)

<dd>

> **How** — Redesign DOM-related functionality by extending the [pseu·dom](https://github.com/SMotaal/markup/tree/master/packages/pseudom) interface and using Custom Elements.
>
> <details>
>
> - A `<li>` can be composed as a `<markout-li>` but easily rendered as either or something completely different.
>
> - A `<hgroup>` can either be inferred from `<markout-article>` nodes.
>
> - A `<custom-element>` can be used to augment the compositional operations.
>
> </details>

> **Why** — Avoid deep `replaceWith` operations and render away from the DOM.

---

<dt>

Use OCAP encapsulation

<dd>

> **How** — Create a plugin-like design that uses `endowments`

> **Why** — Improve portability and testing.

---

</dl>

<tr><th>

## Testing

<tr><td>

<dl>

---

<dt>

Refactor by Specs [<kbd>card</kbd>](https://github.com/SMotaal/markout/projects/1#card-29629617)

<dd>

> **How** — Specs exported from `.spec.js` files that live next to each source and bundled file.
>
> <details>
>
> - Standalone testing with/out harnessing.
> - Expansive testing with harnessing.
>
> </details>

> **Why** — A TDD variant emphasizing on modularity, portability and continuous improvement.

---

</dl>

<tr><th>

## Deployment

<tr><td>

<tr><th>

## Documentation

<tr><td>

</table>

<article><header>

# Markout

## Framework

</header><summary>

This document provides an overview of the various building blocks of the Markout framework, tracking on the various underlying design challenges, technical requirements, evolving concepts… etc.

</summary><section><article><header>

## Frames

</header><summary>

Embedded `iframes` elements within human-readable documents open endless opportunities for creating highly interactive content.

And so, Markout Frames is a framework aiming to leveraging `iframes` far beyond the mere chores of inlining embedded `html` content from external sources. Its objective is to offer concise and declarative ways to populate frames with dynamically content generated while rendering.

</summary><section><article><header>

### Playgrounds

</header>

Playgrounds are the smallest addressable unit in our framework, and the starting point for sexploring this design space.

Aside from initial excitement and insights gained from early efforts, so far they have not delivered enough on the expectations that would make good case for Playgrounds to be offered as a feature of Markout — see [The First Markout Playground](../examples/Playground.md).

There are a lot of gaps for this to be useful, and even then, it is not likely that it would be a very useful feature by itself. Instead, it can be a very useful building block for other features, like Walkthroughs.

</article></section><article><header>

### Containers

Containers are runtime abstractions for containment and encapsulation away from any particular manifestations, where we can say that every `playground` will have its own `container` at runtime while not every `container` will not have a `playground`.

- [ ] `interface Container`

  > **Motivation** — The flow of the narrative should be able to create and address `Document` and/or `Realm` objects in a more organic way.

  - [ ] `class RealmContainer implements Container`

    - Provides `Realm` encapsulation
    - Attaches to an `InspectorContainer`

  - [ ] `class DocumentContainer extends RealmContainer`

    - Provides `<iframe>` encapsulation
    - Injects a slottable `<document-frame name>`

  - [ ] `class InspectorContainer extends RealmContainer`

    - Injects a slottable `<inspector-frame name>`

</header>

</article></section><article><header>

### Fixtures

Fixtures are runtime abstractions for contained resources.

subresource containment of a Playground, where each Playground would have its own runtime container.

- [ ] `interface Fixture`

  > **Motivation** — The flow of the narrative should be able to incorporate `Fixtures` or inline fragments, to include both frames or partial outputs.

  - [ ] `class DocumentFixture implements Fixture`

    - Adopts elements from a `<document>` (ie `DocumentContainer`)

  - [ ] `class ConsoleFixture implements Fixture`

    - Renders one or more `ConsoleOutput` records

</header>

</article></section><article><header>

### Walkthroughs

</header>

Current efforts have led to initial excitement and all the technical insights, but have so far not delivered on the more user-friendly expectations — see [The First Markout Playground](../examples/Playground.md).

</article></section>

</article>

<style src="/markout/styles/playground.primer.css"></style>

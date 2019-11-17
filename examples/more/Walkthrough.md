<div markout-class=primer>

# The First Markout Walkthrough

Walkthroughs are a spinoff of [Markout Playgrounds](../Playground.md) aiming for a more intuitive user experience for both authors and endusers.

Aside from the initial excitement and all the technical insights, Playgrounds actually fails at breaking many of the barriers that make it useful for prototyping, narration... etc. Simply put, the underlying design does not yet deliver.

## Expections

1. Defining **Containers**

   The flow of the narrative should be able to create and address `Document` and/or `Realm` objects in a more organic way.

   - [ ] Define `RealmContainer` that:

     - Implements `Container`
     - Provides `Realm` encapsulation
     - Attaches to an `InspectorContainer`

   - [ ] Define `DocumentContainer` that:

     - Extends `RealmContainer` implenting `Container`
     - Provides `<iframe>` encapsulation
     - Injects a slottable `<document-frame name>`

   - [ ] Define `InspectorContainer` that:

     - Extends `RealmContainer` implenting `Container`
     - Injects a slottable `<inspector-frame name>`

2. Defining **Fixtures**

   The flow of the narrative should be able to incorporate `Fixtures` or inline fragments, to include both frames or partial outputs.

   - [ ] Define `DocumentFixture` that:

     - Adopts elements from a `<document>` (ie `DocumentContainer`)

   - [ ] Define `ConsoleFixture` that:

     - Renders one or more `ConsoleOutput` records

<!-- <style src="/markout/styles/playground.primer.css"></style> -->
</div>

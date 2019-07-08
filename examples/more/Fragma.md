# Markout › Fragma

Fragma is a concept that has surfaced on occasion over the past two years, and once again, it surfaces as the perfect abstraction layer to close a lot of gaps in Markout's document model.

Markout's processing model, being more aligned with the real DOM it renders, can leverage some of the magic discovered in various Fragma experiments.

## Synopsis

1. Markout only uses the real DOM and does not have a parity DOM.

   - Common Markdown implementations rely on and sometimes even expose two-way abstractions (aka ASTs or DOMs) for the source text, let's just call this a parity DOM.

   - Markout has gradually moved away from this all too common practice as it contradicts with it being an notational simplified idempotent manifestation of for the rendered DOM.

2. Markout fragments are not DOM fragments, reflecting different models for identical nodes.

   - A Markout heading is any `HTMLHeadingElement` node within a parent or one that is the first of the kind in `<hgroup>` where it is of an equal of shallower order than the one cascaded down to its parent.

   - A Markout subheading is any heading node that is of a deeper order than than the one cascaded down to the parent of the previous heading which might be its parent or an ancestor of that.

   - A Markout section is everything leading up to a heading (including subsections), including if present as its heading the heading node that immediately precedes it.

   - A Markout subsection is everything starting from and including a subheading in of parent section until the next shallower or equal order to it, and within which the initial subheading actually represents the heading.

   - A fragma here in Markout's view, is more explicitly defining the logical relationships and roles of respective nodes, irrespective of the rendered relationships of the same nodes.

   - A fragma here in HTML's view, is somewhat similar to a `Range` in that it reflects initially contiguous nodes prior to being adopted into the DOM, in which they will have parallel but not identical relationships between the two views.

# Markout

## Data Structures

If we think of string of text as a series of one or more <kbd>`‹token›`</kbd>, we can say that `a‹tab›b` is actually <kbd>`a`</kbd><kbd>`‹tab›`</kbd><kbd>`b`</kbd> as tokens.


### Records with a "flat" structure using "implicit" index keys

<figcaption>So given this table:</figcaption>

```text
  (index) >>    a     |     b      |     c     |     d     |  tone  |
     0    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   25%  |
     1    >>   100%   |   21.54%   |   4.64%   |   1.00%   |   50%  |
     2    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   75%  |
```

<blockquote>
**Note**: For legability we are using <kbd>`>>`</kbd> to indicate the start of respective rows (or columns) of a well-structured range and <kbd>`|`</kbd> to indicate delimiters between individual keys or their respective values.
</blockquote>

<figcaption>We can expect this dataset:</figcaption>

```javascript
[
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 25%},
  {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%, tone: 50%},
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 75%},
]
```

<caption>And if we created a formatted table, it would look like this:</caption>

<table style="border: 1px solid var(--border-color); border-collapse: collapse; --cell-padding: 0.5em; --border-color: #999;">
<thead style="border: inherit;">
<tr style="border: inherit;">
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">a
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">b
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">c
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">d
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">tone
</tr>
</thead>
<tbody>
<tr style="border: 1px var(--border-color) dotted;">
  <td style="border: inherit; padding: var(--cell-padding)">60%
  <td style="border: inherit; padding: var(--cell-padding)">15.33%
  <td style="border: inherit; padding: var(--cell-padding)">3.91%
  <td style="border: inherit; padding: var(--cell-padding)">1.00%
  <td style="border: inherit; padding: var(--cell-padding)">25%
</tr>
<tr style="border: 1px var(--border-color) dotted;">
  <td style="border: inherit; padding: var(--cell-padding)">100%
  <td style="border: inherit; padding: var(--cell-padding)">21.54%
  <td style="border: inherit; padding: var(--cell-padding)">4.64%
  <td style="border: inherit; padding: var(--cell-padding)">1.00%
  <td style="border: inherit; padding: var(--cell-padding)">50%
</tr>
<tr style="border: 1px var(--border-color) dotted;">
  <td style="border: inherit; padding: var(--cell-padding)">60%
  <td style="border: inherit; padding: var(--cell-padding)">15.33%
  <td style="border: inherit; padding: var(--cell-padding)">3.91%
  <td style="border: inherit; padding: var(--cell-padding)">1.00%
  <td style="border: inherit; padding: var(--cell-padding)">75%
</tr>
</tbody>
</table>

# Markout

## Data Structures

If we think of string of text as a series of one or more <kbd>`‹token›`</kbd>, we can say that `a‹tab›b` is actually <kbd>`a`</kbd><kbd>`‹tab›`</kbd><kbd>`b`</kbd> as tokens.

If we extends the same logic to table structures where each record will occupy a single row, we can say that the tokens of the text must infer a single `‹key›` and `‹value›` for each `‹record›`, all of which are sharing a single data structure implied by the layout of the table.

### Records with a "flat" structure using "implicit" index keys

The simplest form of records is one that has a single row of column headings, followed by one or more rows of independent records, each having an implicit index start from 0.

<figcaption>So given this table:</figcaption>

```text
  (index) >>    a     |     b      |     c     |     d     |  tone  |
     0    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   25%  |
     1    >>   100%   |   21.54%   |   4.64%   |   1.00%   |   50%  |
     2    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   75%  |
```

> **Note**: For legability we are using <kbd>`>>`</kbd> to indicate the start of respective rows (or columns) of a well-structured range and <kbd>`|`</kbd> to indicate delimiters between individual keys or their respective values.

<figcaption>We can expect this dataset:</figcaption>

```javascript
[
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 25%},
  {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%, tone: 50%},
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 75%},
]
```

<caption>And if we created a formatted table, it would look like this:</caption>

<table style="border: 1px solid var(--border-color); border-collapse: collapse; --cell-padding: 0.5em; --border-color: #9993;">
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

### Records with a "nested" structure using "implicit" index keys

When records are more complicated, they often require layering or nesting, where a heading can encompass multiple subheadings inside a layered structure.

<figcaption>We can visualize this as follows:</figcaption>

```text
  (index) >> contrast |            |           |           |  tone  |
          >>    a     |     b      |     c     |     d     |        |
     0    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   25%  |
     1    >>   100%   |   21.54%   |   4.64%   |   1.00%   |   50%  |
     2    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   75%  |
```

<figcaption>If we extrapolate headings from top to bottom, we can expect this data set to look like this:</figcaption>

```javascript
[
  {contrast: {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%}, tone: 25% },
  {contrast: {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%}, tone: 50% },
  {contrast: {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%}, tone: 75% },
]
```

<caption>And if we created a formatted table, it would look like this:</caption>
<table style="border: 1px solid var(--border-color); border-collapse: collapse; --cell-padding: 0.5em; --border-color: #9993;">
<thead style="border: inherit;">
<tr style="border: inherit;">
  <th style="border: inherit; padding: var(--cell-padding)" colspan=4>contrast
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)" rowspan=2>tone
</tr>
<tr style="border: inherit;">
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">a
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">b
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">c
  <th style="border: inherit; border-bottom-width: 2px; padding: var(--cell-padding)">d
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

### Records with a "nested" structure using "explicit" keys

<figcaption>It gets a little tricky when we start thinking of non-array structures where instead of implied indices:</figcaption>

```text
>>                             |     X    |     Y   |
>> Target Size frame (in)      |    4.28  |   8.655 |
>> Target Size frame (mm)      |  108.72  | 219.840 |
>> Block Size tight frame (mm) |   93.13  |  93.130 |
```

<figcaption>Here we will also extrapolate headings from top to bottom, but more importantly since the first column heading was blank, we will designate this column to hold the "explicit" keys of each record and create a non-array structure of keys and values, that looks like this:</figcaption>

```javascript
{
  "Target Size frame (in)": {"X": 4.28, "Y": 8.655},
  "Target Size frame (mm)": {"X": 108.72, "Y": 219.84},
  "Block Size tight frame (mm)": {"X": 93.13, "Y": 93.13}
}
```

<caption>And if we created a formatted table, it would look like this:</caption>

<table style="border: 1px solid var(--border-color); border-collapse: collapse; --cell-padding: 0.5em; --border-color: #9993;">
<thead style="border: inherit; border-bottom-width: 2px;">
<tr style="border: inherit;">
  <th style="border: inherit; border-right-width: 2px; padding: var(--cell-padding)">
  <th style="border: inherit; padding: var(--cell-padding)">X
  <th style="border: inherit; padding: var(--cell-padding)">Y
</tr>
</thead>
<tbody>
<tr style="border: 1px var(--border-color) dotted;">
  <th style="border: inherit; border-style: solid; border-right-width: 2px; padding: var(--cell-padding)">Target Size frame (in)
  <td style="border: inherit; padding: var(--cell-padding)">4.28
  <td style="border: inherit; padding: var(--cell-padding)">8.655
</tr>
<tr style="border: 1px var(--border-color) dotted;">
  <th style="border: inherit; border-style: solid; border-right-width: 2px; padding: var(--cell-padding)">Target Size frame (mm)
  <td style="border: inherit; padding: var(--cell-padding)">108.72
  <td style="border: inherit; padding: var(--cell-padding)">219.84
</tr>
<tr style="border: 1px var(--border-color) dotted;">
  <th style="border: inherit; border-style: solid; border-right-width: 2px; padding: var(--cell-padding)">Block Size tight frame (mm)
  <td style="border: inherit; padding: var(--cell-padding)">93.13
  <td style="border: inherit; padding: var(--cell-padding)">93.13
</tr>
</tbody>
</table>

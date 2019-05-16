# Markout

## Structures

If we think of string of text as a series of one or more <kbd>`‹token›`</kbd>, we can say that `a‹tab›b` is actually <kbd>`a`</kbd><kbd>`‹tab›`</kbd><kbd>`b`</kbd> as tokens.

If we extends the same logic to table structures where each record will occupy a single row, we can say that the tokens of the text must infer a single `‹key›` and `‹value›` for each `‹record›`, all of which are sharing a single data structure implied by the layout of the table.

### Records with a "flat" structure using "implicit" index keys

The simplest form of records is one that has a single row of column headings, followed by one or more rows of independent records, each having an implicit index start from 0.

<figcaption>So given this table:</figcaption>

```text line-numbers
  (index) >>    a     |     b      |     c     |     d     |  tone  |
     0    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   25%  |
     1    >>   100%   |   21.54%   |   4.64%   |   1.00%   |   50%  |
     2    >>   60%    |   15.33%   |   3.91%   |   1.00%   |   75%  |
```

<blockquote>
**Note**: For legability we are using <kbd>`>>`</kbd> to indicate the start of respective rows (or columns) of a well-structured range and <kbd>`|`</kbd> to indicate delimiters between individual keys or their respective values.
</blockquote>

<figcaption>We can expect this dataset:</figcaption>

```javascript line-numbers
[
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 25%},
  {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%, tone: 50%},
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 75%},
]
```

<caption>And if we created a formatted table, it would look like this:</caption>

<table>
<thead>
<tr>
  <th>a
  <th>b
  <th>c
  <th>d
  <th>tone
</tr>
</thead>
<tbody>
<tr>
  <td>60%
  <td>15.33%
  <td>3.91%
  <td>1.00%
  <td>25%
</tr>
<tr>
  <td>100%
  <td>21.54%
  <td>4.64%
  <td>1.00%
  <td>50%
</tr>
<tr>
  <td>60%
  <td>15.33%
  <td>3.91%
  <td>1.00%
  <td>75%
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
<table>
<thead>
<tr>
  <th colspan=4>contrast
  <th rowspan=2>tone
</tr>
<tr>
  <th>a
  <th>b
  <th>c
  <th>d
</tr>
</thead>
<tbody>
<tr>
  <td>60%
  <td>15.33%
  <td>3.91%
  <td>1.00%
  <td>25%
</tr>
<tr>
  <td>100%
  <td>21.54%
  <td>4.64%
  <td>1.00%
  <td>50%
</tr>
<tr>
  <td>60%
  <td>15.33%
  <td>3.91%
  <td>1.00%
  <td>75%
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

<table>
<thead>
<tr>
  <th>
  <th>X
  <th>Y
</tr>
</thead>
<tbody>
<tr>
  <th>Target Size frame (in)
  <td>4.28
  <td>8.655
</tr>
<tr>
  <th>Target Size frame (mm)
  <td>108.72
  <td>219.84
</tr>
<tr>
  <th>Block Size tight frame (mm)
  <td>93.13
  <td>93.13
</tr>
</tbody>
</table>

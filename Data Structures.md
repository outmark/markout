# Markout

## Data Structures

If we think of string of text as a series of one or more <kbd>`token`</kbd>, we can say that `a‹tab›b` is actually <kbd>`a`</kbd><kbd>`‹tab›`</kbd><kbd>`b`</kbd> as tokens.

If we extends the same logic to table structures where each record will occupy a single row, we can say that the tokens of the text must infer a single `‹key›` and `‹value›` for each `‹record›`, all of which are sharing a single data structure implied by the layout of the table.

### Records with a "flat" structure using "implicit" index keys

The simplest form of records is one that has a single row of column headings, followed by one or more rows of independent records, each having an implicit index start from 0.

So given this table:

```text
  (index) ǁ    a     |     b      |     c     |     d     | tone   |
     0    ǁ   60%    |   15.33%   |   3.91%   |   1.00%   | 25%    |
     1    ǁ   100%   |   21.54%   |   4.64%   |   1.00%   | 50%    |
     2    ǁ   60%    |   15.33%   |   3.91%   |   1.00%   | 75%    |
```

<blockquote>
**Note**: For legability we are using <kbd>`ǁ`</kbd> to indicate the start of a line and <kbd>`|`</kbd> to indicate a delimiter.
</blockquote>

We can expect this dataset:

```javascript
[
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 25%},
  {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%, tone: 50%},
  {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%, tone: 75%},
]
```

### Records with a "nested" structure using "implicit" index keys

When records are more complicated, they often require layering or nesting, where a heading can encompass multiple subheadings inside a layered structure.

We can visualize this as follows:

```text
  (index) ǁ contrast |            |           |           | tone   |
          ǁ    a     |     b      |     c     |     d     |        |
     0    ǁ   60%    |   15.33%   |   3.91%   |   1.00%   | 25%    |
     1    ǁ   100%   |   21.54%   |   4.64%   |   1.00%   | 50%    |
     2    ǁ   60%    |   15.33%   |   3.91%   |   1.00%   | 75%    |
```

If we extrapolate headings from top to bottom, we can expect this data set to look like this:

```javascript
[
  {contrast: {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%}, tone: 25% },
  {contrast: {a: 100%, b: 21.54%, c: 4.64%, d: 1.00%}, tone: 50% },
  {contrast: {a: 60%, b: 15.33%, c: 3.91%, d: 1.00%}, tone: 75% },
]
```

### Records with a "nested" structure using "explicit" keys

It gets a little tricky when we start thinking of non-array structures where instead of implied indices.

```text
ǁ                             |     X     |     Y     |
ǁ Target Size frame (in)      |    4.280  |   8.655   |
ǁ Target Size frame (mm)      |   108.72  |  219.84   |
ǁ Block Size tight frame (mm) |   93.13   |   93.13   |
```

Here we will also extrapolate headings from top to bottom, but more importantly since the first column heading was blank, we will designate this column to hold the "explicit" keys of each record and create a non-array structure of keys and values, that looks like this:

```javascript
{
  "Target Size frame (in)": {"X": 4.28, "Y": 8.655},
  "Target Size frame (mm)": {"X": 108.72, "Y": 219.84},
  "Block Size tight frame (mm)": {"X": 93.13, "Y": 93.13}
}
```

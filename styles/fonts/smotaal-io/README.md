# smotaal-io Font

Experimental SVG-based font.

## Glyphs

<table width=95% text-align:=center align=center>

<thead>

<tr>
<th colspan=2 width=50%>Glyph
<th colspan=2 width=50%>Font

<tr>
<th>Name
<th>Unicode
<th>system-ui
<th>smotaal-io

<tbody>

<tr>
<td>link
<td><code>1F517</code>
<td font-family:=system-ui>&#x1F517;
<td font-family:=smotaal-io>&#x1F517;

</table>

## Building

### `TTF` (TrueType)

```sh
npx svg2ttf ./smotaal-io.svg ./smotaal-io.ttf
```

### `WOFF` (Web Open Font Format)

```sh
[ ! -f ./smotaal-io.ttf ] && npx svg2ttf ./smotaal-io.svg ./smotaal-io.ttf
npx ttf2woff ./smotaal-io.ttf ./smotaal-io.woff
```

# Spotlighting

Sometimes it helps to selectively dim nested elements in chains in order to improve visibility for the reader as they hover over them.

<blockquote>
A
<blockquote>A1</blockquote>
<blockquote>
A2

<blockquote>
	A2A
	<blockquote>A2A1</blockquote>
	<blockquote>A2A2</blockquote>
</blockquote>

</blockquote>

</blockquote>

<style>
@media screen {
	/* :not(:hover) > blockquote:not(:hover), */
  blockquote:hover blockquote:not(:hover) {
		opacity: 0.5;
	}
}
</style>

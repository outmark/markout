# My Markout Story

As some point during the summer of 2018, while trying to come up with an idea for my project for the HackerYou's Full-Stack course, I was really getting pissed at how my gists feel too dull compared to my browser's console and how that feels to elusive compared to my gists — I was left wondering, why the hell don't the two just make the effort!

Thanks to technology, most of us today walk around without any attention span to worry about, which is good, because from personal experience those are harder to attain from some people anyway.

## _I never got there, and that was by design… maybe?_

That's true, I just figured out everything along the way to get there, and to do that I had to come up with a system to keep my ideas and experiments sorted out, and that was just better to do against a normal project repo.

We'll get to that in a moment here, for me that's months, and you get to suffer some of those highlights.

### _Back to the story… aka highlights_

So now when we have an idea, it really helps to keep it together, or at least that is what anyone working on the next console or gists offering should keep in mind when they are considering if they are covering all the use cases, aside from the edge cases (you got those covered apparently).

### _Console, please…_

Yes, but, snippets are not ideas, just evals saved where? exactly, right, see I know you know this, we all do btw, but don't worry, no one cares anymore!

You really need to stop thinking small steps, people will not notice anything less than something big there, and you are not ready for that.

### _Playground, please…_

Yes, but, when you save you pen/bin to a gist, you will discover that we as developers are suffering from a discontinuity problem, aka opinionated transpilers and bundlers, or I just call that mojo shit.

You see, if you work out everything back to its `html`, `css` and `js` elements from any such exported gist, you will find that it behaves different in the browser.

No no no, thank you, they are more consistent about it than your pen/bin, you should try it, I know you will do just fine, come on, take a leap of faith!

### _It eventually hit me…_

How does one ever come up with ideas, if all everyone is really offering in lieu of sandbox is more like quicksand?

The answer is simple, back to basics, start from scratch, don't use anything that you cannot find exactly where you left it, how you left it, and most importantly, without needing anyone's special sauce to do that.

This is a road less travelled, and is full of many learning opportunities, and so you do.

This is when I realized, sure, I can develop this non-elusive console gist thing, but won't I really be hurting more than helping if I end up create more gaps?!

## _So, it was by design…_

Obviously, I never finished my project, but what I did instead is find my own way to overcome gaps of my own, and continued working on this ever since:

1. I realized is that Markdown is such a fluid thing in that there are too many self-claimed specs for it, aka flavours, that it is just ridiculous to think you will please everyone if you offer that.

   And this is when Markout first evolved into being a Markdown-inspired markup language of its own.

2. I found that one common demoninator in popular many markdown places, like GitHub, discouse... etc. is that they really puke when you introduce HTML things. And not because they don't use HTML rendering because that is plain stupid. But, because they need to make certain assumptions about their pipeline in that they cannot guarantee either the safety or to properly retain the semantics of you HTML.

   And so, Markout just got a little more interesting, because it technically does not have pipelines, just a simple `markout => <document-fragment›` and that technically puts almost all HTML things back on the table (but not quite).

3. In fact, I quickly realized that since Markout is not HTML, you don't want to ever have to operate on a so called Markout DOM and decided to do away with this notion completely.

   The only DOM you ever work on is the `document-fragment` of generated content, which is inert and ready to be bootstrapped before inserting into the actual `document`.

   In this frame, it is straightforward to reason about relative links of any kind being relative to the absolute location of the markout file itself (which is still `.md` all the same).

4. And while HTML was on the table, I still needed to minimize the cost of risky things with a reasonable degree of retaining the semantics.

   That said, I quickly found that `<script>` and `<style>` tags come with what I refer to as immediacy gaps, since they are really not inside HTML until they actually are.

   Instead, with `<script src>` or a `<style src>`, you add automatically add some distance cognitively, because you end up writing those in separate file. This was very different from my initial project's goal, but that's a more tenable starting point anyhow.

5. After some iterations, I decided that `<script type=module>` was simply `import(…)` and that had no concept of your actual document at this point.

   But if you really wanted to let your code to operate directly on the document, you would instead want to encapsulate it in an `<output>` so that your script can only ever see that container.

   So you if you use a web component, you'd `<script type=module>` but if you want to live demo, you'd `<output><script>` and that was as straightforward as it gets.

## _Now What?!_

I started working on this because I was struggling to stay on track with my development efforts, a lot of which is experimental, which is my calling. What I ended up with is my own GitHub pages engine, built from scratch, literally. In fact, unless you are in GitHub, chances are you are seeing this in Markout.

Now I rely on Markout for all my work, and I am involved in a lot of research venues, like the Secure ECMAScript (SES) Strategy group and the Node.js Modules group.

And while I don't see myself finishing the project from which this all started, I am now on track on previous projects that were on the slow path for the past few years.

Markout is meant to be open-source, so if you want to help see it evolve, I'd love to see where we can take it.

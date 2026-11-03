/**
 * markdown-it plugin for text alignment.
 *
 * Syntax:
 *   ->centered text<-
 *   ->right-aligned text->
 *
 * Each line that matches is wrapped in a <p> with the appropriate
 * text-align style. Works at the block level – place the markers on
 * their own paragraph lines.
 */
export function markdownAlignment(md: any): void {
  md.core.ruler.after("block", "alignment", (state: any) => {
    for (const token of state.tokens) {
      if (token.type !== "inline" || !token.content) continue;

      const text = token.content;

      // Check for center: ->...<-
      const centerMatch = text.match(/^->\s*([\s\S]+?)\s*<-$/);
      if (centerMatch) {
        token.content = centerMatch[1];
        const idx = state.tokens.indexOf(token);
        if (idx > 0 && state.tokens[idx - 1].type === "paragraph_open") {
          state.tokens[idx - 1].attrSet("style", "text-align: center");
        }
        continue;
      }

      // Check for right: ->...->
      const rightMatch = text.match(/^->\s*([\s\S]+?)\s*->$/);
      if (rightMatch) {
        token.content = rightMatch[1];
        const idx = state.tokens.indexOf(token);
        if (idx > 0 && state.tokens[idx - 1].type === "paragraph_open") {
          state.tokens[idx - 1].attrSet("style", "text-align: right");
        }
        continue;
      }
    }
  });
}

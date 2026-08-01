import { visit } from "unist-util-visit";

/**
 * Remark plugin: converts [n] patterns in prose text into markdown link nodes
 * with a `#cite:n` href. The react-markdown `a` component override detects
 * these and renders them as inline CitationMark chips instead of anchors.
 *
 * Numbering must match the order citations appear in AgentCitation[] (1-based).
 */
export function remarkCite() {
  return (tree: any) => {
    visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return;
      if (!/\[\d+\]/.test(node.value)) return;

      const parts: string[] = node.value.split(/(\[\d+\])/);
      if (parts.length <= 1) return;

      const newNodes = parts
        .filter((p) => p.length > 0)
        .map((part) => {
          const m = part.match(/^\[(\d+)\]$/);
          if (m) {
            return {
              type: "link",
              url: `#cite:${m[1]}`,
              title: null,
              children: [{ type: "text", value: m[1] }],
            };
          }
          return { type: "text", value: part };
        });

      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

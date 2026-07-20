import { Node, mergeAttributes } from "@tiptap/core";
import { fieldColor } from "./templateVisualCodec";

export type DocFieldAttrs = {
  key: string;
  label: string;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    docField: {
      insertDocField: (attrs: DocFieldAttrs) => ReturnType;
    };
  }
}

export const DocField = Node.create({
  name: "docField",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      key: { default: "" },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-doc-field]",
        getAttrs: (el) => {
          const element = el as HTMLElement;
          return {
            key: element.getAttribute("data-doc-field") || "",
            label: element.getAttribute("data-label") || element.textContent || "",
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const label = node.attrs.label || node.attrs.key;
    const color = fieldColor(node.attrs.key || "x");
    return [
      "span",
      mergeAttributes({
        "data-doc-field": node.attrs.key,
        "data-label": label,
        class: "doc-field-chip",
        contenteditable: "false",
        style: `background:${color}18;color:${color};border:1px solid ${color}55;border-radius:999px;padding:1px 8px;font-weight:700;font-size:12px;white-space:nowrap;`,
      }),
      label,
    ];
  },

  addCommands() {
    return {
      insertDocField:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import { toHtml } from "hast-util-to-html";
import { visit } from "unist-util-visit";
import { VFile } from "vfile";
import YAML from "yaml";
import { createHighlighter, type Highlighter } from "shiki";
import type { Root as MdRoot, RootContent, Parent, Text, Code, Heading, Paragraph, Table } from "mdast";
import type { Root as HRoot, Element, ElementContent } from "hast";
import { figureSchema, WIDGETS } from "./schemas";
import { scanStyle } from "./style";
import type { Issues } from "./report";

export type Tier = "core" | "competitive" | "champion";

export interface RunBlock {
  file: string;
  line: number;
  lang: "python" | "sql";
  db?: string;
  code: string;
  expectText?: string;
  expectTable?: { header: string[]; rows: string[][] };
}

export interface RenderContext {
  file: string;
  where: string;
  issues: Issues;
  mode: "lesson" | "block" | "inline";
  lessonUnit: Record<string, string>;
  checks: string[];
  widgets: string[];
  sections: { id: string; title: string; tier: Tier }[];
  strongs: string[];
  runnable: RunBlock[];
  words: number;
  figures: number;
}

const CODE_LANGS = new Set(["python", "sql", "r", "json", "bash", "text", "yaml", "csv", "xml"]);
const CALLOUTS = new Set(["key", "tip", "trap"]);

let highlighter: Highlighter | null = null;

export async function initHighlighter(): Promise<void> {
  highlighter = await createHighlighter({
    themes: ["github-light", "github-dark-dimmed"],
    langs: ["python", "sql", "r", "json", "bash", "yaml", "csv", "xml"],
  });
}

export function newContext(
  file: string,
  where: string,
  mode: RenderContext["mode"],
  issues: Issues,
  lessonUnit: Record<string, string>,
): RenderContext {
  return {
    file,
    where,
    issues,
    mode,
    lessonUnit,
    checks: [],
    widgets: [],
    sections: [],
    strongs: [],
    runnable: [],
    words: 0,
    figures: 0,
  };
}

function nodeText(node: unknown): string {
  const n = node as { type?: string; value?: string; children?: unknown[] };
  if (n.type === "text" || n.type === "inlineCode" || n.type === "inlineMath") return n.value ?? "";
  if (Array.isArray(n.children)) return n.children.map(nodeText).join("");
  return "";
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[`*_$\\]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function highlight(code: string, lang: string): ElementContent[] {
  if (!highlighter) throw new Error("highlighter not initialized");
  const root = highlighter.codeToHast(code, {
    lang: CODE_LANGS.has(lang) && lang !== "text" ? lang : "text",
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    defaultColor: false,
  });
  return root.children as ElementContent[];
}

function parseMeta(meta: string | null | undefined): { run: boolean; db?: string } {
  const out: { run: boolean; db?: string } = { run: false };
  if (!meta) return out;
  for (const part of meta.split(/\s+/)) {
    if (part === "run") out.run = true;
    const m = part.match(/^db=([a-z]+)$/);
    if (m) out.db = m[1];
  }
  return out;
}

function tableToRows(table: Table): { header: string[]; rows: string[][] } {
  const rows = table.children.map((row) => row.children.map((cell) => nodeText(cell).trim()));
  return { header: rows[0] ?? [], rows: rows.slice(1) };
}

function remarkCourse(ctx: RenderContext) {
  return (tree: MdRoot) => {
    const at = (node: { position?: { start: { line: number } } }) =>
      `${ctx.where}${node.position ? `:${node.position.start.line}` : ""}`;

    // Pair runnable code blocks with their expected output (next sibling).
    visit(tree, (node) => {
      const parent = node as Parent;
      if (!Array.isArray(parent.children)) return;
      parent.children.forEach((child, i) => {
        if (child.type !== "code") return;
        const meta = parseMeta(child.meta);
        if (!meta.run) return;
        const next = parent.children[i + 1];
        if (child.lang === "python") {
          if (!next || next.type !== "code" || next.lang !== "output") {
            ctx.issues.error(ctx.file, at(child), "a `python run` block must be followed by an `output` block");
            return;
          }
          ctx.runnable.push({ file: ctx.file, line: child.position?.start.line ?? 0, lang: "python", code: child.value, expectText: next.value });
        } else if (child.lang === "sql") {
          if (!meta.db) {
            ctx.issues.error(ctx.file, at(child), "a `sql run` block needs db=school or db=shop");
            return;
          }
          if (!next || next.type !== "table") {
            ctx.issues.error(ctx.file, at(child), "a `sql run` block must be followed by a markdown table of the result");
            return;
          }
          ctx.runnable.push({ file: ctx.file, line: child.position?.start.line ?? 0, lang: "sql", db: meta.db, code: child.value, expectTable: tableToRows(next) });
        } else {
          ctx.issues.error(ctx.file, at(child), "only python and sql blocks can be marked run");
        }
      });
    });

    visit(tree, (node, index, parent) => {
      switch (node.type) {
        case "html": {
          ctx.issues.error(ctx.file, at(node), `raw HTML is not allowed: ${node.value.slice(0, 40)}`);
          if (parent && typeof index === "number") {
            parent.children.splice(index, 1, { type: "text", value: node.value } as Text);
          }
          return;
        }
        case "image":
          ctx.issues.error(ctx.file, at(node), "images are not allowed; use a figure spec");
          return;
        case "textDirective": {
          // Accidental directives such as "ratio:value" are restored as text.
          if (parent && typeof index === "number") {
            const label = nodeText(node);
            parent.children.splice(index, 1, { type: "text", value: `:${node.name}${label ? `[${label}]` : ""}` } as Text);
          }
          return;
        }
        case "leafDirective": {
          if (ctx.mode !== "lesson") {
            ctx.issues.error(ctx.file, at(node), `::${node.name} is only allowed in lessons`);
            return;
          }
          if (node.name === "check") {
            const id = node.attributes?.id;
            if (!id) ctx.issues.error(ctx.file, at(node), "::check needs an id");
            else ctx.checks.push(id);
            node.data = { hName: "x-check", hProperties: { qid: id ?? "" } };
          } else if (node.name === "widget") {
            const name = node.attributes?.name ?? "";
            if (!(WIDGETS as readonly string[]).includes(name)) ctx.issues.error(ctx.file, at(node), `unknown widget "${name}"`);
            ctx.widgets.push(name);
            node.data = { hName: "x-widget", hProperties: { name } };
          } else {
            ctx.issues.error(ctx.file, at(node), `unknown directive ::${node.name}`);
          }
          return;
        }
        case "containerDirective": {
          if (ctx.mode !== "lesson") {
            ctx.issues.error(ctx.file, at(node), `:::${node.name} is only allowed in lessons`);
            return;
          }
          let title = "";
          const first = node.children[0] as Paragraph | undefined;
          if (first && first.type === "paragraph" && (first.data as { directiveLabel?: boolean } | undefined)?.directiveLabel) {
            title = nodeText(first).trim();
            node.children.shift();
          }
          if (CALLOUTS.has(node.name)) {
            node.data = { hName: "x-callout", hProperties: { kind: node.name } };
          } else if (node.name === "example") {
            const steps = node.children.filter((c) => c.type === "containerDirective" && c.name === "step").length;
            if (steps === 0) ctx.issues.error(ctx.file, at(node), "a worked example needs at least one :::step");
            if (!title) ctx.issues.warn(ctx.file, at(node), "a worked example should have a title, e.g. ::::example[Title]");
            node.data = { hName: "x-example", hProperties: { title } };
          } else if (node.name === "step" || node.name === "answer") {
            if (!parent || parent.type !== "containerDirective" || (parent as { name?: string }).name !== "example") {
              ctx.issues.error(ctx.file, at(node), `:::${node.name} must be inside ::::example`);
            }
            node.data = { hName: "x-step", hProperties: { kind: node.name } };
          } else if (node.name === "takeaways") {
            node.data = { hName: "x-takeaways" };
          } else {
            ctx.issues.error(ctx.file, at(node), `unknown container :::${node.name}`);
          }
          return;
        }
        case "heading": {
          const h = node as Heading;
          if (ctx.mode !== "lesson") {
            ctx.issues.error(ctx.file, at(h), "headings are not allowed in question text");
            return;
          }
          if (h.depth === 1) ctx.issues.error(ctx.file, at(h), "do not use # headings; the title comes from frontmatter");
          if (h.depth >= 4) ctx.issues.warn(ctx.file, at(h), "avoid headings deeper than ###");
          if (h.depth === 2) {
            let tier: Tier = "core";
            const last = h.children[h.children.length - 1];
            if (last && last.type === "text") {
              const m = last.value.match(/\s*\[(Core|Competitive|Champion)\]\s*$/);
              if (m) {
                tier = m[1].toLowerCase() as Tier;
                last.value = last.value.slice(0, m.index);
              }
            }
            const title = nodeText(h).trim();
            let id = slugify(title) || `section-${ctx.sections.length + 1}`;
            if (ctx.sections.some((s) => s.id === id)) id = `${id}-${ctx.sections.length + 1}`;
            ctx.sections.push({ id, title, tier });
            h.data = { hProperties: { id, "data-tier": tier } };
          }
          return;
        }
        case "code": {
          const c = node as Code;
          if (c.lang === "figure") {
            let spec: unknown;
            try {
              spec = YAML.parse(c.value);
            } catch (e) {
              ctx.issues.error(ctx.file, at(c), `figure YAML does not parse: ${(e as Error).message.split("\n")[0]}`);
              return;
            }
            const parsed = figureSchema.safeParse(spec);
            if (!parsed.success) {
              const first = parsed.error.issues[0];
              ctx.issues.error(ctx.file, at(c), `figure spec invalid at ${first.path.join(".") || "(root)"}: ${first.message}`);
              return;
            }
            if (!parsed.data.caption) ctx.issues.warn(ctx.file, at(c), "figures should have a caption");
            ctx.figures += 1;
            c.data = { hName: "x-figure", hProperties: { spec: JSON.stringify(parsed.data) }, hChildren: [] };
            return;
          }
          const lang = (c.lang ?? "text").toLowerCase();
          if (lang === "output") {
            c.data = {
              hName: "x-code",
              hProperties: { lang: "output" },
              hChildren: [{ type: "element", tagName: "pre", properties: { className: ["output"] }, children: [{ type: "text", value: c.value }] }],
            };
            return;
          }
          if (!CODE_LANGS.has(lang)) ctx.issues.warn(ctx.file, at(c), `unknown code language "${lang}"`);
          c.data = { hName: "x-code", hProperties: { lang }, hChildren: highlight(c.value, lang) };
          return;
        }
        case "link": {
          if (node.url.startsWith("lesson:")) {
            const id = node.url.slice("lesson:".length).split("#")[0];
            const unit = ctx.lessonUnit[id];
            if (!unit) ctx.issues.error(ctx.file, at(node), `link to unknown lesson "${id}"`);
            node.url = `/learn/${unit ?? "u0"}/${id}`;
          } else if (!/^https?:\/\//.test(node.url) && !node.url.startsWith("#")) {
            ctx.issues.warn(ctx.file, at(node), `unexpected link target "${node.url}"`);
          }
          return;
        }
        case "strong": {
          ctx.strongs.push(nodeText(node).trim().toLowerCase());
          return;
        }
        case "text": {
          ctx.words += node.value.split(/\s+/).filter(Boolean).length;
          for (const problem of scanStyle(node.value)) ctx.issues.error(ctx.file, at(node), problem);
          return;
        }
        default:
          return;
      }
    });
  };
}

function buildProcessor(ctx: RenderContext) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath, { singleDollarTextMath: false })
    .use(remarkDirective)
    .use(remarkCourse, ctx)
    .use(remarkRehype)
    .use(rehypeKatex, { strict: false, throwOnError: true });
}

export function renderToHast(markdown: string, ctx: RenderContext): HRoot {
  const processor = buildProcessor(ctx);
  const file = new VFile({ value: markdown, path: ctx.file });
  const tree = processor.parse(file);
  let hast: HRoot;
  try {
    hast = processor.runSync(tree, file) as HRoot;
  } catch (e) {
    ctx.issues.error(ctx.file, ctx.where, `math or markdown failed to render: ${(e as Error).message.split("\n")[0]}`);
    hast = { type: "root", children: [] };
  }
  for (const m of file.messages) {
    if (m.fatal || m.source === "rehype-katex") ctx.issues.error(ctx.file, `${ctx.where}:${m.line ?? "?"}`, String(m.reason));
  }
  return hast;
}

function rewriteCustom(node: HRoot | Element): void {
  for (const child of node.children) {
    if (child.type !== "element") continue;
    if (child.tagName === "x-code") {
      child.tagName = "div";
      const lang = String(child.properties?.lang ?? "");
      child.properties = { className: ["code-block"], dataLang: lang };
    }
    rewriteCustom(child);
  }
}

export function renderToHtml(markdown: string, ctx: RenderContext): string {
  const hast = renderToHast(markdown, ctx);
  rewriteCustom(hast);
  if (ctx.mode === "inline" && hast.children.length === 1) {
    const only = hast.children[0];
    if (only.type === "element" && only.tagName === "p") return toHtml(only.children);
  }
  return toHtml(hast);
}

export function splitFrontmatter(src: string): { data: Record<string, unknown>; body: string; offset: number } {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { data: {}, body: src, offset: 0 };
  const data = (YAML.parse(m[1]) ?? {}) as Record<string, unknown>;
  const offset = m[0].split("\n").length - 1;
  return { data, body: "\n".repeat(offset) + src.slice(m[0].length), offset };
}

export type { RootContent };

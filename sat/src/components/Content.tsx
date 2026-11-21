"use client";

import { Fragment, useEffect, type ReactNode } from "react";
import { BASE, type Block, type Inline } from "@/lib/data";

// Renders extracted question content: text runs, math (exact glyph outlines from the
// College Board's MathJax, drawn from a shared sprite), LaTeX for the older items, and
// vector figures. Math and the punctuation that follows it never split across lines.

let spriteRequested = false;

/** Injects the glyph sprite once per page so every <use href="#g..."> resolves. */
export function GlyphSprite() {
  useEffect(() => {
    if (spriteRequested || document.getElementById("glyph-sprite")) return;
    spriteRequested = true;
    fetch(`${BASE}/data/glyphs.svg`)
      .then((r) => r.text())
      .then((svg) => {
        const holder = document.createElement("div");
        holder.id = "glyph-sprite";
        holder.setAttribute("aria-hidden", "true");
        holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
        holder.innerHTML = svg;
        document.body.prepend(holder);
      })
      .catch(() => {
        spriteRequested = false;
      });
  }, []);
  return null;
}

function text(item: { t: string; f?: string }, key: number): ReactNode {
  let node: ReactNode = item.t;
  const f = item.f ?? "";
  if (f.includes("s")) node = <sup>{node}</sup>;
  if (f.includes("d")) node = <sub>{node}</sub>;
  if (f.includes("u")) node = <u>{node}</u>;
  if (f.includes("i")) node = <em>{node}</em>;
  if (f.includes("b")) node = <strong>{node}</strong>;
  return <Fragment key={key}>{node}</Fragment>;
}

function atom(item: Inline, key: number): ReactNode {
  if ("m" in item) {
    const style: React.CSSProperties = { width: `${item.w}em`, height: `${item.h}em` };
    if (item.va !== undefined) style.verticalAlign = `${item.va}em`;
    return <svg key={key} className="m" viewBox={`0 0 ${item.vw} ${item.vh}`} style={style} aria-hidden dangerouslySetInnerHTML={{ __html: item.m }} />;
  }
  if ("k" in item) return <span key={key} dangerouslySetInnerHTML={{ __html: item.k }} />;
  if ("img" in item) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img key={key} className="im" src={`${BASE}/data/img/${item.img}.png`} alt="" style={{ width: `${item.w}em`, height: `${item.h}em`, verticalAlign: `${item.va}em` }} />;
  }
  return null;
}

const LEAD = /^[,.;:!?)\]’”'"%]+/;
const TRAIL = /[(\[$‘“'"−-]+$/;

export function InlineRun({ items }: { items: Inline[] }) {
  const out: ReactNode[] = [];
  let k = 0;
  let pending: { t: string; f?: string } | null = null;
  const flush = () => {
    if (pending && pending.t) out.push(text(pending, k++));
    pending = null;
  };
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if ("br" in it) {
      flush();
      out.push(<br key={k++} />);
      continue;
    }
    if ("t" in it) {
      flush();
      pending = { ...it };
      continue;
    }
    // a math atom: glue it to the punctuation right before and after it
    const glued: ReactNode[] = [];
    const before = pending as { t: string; f?: string } | null;
    if (before) {
      const m = TRAIL.exec(before.t);
      if (m) {
        const head = before.t.slice(0, -m[0].length);
        if (head) out.push(text({ ...before, t: head }, k++));
        glued.push(text({ ...before, t: m[0] }, k++));
        pending = null;
      } else {
        flush();
      }
    }
    glued.push(atom(it, k++));
    const next = items[i + 1];
    if (next && "t" in next) {
      const m = LEAD.exec(next.t);
      if (m) {
        glued.push(text({ ...next, t: m[0] }, k++));
        pending = { ...next, t: next.t.slice(m[0].length) };
        i++;
      }
    }
    out.push(
      <span key={k++} className="nw">
        {glued}
      </span>,
    );
  }
  flush();
  return <>{out}</>;
}

export function Blocks({ blocks, className = "qtext" }: { blocks: Block[]; className?: string }) {
  return (
    <div className={className}>
      {blocks.map((b, i) => {
        if (b.k === "fig") {
          return (
            <figure key={i}>
              <svg viewBox={`0 0 ${b.vw} ${b.vh}`} style={{ width: `${b.w}em` }} role="img" aria-label={b.alt ?? "Figure"} dangerouslySetInnerHTML={{ __html: b.svg }} />
            </figure>
          );
        }
        const cls = b.li ? "li" : b.al === "c" ? "c" : b.al === "r" ? "r" : undefined;
        const style = b.ind && !b.li ? { paddingLeft: `${Math.min(b.ind, 4)}em` } : undefined;
        return (
          <p key={i} className={cls} style={style}>
            <InlineRun items={b.c} />
          </p>
        );
      })}
    </div>
  );
}

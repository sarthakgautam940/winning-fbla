import Link from "next/link";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime, type Components } from "hast-util-to-jsx-runtime";
import type { Element, ElementContent, Root } from "hast";
import type { FigureSpec, QMeta, QuestionContent } from "@/lib/content-types";
import { Figure } from "@/components/figures/Figure";
import { QuestionCard } from "@/components/question/QuestionCard";
import { WidgetSlot } from "@/components/widgets/WidgetSlot";
import { WorkedExample } from "./WorkedExample";
import { CodeBlock } from "./CodeBlock";

type NodeProps = { node?: Element; children?: React.ReactNode } & Record<string, unknown>;

const CALLOUT_STYLE: Record<string, string> = {
  key: "bg-surface-2",
  tip: "bg-good-soft",
  trap: "bg-bad-soft",
};

export function LessonBody({ hast, questions, metas }: { hast: Root; questions: Record<string, QuestionContent>; metas: Record<string, QMeta> }) {
  // `questions` is built in document order, so a check's number is its position.
  const order = Object.keys(questions);

  const render = (children: ElementContent[]) => toJsxRuntime({ type: "root", children } as Root, { Fragment, jsx, jsxs, components, passNode: true });

  const components = {
    h2: ({ node, children, id }: NodeProps) => {
      const tier = String(node?.properties?.dataTier ?? "core");
      return (
        <h2 id={id as string} data-section="" className="group flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span>{children}</span>
          {tier !== "core" ? <span className="text-[12.5px] font-medium tracking-normal text-ink-3">{tier === "champion" ? "Champion" : "Competitive"}</span> : null}
        </h2>
      );
    },
    table: ({ children }: NodeProps) => (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    ),
    a: ({ href, children }: NodeProps) => {
      const url = String(href ?? "");
      return url.startsWith("/") ? (
        <Link href={url}>{children}</Link>
      ) : (
        <a href={url} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
    "x-callout": ({ node, children }: NodeProps) => {
      const kind = String(node?.properties?.kind ?? "key");
      return <aside className={`not-prose rich my-6 rounded-[14px] px-5 py-4 text-[16px] ${CALLOUT_STYLE[kind] ?? ""}`}>{children}</aside>;
    },
    "x-takeaways": ({ children }: NodeProps) => (
      <section className="not-prose mt-12 rounded-[var(--radius-lg)] border border-line bg-surface px-6 py-5">
        <h2 className="text-[17px] font-semibold text-ink" style={{ marginTop: 0 }}>
          Key takeaways
        </h2>
        <div className="rich mt-3 text-[15.5px] [&_li+li]:mt-1.5">{children}</div>
      </section>
    ),
    "x-example": ({ node }: NodeProps) => {
      const kids = (node?.children ?? []) as ElementContent[];
      const isStep = (c: ElementContent, kind: string) => c.type === "element" && c.tagName === "x-step" && String(c.properties?.kind) === kind;
      const problem = kids.filter((c) => !(c.type === "element" && c.tagName === "x-step"));
      const steps = kids.filter((c) => isStep(c, "step")) as Element[];
      const answer = kids.find((c) => isStep(c, "answer")) as Element | undefined;
      return (
        <WorkedExample
          title={String(node?.properties?.title ?? "")}
          problem={render(problem)}
          steps={steps.map((s, i) => (
            <Fragment key={i}>{render(s.children)}</Fragment>
          ))}
          answer={answer ? render(answer.children) : undefined}
        />
      );
    },
    "x-check": ({ node }: NodeProps) => {
      const qid = String(node?.properties?.qid ?? "");
      const q = questions[qid];
      if (!q) return null;
      return (
        <div className="not-prose my-8">
          <QuestionCard q={q} meta={metas[qid]} mode="check" resumeLast heading={<span className="font-medium text-ink-2">Check {order.indexOf(qid) + 1}</span>} />
        </div>
      );
    },
    "x-figure": ({ node }: NodeProps) => {
      const spec = JSON.parse(String(node?.properties?.spec ?? "{}")) as FigureSpec;
      return <Figure spec={spec} />;
    },
    "x-widget": ({ node }: NodeProps) => <WidgetSlot name={String(node?.properties?.name ?? "")} />,
    "x-code": ({ node, children }: NodeProps) => <CodeBlock lang={String(node?.properties?.lang ?? "text")}>{children}</CodeBlock>,
  } as unknown as Partial<Components>;

  return <div className="rich lesson-prose">{toJsxRuntime(hast, { Fragment, jsx, jsxs, components, passNode: true })}</div>;
}

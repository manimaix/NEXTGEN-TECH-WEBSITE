import { ArrowUpRight, ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";
export function CTA({
  to = "/contact",
  children = "Discuss your project",
  secondary = false,
}: {
  to?: string;
  children?: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={secondary ? "text-link" : "button"} to={to}>
      {children}
      {secondary ? <ArrowRight size={18} /> : <ArrowUpRight size={19} />}
    </Link>
  );
}
export function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
export function ClosingCTA() {
  return (
    <section className="closing container">
      <div>
        <h2>
          What would you
          <br />
          like to improve?
        </h2>
        <p>
          A business challenge. An idea. A workflow that could work better.
          <br className="desktop-only" /> Let’s find a useful starting point.
        </p>
      </div>
      <CTA />
    </section>
  );
}
export function PageIntro({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="container page-intro">
      <h1>{title}</h1>
      <p className="lead">{description}</p>
      {children}
    </section>
  );
}
export function FAQ({ items }: { items: readonly { q: string; a: string }[] }) {
  return (
    <div className="faq-list">
      {items.map((i) => (
        <details key={i.q}>
          <summary>
            {i.q}
            <Plus className="faq-icon" size={20} aria-hidden="true" />
          </summary>
          <p>{i.a}</p>
        </details>
      ))}
    </div>
  );
}

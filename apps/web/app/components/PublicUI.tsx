import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";

export function PublicAction({
  to,
  children,
  secondary = false,
}: {
  to: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        secondary ? "public-text-link" : "landing-button landing-button-yellow"
      }
    >
      {children}
      {secondary ? (
        <ArrowRight size={18} aria-hidden="true" />
      ) : (
        <ArrowUpRight size={20} aria-hidden="true" />
      )}
    </Link>
  );
}

export function PublicFAQ({
  title = "A few useful answers.",
  items,
}: {
  title?: string;
  items: readonly { q: string; a: string }[];
}) {
  return (
    <section className="public-section public-wrap public-faq">
      <h2>{title}</h2>
      <div>
        {items.map((item) => (
          <details key={item.q}>
            <summary>
              {item.q}
              <Plus size={20} aria-hidden="true" />
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

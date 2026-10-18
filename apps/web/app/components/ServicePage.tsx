import { Link } from "react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  type ServiceItem,
  contactPath,
  faqs,
  services,
  servicePath,
} from "../../content/services";
import { PublicAction, PublicFAQ } from "./PublicUI";
import { WorkflowComparison } from "./WorkflowComparison";

export function ServicePage({ service: s }: { service: ServiceItem }) {
  const title =
    s.id === "consulting" ? (
      <>
        Know what to
        <br />
        <span>build next.</span>
      </>
    ) : s.id === "application_development" ? (
      <>
        Software that
        <br />
        <span>fits the work.</span>
      </>
    ) : (
      <>
        Put AI to work.
        <br />
        <span>
          Keep people
          <br />
          in control.
        </span>
      </>
    );
  return (
    <>
      <nav className="public-wrap public-breadcrumb" aria-label="Breadcrumb">
        <Link to="/services">
          <ArrowLeft size={16} aria-hidden="true" />
          All services
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{s.title}</span>
      </nav>
      <section className="public-band public-band-green public-service-hero">
        <div className="public-wrap public-split">
          <div>
            <h1>{title}</h1>
            <PublicAction to={contactPath(s.id)}>
              Discuss{" "}
              {s.id === "ai_agents_integration"
                ? s.short
                : s.short.toLowerCase()}
            </PublicAction>
          </div>
          <div className="public-service-statement">
            <p>{s.description}</p>
            <p>{s.audience}</p>
          </div>
        </div>
      </section>
      <section className="public-wrap public-section public-scope-intro">
        <h2>
          {s.id === "consulting"
            ? "Make the decision clearer."
            : s.id === "application_development"
              ? "Start with the essential journey."
              : "Choose one useful task."}
        </h2>
        <p>{s.problem}</p>
      </section>
      <section
        className="public-wrap public-scope"
        aria-label="Scope and preparation"
      >
        <div>
          <h2>What we can deliver</h2>
          <ul>
            {s.deliverables.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="public-note">
            Illustrative scope. Final deliverables are agreed for your
            engagement.
          </p>
        </div>
        <div>
          <h2>What you bring</h2>
          <ul>
            {s.inputs.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="public-note">
            An initial conversation is enough to get started. Keep confidential
            material out of the enquiry.
          </p>
        </div>
      </section>
      {s.id === "ai_agents_integration" && (
        <section className="public-band public-band-green">
          <div className="public-wrap public-demo-layout">
            <div>
              <h2>
                See the
                <br />
                division of work.
              </h2>
              <p>
                One enquiry. The same five tasks. Explore what AI prepares and
                where your team’s judgment stays essential.
              </p>
            </div>
            <WorkflowComparison />
          </div>
        </section>
      )}
      <PublicFAQ title="Before we begin." items={faqs.slice(0, 3)} />
      <section className="public-band public-band-mint">
        <div className="public-wrap public-related">
          <h2>Also worth a look.</h2>
          <div>
            {services
              .filter((item) => item.id !== s.id)
              .map((item) => (
                <Link key={item.id} to={servicePath(item)}>
                  {item.id === "ai_training" ? "Team training" : item.title}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

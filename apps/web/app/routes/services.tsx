import { Link } from "react-router";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { services, servicePath } from "../../content/services";
import { PublicAction } from "../components/PublicUI";

export const meta = () => [
  { title: "Technical services — Nextgen Tech" },
  {
    name: "description",
    content:
      "Technology consulting, software development, AI integration and HRD Corp-claimable team training. Find the right starting point.",
  },
];

export default function Services() {
  return (
    <>
      <section className="public-wrap public-directory-intro">
        <h1>
          Technical
          <br />
          <span>services.</span>
        </h1>
        <div>
          <p>
            Plan, build and connect your technology.
            <br />
            Help your people put it to work.
          </p>
          <PublicAction to="/contact?service=not_sure" secondary>
            Find my starting point
          </PublicAction>
        </div>
      </section>
      <section
        className="public-wrap public-directory"
        aria-label="Explore our services"
      >
        {services.map((service) => (
          <article className="public-service-row" key={service.id}>
            <div>
              <h2>
                <Link to={servicePath(service)}>
                  {service.id === "ai_training"
                    ? "Team training"
                    : service.title}
                  <ArrowUpRight size={28} aria-hidden="true" />
                </Link>
              </h2>
              <p>
                {service.id === "ai_training"
                  ? "HRD Corp-claimable courses to build your employees’ practical AI and technology skills."
                  : service.description}
              </p>
            </div>
            <ul aria-label="Possible scope">
              {service.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link to={servicePath(service)} className="public-text-link">
              Explore{" "}
              {service.id === "ai_agents_integration"
                ? service.short
                : service.short.toLowerCase()}
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </section>
      <section className="public-band public-band-mint">
        <div className="public-wrap public-split">
          <h2>
            You don’t need
            <br />
            all four.
          </h2>
          <div>
            <p>
              Start with the part that needs to work better. Consulting can
              clarify a decision. Development can turn it into software. AI
              integration and training can support the people using it.
            </p>
            <PublicAction to="/contact?service=not_sure" secondary>
              Talk through the problem
            </PublicAction>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";
import { process, services, servicePath } from "../../content/services";
import { PublicAction } from "../components/PublicUI";
import { SitePhoto, TeamSection } from "../components/SiteImages";
export const meta = () => [
  { title: "About Nextgen Tech Sdn Bhd" },
  {
    name: "description",
    content:
      "Technology consulting, application development, AI integration and employee training. Meet the approach behind Nextgen Tech.",
  },
];

export default function About() {
  return (
    <>
      <section className="public-band public-band-green">
        <div className="public-wrap public-about-hero">
          <h1>
            Technology.
            <br />
            <span>
              With people
              <br />
              in mind.
            </span>
          </h1>
          <div>
            <p>
              We’re Nextgen Tech Sdn Bhd. We help businesses plan, build and
              connect technology—and help their people use it.
            </p>
            <PublicAction to="/contact">
              Let’s talk about your work
            </PublicAction>
          </div>
        </div>
      </section>
      <div className="public-wrap site-about-workplace">
        <SitePhoto slot="about-workplace" eager />
      </div>
      <section className="public-wrap public-section public-about-principle">
        <h2>The work comes first.</h2>
        <div>
          <p>
            A new system should support the people using it. That starts with
            understanding their work, making the scope clear and asking the
            difficult questions early.
          </p>
          <p>
            Planning, implementation and learning belong in the same
            conversation. The starting point depends on your business, not on
            the newest tool.
          </p>
        </div>
      </section>
      <TeamSection />
      <section className="public-band public-band-mint">
        <div className="public-wrap public-engagement">
          <div>
            <h2>
              From the first
              <br />
              question to
              <br />
              the handover.
            </h2>
            <p>
              A proposed engagement process. We agree deliverables and support
              arrangements around your project.
            </p>
          </div>
          <ol>
            {process.map((step, index) => (
              <li key={step.title}>
                <span>{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="public-wrap public-section public-related">
        <h2>Where we can help.</h2>
        <div>
          {services.map((service) => (
            <Link to={servicePath(service)} key={service.id}>
              {service.id === "ai_training" ? "Team training" : service.title}
              <ArrowUpRight size={20} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

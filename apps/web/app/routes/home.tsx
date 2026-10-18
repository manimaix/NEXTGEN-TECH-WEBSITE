import { Link } from "react-router";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Plus } from "lucide-react";
import { faqs } from "../../content/services";
import { WorkflowComparison } from "../components/WorkflowComparison";

export const meta = () => [
  { title: "Nextgen Tech — Consulting, software, AI & training" },
  {
    name: "description",
    content:
      "Technology consulting, custom applications, AI integration and HRD Corp-claimable employee training from Nextgen Tech Sdn Bhd.",
  },
];
const serviceEntries = [
  {
    title: "Technology consulting",
    prompt: "Work out where to start.",
    body: "We look at your workflows, existing systems and constraints, then work through the options with you. The outcome is a prioritised plan, before you commit to a build.",
    outputs: ["Workflow assessment", "Technology roadmap", "A defined scope"],
    url: "/services/consulting",
  },
  {
    title: "Application development",
    prompt: "Build around the way you work.",
    body: "An internal tool, a customer-facing application or a new product. We map the essential journeys, build the software and test it against the work it needs to do.",
    outputs: ["User experience", "Applications & APIs", "Testing & handover"],
    url: "/services/application-development",
  },
  {
    title: "AI agents & integration",
    prompt: "Give a repetitive task a rethink.",
    body: "Connect AI to an agreed task, approved information and permitted tools. Define what it can do, how you will check its output and when a person takes over.",
    outputs: ["Use-case evaluation", "Knowledge integration", "Human review"],
    url: "/services/ai-agents-integration",
  },
];

export default function Home() {
  return (
    <>
      <section className="landing-hero" aria-labelledby="home-heading">
        <div className="landing-container landing-hero-grid">
          <div className="landing-hero-copy">
            <h1 id="home-heading">
              Good ideas.
              <br />
              Put to <span>work.</span>
            </h1>
            <Link
              className="landing-button landing-button-yellow"
              to="/contact"
            >
              Let’s build something <ArrowUpRight size={23} />
            </Link>
            <a className="landing-explore" href="#services">
              Find your starting point <ArrowDown size={18} />
            </a>
          </div>
          <nav className="landing-service-strip" aria-label="Our services">
            <Link to="/services/consulting">
              Consulting <ArrowUpRight size={18} />
            </Link>
            <Link to="/services/application-development">
              Software development <ArrowUpRight size={18} />
            </Link>
            <Link to="/services/ai-agents-integration">
              AI integration <ArrowUpRight size={18} />
            </Link>
            <Link to="/training">
              Team training <ArrowUpRight size={18} />
            </Link>
          </nav>
          <WorkflowComparison />
        </div>
      </section>
      <section
        className="landing-services landing-container"
        id="services"
        aria-labelledby="services-heading"
      >
        <div className="landing-services-intro">
          <h2 id="services-heading">
            Technical
            <br />
            services.
          </h2>
          <p>
            Nextgen Tech helps businesses plan, build and connect their
            technology. Start with the part that needs to work better.
          </p>
        </div>
        <div className="landing-service-list">
          {serviceEntries.map((service, index) => (
            <details
              className="landing-service-entry"
              key={service.title}
              open={index === 0}
            >
              <summary>
                <h3>{service.title}</h3>
                <span>{service.prompt}</span>
                <Plus size={24} aria-hidden="true" />
              </summary>
              <div className="landing-service-body">
                <p>{service.body}</p>
                <ul>
                  {service.outputs.map((output) => (
                    <li key={output}>
                      <Check size={16} aria-hidden="true" />
                      {output}
                    </li>
                  ))}
                </ul>
                <Link to={service.url}>
                  Explore{" "}
                  {index === 0
                    ? "consulting"
                    : index === 1
                      ? "development"
                      : "AI integration"}{" "}
                  <ArrowUpRight size={19} />
                </Link>
              </div>
            </details>
          ))}
        </div>
      </section>
      <section className="landing-training" aria-labelledby="training-heading">
        <div className="landing-container landing-training-grid">
          <div>
            <h2 id="training-heading">
              Level up
              <br />
              your people.
            </h2>
            <Link
              className="landing-button landing-button-green"
              to="/training"
            >
              Explore training courses <ArrowUpRight size={22} />
            </Link>
          </div>
          <div className="landing-training-content">
            <p>
              HRD Corp-claimable training courses that help your employees build
              practical skills and use them at work.
            </p>
            <ul>
              <li>
                <span>Upskill your team</span>
                <span>
                  Build AI and technology skills around your employees’ roles.
                </span>
              </li>
              <li>
                <span>Learn by doing</span>
                <span>
                  Hands-on exercises shaped around real workplace tasks.
                </span>
              </li>
              <li>
                <span>Plan your training</span>
                <span>
                  Discuss course suitability and HRD Corp claim requirements.
                </span>
              </li>
            </ul>
            <Link
              className="landing-underlined-link"
              to="/contact?service=ai_training"
            >
              Talk to us about your team <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section
        className="landing-approach landing-container"
        aria-labelledby="approach-heading"
      >
        <h2 id="approach-heading">
          First, we listen.
          <br />
          Then we get to work.
        </h2>
        <div className="landing-approach-copy">
          <p>
            A conversation about the problem. A scope we agree on. Checkpoints
            to see what’s working. And a handover that leaves your team knowing
            what to do next.
          </p>
          <Link className="landing-underlined-link" to="/about">
            How we work <ArrowUpRight size={19} />
          </Link>
        </div>
      </section>
      <section
        className="landing-questions landing-container"
        aria-labelledby="questions-heading"
      >
        <h2 id="questions-heading">Before you ask.</h2>
        <div>
          {[faqs[0], faqs[1], faqs[4]].map((item) => (
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
    </>
  );
}

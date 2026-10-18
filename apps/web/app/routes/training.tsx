import { Plus, ArrowDown } from "lucide-react";
import { PublicAction, PublicFAQ } from "../components/PublicUI";
import { faqs } from "../../content/services";
import { SitePhoto } from "../components/SiteImages";

export const meta = () => [
  { title: "HRD Corp-claimable team training — Nextgen Tech" },
  {
    name: "description",
    content:
      "HRD Corp-claimable training courses to help employees build practical AI and technology skills. Discuss a plan for your team.",
  },
];

export default function Training() {
  return (
    <>
      <section className="public-band public-band-yellow">
        <div className="public-wrap public-training-hero">
          <div>
            <h1>
              Level up
              <br />
              <span>your people.</span>
            </h1>
            <PublicAction to="/contact?service=ai_training">
              Plan your team’s training
            </PublicAction>
          </div>
          <div className="public-training-offer">
            <h2>
              HRD Corp-claimable
              <br />
              training courses.
            </h2>
            <p>
              Practical AI and technology skills for the people doing the work.
              Tell us their roles, experience and what you want them to be able
              to do.
            </p>
            <a className="public-text-link" href="#courses">
              Explore the courses
              <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
      <section
        className="public-wrap public-section"
        id="courses"
        aria-labelledby="course-heading"
      >
        <div className="public-section-head">
          <h2 id="course-heading">Course catalogue</h2>
          <p>Course information is being added.</p>
        </div>
        <article className="public-course">
          <div className="public-course-name">
            <h3>Placeholder</h3>
            <p>Course name</p>
          </div>
          <dl>
            <div>
              <dt>For</dt>
              <dd>Placeholder</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>Placeholder</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>Placeholder</dd>
            </div>
          </dl>
          <details>
            <summary>
              Course outline
              <Plus size={20} aria-hidden="true" />
            </summary>
            <p>Placeholder</p>
          </details>
        </article>
        <p className="public-note">
          Course names, durations and outlines are placeholders. Ask us about
          the available courses and the requirements for your team’s HRD Corp
          claim.
        </p>
      </section>
      <section className="public-band public-band-mint">
        <div className="public-wrap site-training-story">
          <SitePhoto slot="training-workshop" />
          <div>
            <h2>
              Bring the learning
              <br />
              back to work.
            </h2>
            <div>
              <p>
                Start with a task your employees actually do. Discuss the skills
                they need, practical exercises and how they will check and apply
                the results.
              </p>
              <p>
                You don’t need to share confidential documents to plan the
                training.
              </p>
              <PublicAction to="/contact?service=ai_training" secondary>
                Tell us about your team
              </PublicAction>
            </div>
          </div>
        </div>
      </section>
      <section className="public-wrap public-section public-training-plan">
        <h2>Let’s plan it together.</h2>
        <ol>
          <li>
            <h3>Understand your team</h3>
            <p>Roles, current experience and the work you want to improve.</p>
          </li>
          <li>
            <h3>Choose the learning goals</h3>
            <p>
              Discuss a suitable course, relevant exercises and delivery format.
            </p>
          </li>
          <li>
            <h3>Confirm the details</h3>
            <p>
              Agree dates, scope and course information before making
              arrangements.
            </p>
          </li>
        </ol>
        <PublicAction to="/contact?service=ai_training" secondary>
          Start a training enquiry
        </PublicAction>
      </section>
      <PublicFAQ
        items={[
          faqs[3],
          {
            q: "Can our team claim through HRD Corp?",
            a: "Our courses are registered as HRD Corp-claimable. Contact us to confirm the course details and discuss the claim requirements for your team. Submitting an enquiry does not reserve a place or guarantee a claim.",
          },
        ]}
      />
    </>
  );
}

import { Plus, ArrowDown } from "lucide-react";
import { PublicAction, PublicFAQ } from "../components/PublicUI";
import { faqs } from "../../content/services";
import { SitePhoto } from "../components/SiteImages";
import { usePublishedTrainingCourses } from "../hooks/training-courses";
import "../styles/training-courses.css";

export const meta = () => [
  { title: "HRD Corp-claimable team training — Nextgen Tech" },
  {
    name: "description",
    content:
      "HRD Corp-claimable training courses to help employees build practical AI and technology skills. Discuss a plan for your team.",
  },
];

export default function Training() {
  const { courses, loading, error, refresh } = usePublishedTrainingCourses();
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
        className="public-wrap public-section training-catalogue"
        id="courses"
        aria-labelledby="course-heading"
      >
        <div className="public-section-head">
          <h2 id="course-heading">Course catalogue</h2>
          <p>Explore practical AI skills for your team.</p>
        </div>
        {loading ? (
          <div
            className="training-catalogue-state training-catalogue-loading"
            role="status"
            aria-label="Loading course catalogue"
          >
            <p>Loading course catalogue…</p>
            <span />
            <span />
          </div>
        ) : error ? (
          <div className="training-catalogue-state" role="alert">
            <p>{error}</p>
            <button
              className="public-text-link"
              type="button"
              onClick={() => void refresh()}
            >
              Try loading again
            </button>
          </div>
        ) : courses?.length ? (
          courses.map((course) => (
            <article className="public-course" key={course.id}>
              <div className="public-course-name">
                <h3>{course.title}</h3>
                {course.summary && <p>{course.summary}</p>}
              </div>
              <dl>
                <div>
                  <dt>For</dt>
                  <dd>{course.audience}</dd>
                </div>
                <div>
                  <dt>Duration</dt>
                  <dd>{course.duration}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{course.format}</dd>
                </div>
              </dl>
              <details>
                <summary>
                  Course outline
                  <Plus size={20} aria-hidden="true" />
                </summary>
                <p className="training-course-outline">{course.outline}</p>
              </details>
              {course.isPlaceholder && (
                <p className="training-course-disclosure">
                  Course names, durations and outlines are placeholders. Ask us
                  about the available courses.
                </p>
              )}
            </article>
          ))
        ) : (
          <div className="training-catalogue-state">
            <p>
              No courses are currently published. Ask us about training for your
              team.
            </p>
          </div>
        )}
        <p className="public-note">
          Ask us about the available courses and the requirements for your
          team’s HRD Corp claim.
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

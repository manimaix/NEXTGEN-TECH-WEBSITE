import { PageIntro } from "../components/UI";
export const meta = () => [
  { title: "Website information — Nextgen Tech" },
  { name: "robots", content: "noindex" },
];
export default function Terms() {
  return (
    <>
      <PageIntro
        title="Website information"
        description="This development preview describes proposed service information, not a quotation, contract or confirmed booking."
      />
      <section className="container page-section">
        <div className="prose">
          <div className="notice">
            Public website terms and required company details remain subject to
            owner review before release.
          </div>
          <h2>Discussing an engagement</h2>
          <p>
            Submitting an enquiry does not commit you to a purchase, book a
            meeting, reserve a training place or confirm availability. Scope,
            pricing, responsibilities, delivery and support arrangements are
            agreed separately.
          </p>
          <h2>Examples and capabilities</h2>
          <p>
            Illustrative workflows contain synthetic examples and do not
            represent a live customer deployment. Training descriptions are
            areas for discussion, not claims of accreditation or certification.
          </p>
        </div>
      </section>
    </>
  );
}

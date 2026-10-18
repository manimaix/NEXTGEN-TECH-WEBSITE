import { PageIntro } from "../components/UI";
export const meta = () => [
  { title: "Privacy information — Nextgen Tech" },
  { name: "robots", content: "noindex" },
];
export default function Privacy() {
  return (
    <>
      <PageIntro
        title="Privacy information"
        description="Development notice. The final business privacy notice must be approved before this website is published."
      />
      <section className="container page-section">
        <div className="prose">
          <div className="notice">
            This is a local development system. Use synthetic information for
            testing. It is not an approved public privacy notice.
          </div>
          <h2>What the local form stores</h2>
          <p>
            The name, email, service interest and message you submit, any
            optional details, your privacy acknowledgement and marketing choice.
            A submission reference is stored so the same attempt can be retried
            without creating a duplicate enquiry.
          </p>
          <h2>Who can access it</h2>
          <p>
            The local staff workspace can view stored enquiries. Local access is
            intended only for development on this computer and must not be
            exposed as production authentication.
          </p>
          <h2>Email and optional integrations</h2>
          <p>
            No mail provider, analytics or session replay is connected in this
            build. An enquiry can be stored without an email being delivered. No
            document attachments are accepted.
          </p>
          <h2>Before public use</h2>
          <p>
            The business must approve its contact method, processing purposes,
            service providers, retention and deletion procedures, access
            arrangements and final privacy wording. Do not submit credentials,
            personal records or confidential project material.
          </p>
        </div>
      </section>
    </>
  );
}

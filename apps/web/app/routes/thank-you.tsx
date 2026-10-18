import { useEffect, useState } from "react";
import { PageIntro, CTA } from "../components/UI";
export const meta = () => [
  { title: "Enquiry acknowledgement — Nextgen Tech" },
  { name: "robots", content: "noindex" },
];
export default function ThankYou() {
  const [reference, setReference] = useState<string | null>(null);
  useEffect(
    () => setReference(sessionStorage.getItem("ng-received-reference")),
    [],
  );
  return (
    <div className="success-page">
      <PageIntro
        title={
          reference ? "Your enquiry is recorded." : "Let’s find your next step."
        }
        description={
          reference
            ? "Keep this reference for your enquiry. No email delivery or meeting booking is implied. This local preview stores the enquiry on this computer."
            : "If you have a project or training question, tell us what you want to improve."
        }
      >
        {reference && (
          <div className="success-reference">
            Reference: <strong>{reference}</strong>
          </div>
        )}
        <div>
          <CTA to={reference ? "/services" : "/contact"}>
            {reference ? "Explore our services" : "Discuss your project"}
          </CTA>
        </div>
      </PageIntro>
    </div>
  );
}

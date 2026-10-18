import { PageIntro, CTA } from "../components/UI";
export const meta = () => [
  { title: "Page not found — Nextgen Tech" },
  { name: "robots", content: "noindex" },
];
export default function NotFound() {
  return (
    <div className="success-page">
      <PageIntro
        title="This page isn’t here."
        description="The link may have changed. Our services are a useful place to start."
      >
        <CTA to="/services">Explore our services</CTA>
      </PageIntro>
    </div>
  );
}

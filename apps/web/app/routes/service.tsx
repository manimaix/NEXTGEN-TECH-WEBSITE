import { useParams } from "react-router";
import { services } from "../../content/services";
import { ServicePage } from "../components/ServicePage";
import NotFound from "./not-found";
export const meta = ({ params }: { params: { slug?: string } }) => {
  const s = services.find((s) => s.slug === params.slug);
  return [
    { title: `${s?.title ?? "Page not found"} — Nextgen Tech` },
    {
      name: "description",
      content: s?.description ?? "Explore Nextgen Tech services.",
    },
  ];
};
export default function Service() {
  const { slug } = useParams();
  const service = services.find(
    (s) => s.slug === slug && s.id !== "ai_training",
  );
  return service ? <ServicePage service={service} /> : <NotFound />;
}

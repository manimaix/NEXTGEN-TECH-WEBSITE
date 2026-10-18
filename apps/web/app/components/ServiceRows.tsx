import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";
import { services, servicePath } from "../../content/services";
export function ServiceRows() {
  return (
    <div className="service-rows">
      {services.map((s) => (
        <Link className="service-row" key={s.id} to={servicePath(s)}>
          <span className="service-number">{s.number}</span>
          <h3>{s.title}</h3>
          <p>{s.output}</p>
          <span className="service-arrow">
            <ArrowUpRight size={25} />
          </span>
        </Link>
      ))}
    </div>
  );
}

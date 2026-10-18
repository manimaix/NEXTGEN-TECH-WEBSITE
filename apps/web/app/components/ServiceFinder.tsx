import { useState } from "react";
import { ArrowUpRight, Check, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { services, contactPath, servicePath } from "../../content/services";
import styles from "./ServiceFinder.module.css";
export function ServiceFinder() {
  const [selected, setSelected] = useState(0);
  const service = services[selected];
  return (
    <div className={styles.finder}>
      <div className={styles.heading}>
        <h2>Where do we start?</h2>
        <span>
          Find your fit
          <ArrowUpRight size={15} />
        </span>
      </div>
      <fieldset className={styles.options}>
        <legend className="sr-only">What would you like help with?</legend>
        {services.map((s, i) => (
          <label
            key={s.id}
            className={`${styles.option} ${i === selected ? styles.selected : ""}`}
          >
            <input
              type="radio"
              name="service-finder"
              value={s.id}
              checked={i === selected}
              onChange={() => setSelected(i)}
            />
            <span className={styles.index}>{s.number}</span>
            <span>{s.need}</span>
            <span className={styles.marker}>
              {i === selected ? (
                <Check size={14} />
              ) : (
                <ArrowUpRight size={16} />
              )}
            </span>
          </label>
        ))}
      </fieldset>
      <div className={styles.result}>
        <h3>{service.title}</h3>
        <p>{service.output}</p>
        <Link to={contactPath(service.id)}>
          Let’s talk about it
          <ArrowRight size={17} />
        </Link>
      </div>
      <div className={styles.bottom}>
        Still exploring? <Link to="/services">Compare the services</Link>
      </div>
      <noscript>
        <p>Explore a service:</p>
        {services.map((s) => (
          <a key={s.id} href={servicePath(s)}>
            {s.title}{" "}
          </a>
        ))}
      </noscript>
    </div>
  );
}

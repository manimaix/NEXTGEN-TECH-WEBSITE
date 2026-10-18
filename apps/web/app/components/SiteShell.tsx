import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ArrowUpRight, Menu, X, ChevronDown } from "lucide-react";
import { services, servicePath } from "../../content/services";
export function Wordmark() {
  return (
    <span className="wordmark">
      <span>
        nextgen<span className="wordmark-light"> tech</span>
      </span>
    </span>
  );
}
export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const dropdown = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    setMenu(false);
    if (dropdown.current) dropdown.current.open = false;
  }, [location.pathname]);
  useEffect(() => {
    if (menu) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menu]);
  const close = () => {
    setMenu(false);
    trigger.current?.focus();
  };
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" aria-label="Nextgen Tech home">
          <Wordmark />
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <details
            ref={dropdown}
            className="nav-dropdown"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.open = false;
                e.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary>
              Services
              <ChevronDown size={14} />
            </summary>
            <div className="nav-dropdown-panel">
              {services.map((s) => (
                <Link key={s.id} to={servicePath(s)}>
                  {s.title}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
              <Link to="/services">
                Explore all services
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </details>
          <NavLink to="/training">Training</NavLink>
          <NavLink to="/about">About</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <Link className="header-cta" to="/contact">
          Discuss your project
          <ArrowUpRight size={16} />
        </Link>
        <button
          className="icon-button mobile-toggle"
          ref={trigger}
          aria-label="Open menu"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <Menu size={23} />
        </button>
      </div>
      <div className="local-nav">
        <div className="container local-nav-inner">
          <Link to="/">Nextgen Tech</Link>
          <span>Technology for what comes next.</span>
          <Link className="local-nav-action" to="/contact">
            Let’s talk
          </Link>
        </div>
      </div>
      <dialog
        className="mobile-dialog"
        ref={dialog}
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="mobile-dialog-head">
          <Wordmark />
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>
        <nav aria-label="Mobile navigation">
          {[
            ["Home", "/"],
            ["Services", "/services"],
            ["Training", "/training"],
            ["About", "/about"],
            ["Contact", "/contact"],
          ].map(([label, url]) => (
            <Link key={url} to={url} onClick={close}>
              {label}
              <ArrowUpRight />
            </Link>
          ))}
        </nav>
        <p>Consulting. Applications. AI. Training.</p>
      </dialog>
    </header>
  );
}
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link to="/" aria-label="Nextgen Tech home">
              <Wordmark />
            </Link>
            <p>
              Practical technology.
              <br />
              Thoughtfully put to work.
            </p>
            <span className="legal-company">Nextgen Tech Sdn Bhd</span>
          </div>
          <div className="footer-links">
            <h3>What we do</h3>
            {services.map((s) => (
              <Link key={s.id} to={servicePath(s)}>
                {s.title}
              </Link>
            ))}
          </div>
          <div className="footer-links">
            <h3>Let’s connect</h3>
            <Link to="/contact">
              Discuss your project <ArrowUpRight size={15} />
            </Link>
            <Link to="/about">About Nextgen Tech</Link>
            <Link to="/training">Enquire about training</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Nextgen Tech Sdn Bhd</span>
          <div>
            <Link to="/privacy">Privacy information</Link>
            <Link to="/terms">Website information</Link>
            <Link to="/admin">Staff workspace</Link>
          </div>
          <span className="preview-tag">Local development preview</span>
        </div>
      </div>
    </footer>
  );
}

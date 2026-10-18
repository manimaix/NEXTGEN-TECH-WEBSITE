import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ArrowUpRight, ArrowRight, Menu, Plus } from "lucide-react";

export function LandingWordmark() {
  return (
    <span className="landing-wordmark">
      nextgen<span>tech</span>
      <span className="landing-mark" aria-hidden="true">
        <ArrowUpRight size={23} strokeWidth={2.4} />
      </span>
    </span>
  );
}
export function LandingHeader() {
  const menu = useRef<HTMLDetailsElement>(null);
  const { pathname } = useLocation();
  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);
  return (
    <header className="landing-header">
      <div className="landing-container landing-header-inner">
        <Link to="/" aria-label="Nextgen Tech home">
          <LandingWordmark />
        </Link>
        <nav className="landing-desktop-nav" aria-label="Main navigation">
          <NavLink to="/services">What we do</NavLink>
          <NavLink to="/training">Team training</NavLink>
          <NavLink to="/about">About us</NavLink>
        </nav>
        <NavLink className="landing-header-contact" to="/contact">
          Let’s talk <ArrowUpRight size={18} />
        </NavLink>
        <details
          className="landing-mobile-menu"
          ref={menu}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary aria-label="Navigation menu">
            <Menu size={24} />
          </summary>
          <nav
            aria-label="Mobile navigation"
            onClick={() => {
              if (menu.current) menu.current.open = false;
            }}
          >
            <NavLink to="/services">What we do</NavLink>
            <NavLink to="/training">Team training</NavLink>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/contact">
              Let’s talk <ArrowUpRight size={18} />
            </NavLink>
          </nav>
        </details>
      </div>
    </header>
  );
}
export function LandingFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        {!compact && (
          <div className="landing-close">
            <h2>
              What do you
              <br />
              have in mind?
            </h2>
            <Link
              className="landing-button landing-button-yellow"
              to="/contact"
            >
              Tell us about it <ArrowUpRight size={23} />
            </Link>
          </div>
        )}
        <div className="landing-footer-middle">
          <Link to="/" aria-label="Nextgen Tech home">
            <LandingWordmark />
          </Link>
          <nav aria-label="Footer navigation">
            <Link to="/services">
              Services <ArrowRight size={16} />
            </Link>
            <Link to="/training">
              Training <ArrowRight size={16} />
            </Link>
            <Link to="/about">
              About <ArrowRight size={16} />
            </Link>
          </nav>
          <Plus
            className="landing-footer-plus"
            size={52}
            strokeWidth={1.2}
            aria-hidden="true"
          />
        </div>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} Nextgen Tech Sdn Bhd</span>
          <nav aria-label="Legal and staff links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Website information</Link>
            <Link to="/admin">Staff workspace</Link>
          </nav>
          <span>Local preview</span>
        </div>
      </div>
    </footer>
  );
}

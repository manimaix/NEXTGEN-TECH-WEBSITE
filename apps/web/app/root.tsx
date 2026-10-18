import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import type { ReactNode } from "react";
import { LandingHeader, LandingFooter } from "./components/LandingShell";
import { SiteImagesProvider } from "./components/SiteImages";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/apple.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-600.css";
import "./styles/landing.css";
import "./styles/workflow-comparison.css";
import "./styles/public-pages.css";
import "./styles/site-images.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <link
          rel="icon"
          type="image/svg+xml"
          href={`${import.meta.env.BASE_URL}favicon.svg`}
        />
        <meta name="robots" content="noindex, nofollow" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function App() {
  const location = useLocation();
  const admin = location.pathname.startsWith("/admin");
  const landing = location.pathname === "/";
  return (
    <div
      className={
        admin ? undefined : `landing-world${landing ? "" : " public-world"}`
      }
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      {!admin && <LandingHeader />}
      <main id="main" tabIndex={-1}>
        <SiteImagesProvider>
          <Outlet />
        </SiteImagesProvider>
      </main>
      {!admin && (
        <LandingFooter
          compact={["/contact", "/thank-you", "/privacy", "/terms"].includes(
            location.pathname,
          )}
        />
      )}
    </div>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div className="container page-intro">
      <h1>
        {isRouteErrorResponse(error) && error.status === 404
          ? "This page isn’t here."
          : "Something didn’t load."}
      </h1>
      <p>
        Your submitted enquiry may still have been received. Return to the form
        to retry the same attempt, or explore our services.
      </p>
      <a className="button" href={import.meta.env.BASE_URL}>
        Back to home
      </a>
    </div>
  );
}

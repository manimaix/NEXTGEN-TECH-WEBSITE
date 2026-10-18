---
version: "1.0-proposed"
product: "Nextgen Tech Sdn Bhd"
colors:
  canvas: "#F4F3EF"
  surface: "#FFFFFF"
  text: "#22212B"
  textMuted: "#605E69"
  action: "#5145CD"
  actionHover: "#4036A8"
  onAction: "#FFFFFF"
  actionSoft: "#EEEBFF"
  border: "#D8D5E0"
  controlBorder: "#777380"
  success: "#216344"
  danger: "#B42318"
  inverse: "#252334"
  onInverse: "#FFFFFF"
typography:
  family: "Manrope, system-ui, sans-serif"
  technicalFamily: "DM Mono, monospace"
  weights: [400, 500, 600, 700]
  bodyPx: [16, 18]
  bodyLineHeight: 1.6
  heroPhonePx: [36, 46]
  heroDesktopPx: [56, 76]
  headingPx: [28, 44]
spacingPx: [4, 8, 12, 16, 24, 32, 48, 64, 80, 112]
radiiPx:
  control: 8
  panel: 12
layout:
  maxContentPx: 1200
  heroMaxPx: 1280
  phoneGutterPx: 20
  tabletGutterPx: 24
  desktopGutterPx: 48
  navigationCollapsePx: 1024
motion:
  pressMs: 120
  panelMs: 160
  menuMs: 200
  easing: "cubic-bezier(0.23, 1, 0.32, 1)"
---

# Nextgen Tech visual contract

Proposed baseline for the new website, not proof of a completed design. This supersedes conflicting root draft values **for this product only**. Implement in `apps/web/app/styles/tokens.css`; read the [frontend handoff](engineering/02-FRONTEND-REACT-PRERENDER.md).

## Visual idea

Warm editorial technology: precise typography, quiet paper-coloured surfaces, violet actions, and specific service explanations. The business and its work should carry the page, not a generic SaaS dashboard or glowing AI illustration. Marketing pages persuade; service/article prose supports reading; staff screens support operations.

Home first viewport: clear company identification and headline, concise four-service summary, one main “Discuss your project” action, secondary service link, and a useful four-option service finder. Desktop uses a 7/5-column opening; mobile stacks headline/action before the finder. No empty full-height hero.

Services are four numbered editorial rows, not interchangeable icon cards. Process is a readable sequence; work is a real permission-approved image or an explicitly labelled illustrative example. Use an inverse band sparingly, with verified contrast, not an entirely black website.

## Foundations

- Manrope for headings/body/UI; weights 400–700. DM Mono only for actual technical labels. Self-host licensed WOFF2, use swap/fallback and reserve space to reduce shifts.
- Hero 36–46px phone, 56–76px desktop, line-height 1.08–1.15, tracking around -0.035em. Body 16–18px/1.6; labels 14–16px. Paragraph width 55–75 characters. No -0.09em body/headline tracking copied from the prototype.
- Shared 1200px max content; hero may reach 1280px. Gutters 20px phone, 24px tablet, 48px wide desktop. At/below 1023px collapse navigation; also collapse earlier if actual labels no longer fit.
- Section spacing 48–64px mobile, 80–112px desktop. Cards only when a boundary helps. Controls radius 8px; panels 12px. No pill-everything, arbitrary radius families, glassmorphism, decorative gradients, or stacked shadows.
- Use control-border for inputs; subtle border only for nonessential divisions. Main action is white text on violet. Inline links underlined. Focus is a visible 3px ring plus offset; use a contrasting light ring on inverse surfaces.

## Components and states

| Component | Specification |
| --- | --- |
| SiteHeader | Text wordmark until approved logo; real service links; desktop dropdown and mobile menu accessible; no fake contact/social destination |
| PrimaryButton/TextLink | One dominant CTA per section; default/hover/focus/active/disabled/pending; native link for navigation and button for actions |
| ServiceFinder | Four labelled choices; selected need/deliverable/CTA; keyboard immediate; ordinary service links still work without JS |
| ServiceRow | Number, service name, business problem, agreed possible outputs, detail link; natural wrapping |
| ProcessSteps | Client input and output per step; not a claim every contract includes every stage |
| EvidenceCaption | “Illustrative example” or approved project status; no implied client/production success |
| FAQDisclosure | Button with expanded state; keyboard-operable; answers readable with progressive enhancement |
| ContactForm | Persistent labels and help; conditional fields only when relevant; error summary focuses first invalid field |
| EnquirySuccess | Shows backend reference and “received”; does not promise delivered email, booked meeting, reserved training place, or response SLA |
| StatusNotice | Idle/pending/error/offline/uncertain/received; retain entered values on recoverable failures; no success-coloured state before durable acknowledgement |

Phone form is single-column. Desktop may pair short optional fields, never split a long description. Inputs at least 16px; touch targets preferably 44px or more. Mobile menu traps/restores focus, closes on Escape and route selection, and does not conceal the focused element behind sticky chrome.

## Motion and media

Optional pointer press 0.98/120ms; finder panel opacity 140–180ms; menu transform/opacity 160–220ms from its trigger. Frequent/keyboard actions are immediate. Use explicit transition properties. Reduced-motion removes translation/scaling and decorative effects. Content must remain readable without JS; do not delay hydration with an intro animation.

Approved real work screenshots and founder/team photographs only with permission and sanitisation. Label diagrams/demos as illustrative. Do not use humanoid robots, invented dashboards with live counters, unverified partner logos, or stock people implying they are staff. No text burned into images. Declare image dimensions and meaningful alt text; decorative imagery has empty alt.

## Acceptance and governance

Check 390, 768, 1024 and 1440px plus 320px reflow and 200% zoom; confirm long service labels and BM sample text. Test keyboard/menu/finder/form paths, reduced motion, contrast, screen-reader errors, JS-disabled reading, and missing content. WCAG 2.2 AA is a target, not an achieved certification.

Maintain tokens, components, this document, and visual evidence in the same change. The Apple reference contributes a documentation approach and disciplined hierarchy, not copied brand assets or omitted interaction states.

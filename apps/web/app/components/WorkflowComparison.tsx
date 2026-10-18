import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, Mail, UserRound } from "lucide-react";

const steps = [
  {
    task: "Read the enquiry",
    owner: "ai",
    title: "AI identifies the request",
    detail:
      "An address-change enquiry is identified and routed to the right workflow. Without AI, a person reads and categorises it.",
    result: "Request: change delivery address",
  },
  {
    task: "Find the policy",
    owner: "ai",
    title: "AI finds approved information",
    detail:
      "AI retrieves the relevant passage from your approved delivery policy. Your team can see the source, not just an answer.",
    result: "Source: delivery policy · address changes",
  },
  {
    task: "Draft the reply",
    owner: "ai",
    title: "AI prepares a reply for review",
    detail:
      "“Hi Alex, we’ll check whether your order has been dispatched before confirming an address change.”",
    result: "Draft only · not sent",
  },
  {
    task: "Check the details",
    owner: "human",
    title: "A person checks what AI cannot assume",
    detail:
      "Your team verifies the actual dispatch status, checks the policy and handles anything unusual. They can edit or reject the draft.",
    result: "Human judgment · facts and exceptions",
  },
  {
    task: "Approve & send",
    owner: "human",
    title: "A person makes the final call",
    detail:
      "Your team approves the wording and sends the reply through its support tool. AI has done the preparation, not made the decision.",
    result: "Your team stays accountable",
  },
] as const;

function Owner({ ai = false }: { ai?: boolean }) {
  return (
    <span className={`work-owner ${ai ? "work-owner-ai" : "work-owner-human"}`}>
      {ai ? (
        <Bot size={16} aria-hidden="true" />
      ) : (
        <UserRound size={16} aria-hidden="true" />
      )}
      {ai ? "AI" : "Person"}
    </span>
  );
}

export function WorkflowComparison() {
  const [active, setActive] = useState(2);
  const [pointerMotion, setPointerMotion] = useState(false);
  const rowButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const selected = steps[active];

  const select = (index: number, pointer = false) => {
    setPointerMotion(pointer);
    setActive(Math.max(0, Math.min(steps.length - 1, index)));
  };

  return (
    <section
      className="landing-example work-demo"
      aria-labelledby="work-demo-heading"
    >
      <h2 id="work-demo-heading">
        AI does the groundwork.
        <br />
        <span>People make the call.</span>
      </h2>
      <div className="work-example">
        <div className="work-enquiry">
          <Mail size={18} aria-hidden="true" />
          <p>“Can I change my delivery address?”</p>
        </div>
        <table className="work-ownership">
          <caption className="work-sr-only">
            Who does each task, without AI and with AI assistance. Select a task
            to inspect the example.
          </caption>
          <thead>
            <tr>
              <th scope="col">The work</th>
              <th scope="col">Without AI</th>
              <th scope="col">With AI</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step, index) => (
              <tr key={step.task} data-active={active === index || undefined}>
                <th scope="row">
                  <button
                    ref={(element) => {
                      rowButtons.current[index] = element;
                    }}
                    aria-pressed={active === index}
                    aria-controls="work-detail"
                    aria-label={`Step ${index + 1}: ${step.task}`}
                    onClick={(event) => select(index, event.detail > 0)}
                    onKeyDown={(event) => {
                      const next =
                        event.key === "ArrowDown" || event.key === "ArrowRight"
                          ? Math.min(steps.length - 1, index + 1)
                          : event.key === "ArrowUp" || event.key === "ArrowLeft"
                            ? Math.max(0, index - 1)
                            : event.key === "Home"
                              ? 0
                              : event.key === "End"
                                ? steps.length - 1
                                : null;
                      if (next !== null) {
                        event.preventDefault();
                        select(next);
                        rowButtons.current[next]?.focus({
                          preventScroll: true,
                        });
                      }
                    }}
                  >
                    <span className="work-step-number">{index + 1}</span>
                    <span>{step.task}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </th>
                <td>
                  <Owner />
                </td>
                <td>
                  <Owner ai={step.owner === "ai"} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          className="work-detail"
          id="work-detail"
          role="region"
          aria-labelledby="work-detail-title"
          aria-live="polite"
          aria-atomic="true"
          onPointerDown={(event) => {
            if (
              event.pointerType !== "touch" ||
              !event.isPrimary ||
              touch.current
            )
              return;
            touch.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            };
          }}
          onPointerUp={(event) => {
            if (touch.current?.id !== event.pointerId) return;
            const dx = event.clientX - touch.current.x,
              dy = event.clientY - touch.current.y;
            if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy))
              select(active + (dx < 0 ? 1 : -1), true);
            touch.current = null;
          }}
          onPointerCancel={() => {
            touch.current = null;
          }}
        >
          <div
            className="work-detail-content"
            key={active}
            data-motion={pointerMotion || undefined}
          >
            <div className="work-detail-top">
              <h3 id="work-detail-title">{selected.title}</h3>
              <span>{active + 1} / 5</span>
            </div>
            <p>{selected.detail}</p>
            <span className="work-result">{selected.result}</span>
          </div>
        </div>
        <div className="work-controls">
          <button
            aria-label="Previous step"
            disabled={active === 0}
            onClick={(event) => select(active - 1, event.detail > 0)}
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <span>Explore each step</span>
          <button
            onClick={(event) =>
              select(active === 4 ? 0 : active + 1, event.detail > 0)
            }
          >
            {active === 2
              ? "See the human check"
              : active === 4
                ? "Back to the request"
                : "Next step"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="work-disclaimer">
        Illustrative workflow. No live AI, order lookup or email.
      </p>
    </section>
  );
}

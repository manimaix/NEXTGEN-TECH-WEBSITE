import { useState } from "react";
import { FileText, ShieldCheck, Check, ArrowRight } from "lucide-react";
const examples = [
  {
    name: "Support triage",
    input: "A customer asks about a delivery change.",
    draft: "Find the relevant policy and draft a suggested response.",
    review: "Your team checks the context and approves the reply.",
  },
  {
    name: "Knowledge retrieval",
    input: "A colleague needs the current onboarding procedure.",
    draft: "Retrieve relevant passages from approved internal documents.",
    review: "Show the sources. Ask a person when information is missing.",
  },
  {
    name: "Document processing",
    input: "A sample supplier document needs a first review.",
    draft: "Extract the requested fields and highlight uncertain values.",
    review: "A person checks the result before any system is updated.",
  },
];
export function WorkflowDemo() {
  const [choice, setChoice] = useState(0);
  const item = examples[choice];
  return (
    <div className="workflow-demo">
      <div
        className="workflow-tabs"
        role="tablist"
        aria-label="Illustrative AI use cases"
      >
        {examples.map((e, i) => (
          <button
            id={`workflow-tab-${i}`}
            aria-controls="workflow-panel"
            type="button"
            role="tab"
            aria-selected={i === choice}
            tabIndex={i === choice ? 0 : -1}
            onClick={() => setChoice(i)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const next =
                  (choice + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                setChoice(next);
                document.getElementById(`workflow-tab-${next}`)?.focus();
              }
            }}
            key={e.name}
          >
            {e.name}
          </button>
        ))}
      </div>
      <div
        id="workflow-panel"
        role="tabpanel"
        aria-labelledby={`workflow-tab-${choice}`}
        className="workflow-panel"
      >
        <div className="workflow-step">
          <FileText size={20} />
          <div>
            <span>Input</span>
            <p>{item.input}</p>
          </div>
        </div>
        <ArrowRight className="workflow-connector" size={18} />
        <div className="workflow-step">
          <span className="ai-glyph" aria-hidden="true">
            AI
          </span>
          <div>
            <span>Bounded assistance</span>
            <p>{item.draft}</p>
          </div>
        </div>
        <ArrowRight className="workflow-connector" size={18} />
        <div className="workflow-step review-step">
          <ShieldCheck size={22} />
          <div>
            <span>Human review</span>
            <p>{item.review}</p>
          </div>
          <Check size={16} />
        </div>
      </div>
      <p className="demo-caption">
        Illustrative workflow · Synthetic example · No live AI connection
      </p>
    </div>
  );
}

export const company = {
  name: "Nextgen Tech Sdn Bhd",
  domain: null,
  email: null,
  phone: null,
  contentApproved: false,
  privacyApproved: false,
};
export const services = [
  {
    id: "consulting",
    slug: "consulting",
    number: "01",
    short: "Consulting",
    title: "Technology consulting",
    need: "I need a clear technology plan",
    output: "A considered starting point, before you commit to a build.",
    headline: "The right direction. Before the first line of code.",
    description:
      "Turn a business challenge into a clear technology decision. Understand what needs to change, what can stay, and where to start.",
    problem:
      "Disconnected systems. Repetitive work. A promising idea without a clear scope. Start by understanding the problem, not by choosing another tool.",
    deliverables: [
      "Workflow and systems assessment",
      "Prioritised options and trade-offs",
      "A practical implementation roadmap",
    ],
    inputs: [
      "Your current workflow and systems",
      "The people involved in the process",
      "Constraints, priorities and decisions ahead",
    ],
    audience: "For teams deciding what to build, improve or connect.",
  },
  {
    id: "application_development",
    slug: "application-development",
    number: "02",
    short: "Development",
    title: "Application development",
    need: "I want to build an application",
    output: "A defined workflow, brought to life in useful software.",
    headline: "Software shaped around the way you work.",
    description:
      "From a first product idea to a better internal workflow, build an application with a clear purpose and a path to a maintainable release.",
    problem:
      "An application should make the work easier. Define the essential user journey, test the approach, then build and improve in manageable steps.",
    deliverables: [
      "Requirements and user experience flows",
      "Application and API implementation",
      "Testing, deployment and handover documentation",
    ],
    inputs: [
      "The people who will use the application",
      "Essential workflows and existing integrations",
      "Release priorities and ownership expectations",
    ],
    audience:
      "For businesses turning an idea or manual process into an application.",
  },
  {
    id: "ai_agents_integration",
    slug: "ai-agents-integration",
    number: "03",
    short: "AI integration",
    title: "AI agents & integration",
    need: "I want AI to help with a workflow",
    output: "A focused use case, with the right controls and human oversight.",
    headline: "Put AI to work. Keep people in control.",
    description:
      "Connect AI to a defined workflow, approved information and permitted tools. Make its responsibilities—and its limits—clear from the start.",
    problem:
      "The useful question is not whether AI can do everything. It is where it can help your team, what it needs to know, and when a person should step in.",
    deliverables: [
      "A scoped workflow and evaluation cases",
      "Permission-aware knowledge and tool integration",
      "Monitoring, fallback and operational handover",
    ],
    inputs: [
      "A specific workflow to improve",
      "Approved data sources and system access boundaries",
      "Examples of good outputs and unacceptable failures",
    ],
    audience: "For teams exploring a practical, bounded use of AI.",
  },
  {
    id: "ai_training",
    slug: "training",
    number: "04",
    short: "Training",
    title: "AI training",
    need: "I want my team to use AI well",
    output:
      "Practical learning, connected to the work your team actually does.",
    headline: "Build confidence. Not just a collection of prompts.",
    description:
      "Help your team understand where AI is useful, how to evaluate its output, and how to apply it thoughtfully in day-to-day work.",
    problem:
      "New tools are only useful when people know how to use them. Start with your team’s roles, current experience and the outcomes you want to develop.",
    deliverables: [
      "Learning goals aligned to team roles",
      "Guided exercises and output-verification practice",
      "An agreed training format and follow-up resources",
    ],
    inputs: [
      "Participant roles and experience",
      "Topics and practical tasks to explore",
      "Team size, preferred format and timing",
    ],
    audience: "For business users, team leads and development teams.",
  },
] as const;
export type ServiceItem = (typeof services)[number];
export const servicePath = (s: ServiceItem) =>
  s.id === "ai_training" ? "/training" : `/services/${s.slug}`;
export const contactPath = (id: string) => `/contact?service=${id}`;
export const process = [
  {
    title: "Understand the work",
    text: "Talk through the problem, the people involved and what a useful outcome looks like.",
  },
  {
    title: "Define a clear scope",
    text: "Agree priorities, deliverables, dependencies and the boundaries of the engagement.",
  },
  {
    title: "Build, connect or teach",
    text: "Work through the agreed scope with checkpoints to review and refine the approach.",
  },
  {
    title: "Test it in context",
    text: "Check the result against real workflows, including the moments when things go wrong.",
  },
  {
    title: "Make the handover count",
    text: "Discuss documentation, ownership, training and the support arrangements your team needs.",
  },
];
export const faqs = [
  {
    q: "I know the problem, but not the solution. Where do I start?",
    a: "Start with a conversation about the work you want to improve. Select “Help me find the right starting point” in the enquiry form. You do not need a technical specification to get in touch.",
  },
  {
    q: "Can we work with systems we already use?",
    a: "Include your current systems in the enquiry. Integration options depend on their available interfaces, access controls and the changes you need. These are assessed before agreeing a scope.",
  },
  {
    q: "Does an AI agent make decisions without a person?",
    a: "That depends on the agreed workflow. Consequential actions need explicit permission and appropriate review. A useful starting point is a narrow task with clear evaluation criteria and a human fallback.",
  },
  {
    q: "Can training be tailored to our team?",
    a: "Tell us the participant roles, current experience and topics you want to explore. Format, exercises and learning outcomes can then be discussed around those needs.",
  },
  {
    q: "What happens after I send an enquiry?",
    a: "Your enquiry is recorded with a reference. Project scope, availability, delivery arrangements and next steps are discussed separately. Sending the form does not book a meeting or commit you to a purchase.",
  },
];

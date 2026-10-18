import { company, services } from "../apps/web/content/services";
import assert from "node:assert/strict";
assert.equal(services.length, 4);
assert.equal(new Set(services.map((s) => s.id)).size, 4);
for (const s of services) {
  assert.ok(s.title && s.headline && s.description);
  assert.ok(s.deliverables.length && s.inputs.length);
}
if (process.argv.includes("--release")) {
  const missing = Object.entries(company)
    .filter(
      ([k, v]) =>
        ["domain", "email", "contentApproved", "privacyApproved"].includes(k) &&
        !v,
    )
    .map(([k]) => k);
  if (missing.length) {
    console.error(
      `Release blocked — owner approval/configuration needed: ${missing.join(", ")}. Staff identity and email integration also require verification.`,
    );
    process.exit(1);
  }
}
console.log(
  "Four service content models validated. Public release is not approved.",
);

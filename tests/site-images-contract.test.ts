import { test } from "node:test";
import assert from "node:assert/strict";
import {
  defaultImage,
  imageSlots,
  imageSlotSchema,
  imageUpdateSchema,
  maxImageBytes,
  serviceImageSlots,
} from "../packages/contracts/src/site-images";

test("service images use editable slots and training keeps its workshop placement", () => {
  assert.deepEqual(serviceImageSlots, {
    consulting: "service-consulting",
    application_development: "service-development",
    ai_agents_integration: "service-integration",
    ai_training: "training-workshop",
  });
  for (const id of Object.values(serviceImageSlots)) {
    assert.equal(imageSlotSchema.parse(id), id);
    const slot = imageSlots.find((item) => item.id === id)!;
    const image = defaultImage(id);
    assert.equal(image.src, slot.placeholder.src);
    assert.equal(image.width, slot.placeholder.width);
    assert.equal(image.height, slot.placeholder.height);
    assert.equal(image.isPlaceholder, true);
    assert.equal(image.uploaded, false);
    assert.equal(image.version, 0);
    assert.equal(image.name, "");
    assert.equal(image.role, "");
    assert.match(image.alt, /AI-generated/);
  }
});

const update = (base64: string) => ({
  alt: "Synthetic validation fixture",
  caption: "",
  name: "",
  role: "",
  focalX: 50,
  focalY: 50,
  isPlaceholder: false,
  expectedVersion: 0,
  image: { type: "image/png", base64 },
});

test("base64 validation accepts the full 5 MB limit without exhausting the regexp stack", () => {
  const base64 = Buffer.alloc(maxImageBytes).toString("base64");
  assert.equal(imageUpdateSchema.safeParse(update(base64)).success, true);
  assert.equal(
    imageUpdateSchema.safeParse(update(base64 + "AAAA")).success,
    false,
  );
  assert.equal(
    imageUpdateSchema.safeParse(update(base64.slice(0, -1) + "!")).success,
    false,
  );
});

test("base64 validation keeps padding, alphabet and length checks", () => {
  for (const base64 of ["YQ==", "YWI=", "YWJj", "+/8="]) {
    assert.equal(imageUpdateSchema.safeParse(update(base64)).success, true);
  }
  for (const base64 of [
    "",
    "YQ",
    "YQ=",
    "YQ===",
    "Y=Q=",
    "====",
    "YWJj\n",
    "AAA\n",
    "AA\r\n",
    "YW Jj",
    "-_8=",
    "data:image/png;base64,YQ==",
  ]) {
    assert.equal(
      imageUpdateSchema.safeParse(update(base64)).success,
      false,
      JSON.stringify(base64),
    );
  }
});

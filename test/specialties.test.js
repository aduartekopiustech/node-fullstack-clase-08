import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createSpecialty,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const SPECIALTY_KEYS = ["id", "name"];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

describe("Specialties API", () => {
  it("GET /api/specialties returns catalog ordered by id ascending", async () => {
    const first = await createSpecialty("Cardiología");
    const second = await createSpecialty("Pediatría");

    const res = await request.get("/api/specialties");

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, [
      { id: first.id, name: "Cardiología" },
      { id: second.id, name: "Pediatría" },
    ]);
    for (const item of res.body.data) {
      assert.deepEqual(Object.keys(item), SPECIALTY_KEYS);
    }
  });

  it("GET /api/specialties/:id returns existing specialty", async () => {
    const specialty = await createSpecialty("Traumatología");

    const res = await request.get(`/api/specialties/${specialty.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.data), SPECIALTY_KEYS);
    assert.deepEqual(res.body.data, {
      id: specialty.id,
      name: "Traumatología",
    });
  });

  it("GET /api/specialties/:id returns 404 SPECIALTY_NOT_FOUND when missing", async () => {
    const res = await request.get("/api/specialties/999999");

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "SPECIALTY_NOT_FOUND");
  });

  it("GET /api/specialties/abc returns 400 INVALID_ID", async () => {
    const res = await request.get("/api/specialties/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(
      res.body.error.message,
      "Specialty id must be a positive integer",
    );
  });
});

import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createNurse,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const NURSE_KEYS = ["id", "firstName", "lastName", "licenseNumber"];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

describe("Nurses API", () => {
  it("POST /api/nurses creates nurse with Location header and clean DTO shape", async () => {
    const res = await request.post("/api/nurses").send({
      firstName: "Florence",
      lastName: "Nightingale",
      licenseNumber: "EN-30100",
    });

    assert.equal(res.status, 201);
    assert.match(res.headers.location, /^\/api\/nurses\/\d+$/);
    assert.deepEqual(Object.keys(res.body.data), NURSE_KEYS);
    assert.equal(res.body.data.firstName, "Florence");
    assert.equal(res.body.data.licenseNumber, "EN-30100");
  });

  it("GET /api/nurses/:id returns existing nurse", async () => {
    const nurse = await createNurse();

    const res = await request.get(`/api/nurses/${nurse.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.data), NURSE_KEYS);
    assert.deepEqual(res.body.data, nurse);
  });

  it("GET /api/nurses returns nurses ordered by id ascending", async () => {
    const first = await createNurse({ firstName: "Sofia" });
    const second = await createNurse({ firstName: "Mateo" });

    const res = await request.get("/api/nurses");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [first.id, second.id],
    );
  });

  it("PATCH /api/nurses/:id updates partial fields and keeps others intact", async () => {
    const nurse = await createNurse({
      firstName: "Paula",
      lastName: "Mendez",
      licenseNumber: "EN-40200",
    });

    const res = await request
      .patch(`/api/nurses/${nurse.id}`)
      .send({ firstName: "Paula Maria" });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, {
      id: nurse.id,
      firstName: "Paula Maria",
      lastName: "Mendez",
      licenseNumber: "EN-40200",
    });
  });

  it("PATCH /api/nurses/:id rejects empty body with 400 VALIDATION_ERROR", async () => {
    const nurse = await createNurse();

    const res = await request.patch(`/api/nurses/${nurse.id}`).send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("DELETE /api/nurses/:id returns 204 and subsequent GET returns 404 NURSE_NOT_FOUND", async () => {
    const nurse = await createNurse();

    const delRes = await request.delete(`/api/nurses/${nurse.id}`);
    assert.equal(delRes.status, 204);

    const getRes = await request.get(`/api/nurses/${nurse.id}`);
    assert.equal(getRes.status, 404);
    assert.equal(getRes.body.error.code, "NURSE_NOT_FOUND");
  });

  it("POST /api/nurses rejects duplicate licenseNumber with 409 LICENSE_NUMBER_TAKEN", async () => {
    await createNurse({ licenseNumber: "EN-88800" });

    const res = await request.post("/api/nurses").send({
      firstName: "Diego",
      lastName: "Castro",
      licenseNumber: "EN-88800",
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "LICENSE_NUMBER_TAKEN");
  });

  it("POST /api/nurses rejects incomplete body with 400 VALIDATION_ERROR and details", async () => {
    const res = await request.post("/api/nurses").send({
      firstName: "Diego",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(res.body.error.details));
    assert.ok(res.body.error.details.length > 0);
  });

  it("POST /api/nurses rejects unknown field such as specialtyId with 400 VALIDATION_ERROR", async () => {
    const res = await request.post("/api/nurses").send({
      firstName: "Valeria",
      lastName: "Silva",
      licenseNumber: "EN-90300",
      specialtyId: 1,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("GET /api/nurses/abc returns 400 INVALID_ID with exact Nurse message", async () => {
    const res = await request.get("/api/nurses/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(
      res.body.error.message,
      "Nurse id must be a positive integer",
    );
  });

  it("GET /api/nurses/:id returns 404 NURSE_NOT_FOUND when missing", async () => {
    const res = await request.get("/api/nurses/999999");

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "NURSE_NOT_FOUND");
  });
});

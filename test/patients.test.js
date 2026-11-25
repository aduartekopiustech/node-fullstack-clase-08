import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createPatient,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const PATIENT_KEYS = [
  "id",
  "firstName",
  "lastName",
  "documentNumber",
  "birthDate",
];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

describe("Patients API", () => {
  it("POST /api/patients creates patient with Location header and clean DTO shape", async () => {
    const res = await request.post("/api/patients").send({
      firstName: "Maria",
      lastName: "Perez",
      documentNumber: "31234567",
      birthDate: "1990-08-21",
    });

    assert.equal(res.status, 201);
    assert.match(res.headers.location, /^\/api\/patients\/\d+$/);
    assert.deepEqual(Object.keys(res.body.data), PATIENT_KEYS);
    assert.equal("createdAt" in res.body.data, false);
    assert.equal("updatedAt" in res.body.data, false);
    assert.equal(res.body.data.firstName, "Maria");
    assert.equal(res.body.data.documentNumber, "31234567");
  });

  it("POST /api/patients rejects duplicate documentNumber with 409 DOCUMENT_NUMBER_TAKEN", async () => {
    await createPatient({ documentNumber: "35111222" });

    const res = await request.post("/api/patients").send({
      firstName: "Carlos",
      lastName: "Ruiz",
      documentNumber: "35111222",
      birthDate: "1988-03-10",
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "DOCUMENT_NUMBER_TAKEN");
  });

  it("POST /api/patients rejects incomplete body with 400 VALIDATION_ERROR and details", async () => {
    const res = await request.post("/api/patients").send({
      firstName: "Maria",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(res.body.error.details));
    assert.ok(res.body.error.details.length > 0);
  });

  it("POST /api/patients rejects unknown fields with 400 VALIDATION_ERROR", async () => {
    const res = await request.post("/api/patients").send({
      firstName: "Maria",
      lastName: "Perez",
      documentNumber: "32234567",
      birthDate: "1990-08-21",
      extraField: "unexpected",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("GET /api/patients returns patients ordered by id ascending", async () => {
    const first = await createPatient({ firstName: "Ana" });
    const second = await createPatient({ firstName: "Bruno" });

    const res = await request.get("/api/patients");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [first.id, second.id],
    );
  });

  it("GET /api/patients/:id returns existing patient", async () => {
    const patient = await createPatient();

    const res = await request.get(`/api/patients/${patient.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.data), PATIENT_KEYS);
    assert.deepEqual(res.body.data, patient);
  });

  it("GET /api/patients/:id returns 404 PATIENT_NOT_FOUND when missing", async () => {
    const res = await request.get("/api/patients/999999");

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "PATIENT_NOT_FOUND");
  });

  it("GET /api/patients/abc returns 400 INVALID_ID", async () => {
    const res = await request.get("/api/patients/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(
      res.body.error.message,
      "Patient id must be a positive integer",
    );
  });

  it("PATCH /api/patients/:id updates partial fields and preserves others", async () => {
    const patient = await createPatient({
      firstName: "Laura",
      lastName: "Sosa",
      documentNumber: "33112233",
      birthDate: "1991-04-12",
    });

    const res = await request
      .patch(`/api/patients/${patient.id}`)
      .send({ firstName: "Laura Elena" });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, {
      id: patient.id,
      firstName: "Laura Elena",
      lastName: "Sosa",
      documentNumber: "33112233",
      birthDate: "1991-04-12",
    });
  });

  it("PATCH /api/patients/:id rejects empty body with 400 VALIDATION_ERROR", async () => {
    const patient = await createPatient();

    const res = await request.patch(`/api/patients/${patient.id}`).send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("DELETE /api/patients/:id returns 204 and subsequent GET returns 404", async () => {
    const patient = await createPatient();

    const delRes = await request.delete(`/api/patients/${patient.id}`);
    assert.equal(delRes.status, 204);

    const getRes = await request.get(`/api/patients/${patient.id}`);
    assert.equal(getRes.status, 404);
    assert.equal(getRes.body.error.code, "PATIENT_NOT_FOUND");
  });
});

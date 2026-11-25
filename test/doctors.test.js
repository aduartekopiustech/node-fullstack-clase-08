import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createDoctor,
  createSpecialty,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const DOCTOR_KEYS = [
  "id",
  "firstName",
  "lastName",
  "licenseNumber",
  "specialty",
];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

describe("Doctors API", () => {
  it("POST /api/doctors creates doctor with Location header and nested specialty", async () => {
    const specialty = await createSpecialty("Cardiología");

    const res = await request.post("/api/doctors").send({
      firstName: "Rene",
      lastName: "Favaloro",
      licenseNumber: "MN-45100",
      specialtyId: specialty.id,
    });

    assert.equal(res.status, 201);
    assert.match(res.headers.location, /^\/api\/doctors\/\d+$/);
    assert.deepEqual(Object.keys(res.body.data), DOCTOR_KEYS);
    assert.deepEqual(Object.keys(res.body.data.specialty), ["id", "name"]);
    assert.deepEqual(res.body.data.specialty, {
      id: specialty.id,
      name: "Cardiología",
    });
  });

  it("GET /api/doctors/:id returns doctor with nested specialty", async () => {
    const specialty = await createSpecialty("Pediatría");
    const doctor = await createDoctor(specialty.id, {
      firstName: "Cecilia",
      lastName: "Grierson",
    });

    const res = await request.get(`/api/doctors/${doctor.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.data), DOCTOR_KEYS);
    assert.deepEqual(res.body.data, doctor);
  });

  it("GET /api/doctors returns doctors ordered by id ascending", async () => {
    const specialty = await createSpecialty("Clínica médica");
    const first = await createDoctor(specialty.id, { firstName: "Ana" });
    const second = await createDoctor(specialty.id, { firstName: "Luis" });

    const res = await request.get("/api/doctors");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [first.id, second.id],
    );
  });

  it("PATCH /api/doctors/:id updates partial fields and keeps others intact", async () => {
    const specialty = await createSpecialty("Traumatología");
    const doctor = await createDoctor(specialty.id, {
      firstName: "Mario",
      lastName: "Lopez",
      licenseNumber: "MN-55200",
    });

    const res = await request
      .patch(`/api/doctors/${doctor.id}`)
      .send({ lastName: "Lopez Vega" });

    assert.equal(res.status, 200);
    assert.deepEqual(res.body.data, {
      id: doctor.id,
      firstName: "Mario",
      lastName: "Lopez Vega",
      licenseNumber: "MN-55200",
      specialty: { id: specialty.id, name: "Traumatología" },
    });
  });

  it("PATCH /api/doctors/:id rejects empty body with 400 VALIDATION_ERROR", async () => {
    const specialty = await createSpecialty();
    const doctor = await createDoctor(specialty.id);

    const res = await request.patch(`/api/doctors/${doctor.id}`).send({});

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("DELETE /api/doctors/:id returns 204 and subsequent GET returns 404 DOCTOR_NOT_FOUND", async () => {
    const specialty = await createSpecialty();
    const doctor = await createDoctor(specialty.id);

    const delRes = await request.delete(`/api/doctors/${doctor.id}`);
    assert.equal(delRes.status, 204);

    const getRes = await request.get(`/api/doctors/${doctor.id}`);
    assert.equal(getRes.status, 404);
    assert.equal(getRes.body.error.code, "DOCTOR_NOT_FOUND");
  });

  it("POST /api/doctors rejects nonexistent specialtyId with 400 INVALID_REFERENCE", async () => {
    const res = await request.post("/api/doctors").send({
      firstName: "Elena",
      lastName: "Rojas",
      licenseNumber: "MN-60100",
      specialtyId: 999999,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_REFERENCE");
  });

  it("POST /api/doctors rejects duplicate licenseNumber with 409 LICENSE_NUMBER_TAKEN", async () => {
    const specialty = await createSpecialty();
    await createDoctor(specialty.id, { licenseNumber: "MN-77700" });

    const res = await request.post("/api/doctors").send({
      firstName: "Pedro",
      lastName: "Diaz",
      licenseNumber: "MN-77700",
      specialtyId: specialty.id,
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "LICENSE_NUMBER_TAKEN");
  });

  it("POST /api/doctors rejects incomplete body with 400 VALIDATION_ERROR and details", async () => {
    const res = await request.post("/api/doctors").send({
      firstName: "Elena",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
    assert.ok(Array.isArray(res.body.error.details));
    assert.ok(res.body.error.details.length > 0);
  });

  it("GET /api/doctors/abc returns 400 INVALID_ID with exact Doctor message", async () => {
    const res = await request.get("/api/doctors/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(
      res.body.error.message,
      "Doctor id must be a positive integer",
    );
  });

  it("GET /api/doctors/:id returns 404 DOCTOR_NOT_FOUND when missing", async () => {
    const res = await request.get("/api/doctors/999999");

    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, "DOCTOR_NOT_FOUND");
  });
});

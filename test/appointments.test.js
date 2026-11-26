import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import {
  closeDatabase,
  createAppointment,
  createDoctor,
  createPatient,
  createSpecialty,
  prepareDatabase,
  request,
  resetTables,
} from "./setup.js";

const APPOINTMENT_KEYS = [
  "id",
  "scheduledAt",
  "durationMinutes",
  "reason",
  "status",
  "cancelledAt",
  "patient",
  "doctor",
];

const PARTY_KEYS = ["id", "firstName", "lastName"];

before(prepareDatabase);
beforeEach(resetTables);
after(closeDatabase);

async function createParticipants() {
  const specialty = await createSpecialty("Cardiología");
  const doctor = await createDoctor(specialty.id, {
    firstName: "Rene",
    lastName: "Favaloro",
  });
  const patient = await createPatient({
    firstName: "Lucia",
    lastName: "Gomez",
    documentNumber: "31000111",
  });

  return { specialty, doctor, patient };
}

describe("Appointments API", () => {
  it("POST /api/appointments creates appointment with Location header and clean DTO shape", async () => {
    const { doctor, patient } = await createParticipants();

    const res = await request.post("/api/appointments").send({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
      durationMinutes: 45,
      reason: "Chequeo anual",
    });

    assert.equal(res.status, 201);
    assert.match(res.headers.location, /^\/api\/appointments\/\d+$/);
    assert.deepEqual(Object.keys(res.body.data), APPOINTMENT_KEYS);
    assert.deepEqual(Object.keys(res.body.data.patient), PARTY_KEYS);
    assert.deepEqual(Object.keys(res.body.data.doctor), PARTY_KEYS);
    assert.equal(res.body.data.status, "SCHEDULED");
    assert.equal(res.body.data.cancelledAt, null);
  });

  it("POST /api/appointments rejects nonexistent patientId with 400 INVALID_REFERENCE", async () => {
    const specialty = await createSpecialty();
    const doctor = await createDoctor(specialty.id);

    const res = await request.post("/api/appointments").send({
      patientId: 999999,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_REFERENCE");
  });

  it("GET /api/appointments/:id returns nested patient and doctor", async () => {
    const { doctor, patient } = await createParticipants();
    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    const res = await request.get(`/api/appointments/${appointment.id}`);

    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.body.data), APPOINTMENT_KEYS);
    assert.deepEqual(res.body.data.patient, {
      id: patient.id,
      firstName: "Lucia",
      lastName: "Gomez",
    });
    assert.deepEqual(res.body.data.doctor, {
      id: doctor.id,
      firstName: "Rene",
      lastName: "Favaloro",
    });
  });

  it("POST /api/appointments rejects same doctor and slot with 409 DOCTOR_SLOT_TAKEN", async () => {
    const { doctor, patient } = await createParticipants();
    const otherPatient = await createPatient();
    const slot = "2026-11-20T14:30:00.000Z";

    await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: slot,
    });

    const res = await request.post("/api/appointments").send({
      patientId: otherPatient.id,
      doctorId: doctor.id,
      scheduledAt: slot,
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.error.code, "DOCTOR_SLOT_TAKEN");
  });

  it("GET /api/appointments/search?doctorId= returns only appointments for that doctor", async () => {
    const specialty = await createSpecialty();
    const doctorA = await createDoctor(specialty.id, { firstName: "DoctorA" });
    const doctorB = await createDoctor(specialty.id, { firstName: "DoctorB" });
    const patient = await createPatient();

    const firstA = await createAppointment({
      patientId: patient.id,
      doctorId: doctorA.id,
      scheduledAt: "2026-11-20T10:00:00.000Z",
    });
    const secondA = await createAppointment({
      patientId: patient.id,
      doctorId: doctorA.id,
      scheduledAt: "2026-11-20T11:00:00.000Z",
    });
    await createAppointment({
      patientId: patient.id,
      doctorId: doctorB.id,
      scheduledAt: "2026-11-20T12:00:00.000Z",
    });

    const res = await request.get(
      `/api/appointments/search?doctorId=${doctorA.id}`,
    );

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [firstA.id, secondA.id],
    );
  });

  it("GET /api/appointments/search?date= matches full UTC day and excludes next day", async () => {
    const { doctor, patient } = await createParticipants();

    const targetDay = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });
    await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-21T10:00:00.000Z",
    });

    const res = await request.get("/api/appointments/search?date=2026-11-20");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [targetDay.id],
    );
  });

  it("GET /api/appointments/search filters by documentNumber and patientName", async () => {
    const specialty = await createSpecialty();
    const doctor = await createDoctor(specialty.id);
    const patientA = await createPatient({
      firstName: "Valentina",
      lastName: "Acosta",
      documentNumber: "38111222",
    });
    const patientB = await createPatient({
      firstName: "Marcos",
      lastName: "Pereyra",
      documentNumber: "39333444",
    });

    const apptA = await createAppointment({
      patientId: patientA.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T09:00:00.000Z",
    });
    await createAppointment({
      patientId: patientB.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T10:00:00.000Z",
    });

    const byDoc = await request.get(
      "/api/appointments/search?documentNumber=38111222",
    );
    assert.equal(byDoc.status, 200);
    assert.deepEqual(
      byDoc.body.data.map((item) => item.id),
      [apptA.id],
    );

    const byName = await request.get(
      "/api/appointments/search?patientName=acosta",
    );
    assert.equal(byName.status, 200);
    assert.deepEqual(
      byName.body.data.map((item) => item.id),
      [apptA.id],
    );
  });

  it("GET /api/appointments/search?doctorId=abc returns 400 VALIDATION_ERROR", async () => {
    const res = await request.get("/api/appointments/search?doctorId=abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "VALIDATION_ERROR");
  });

  it("PATCH /api/appointments/:id cancels appointment, sets cancelledAt, and keeps record", async () => {
    const { doctor, patient } = await createParticipants();
    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    const patchRes = await request
      .patch(`/api/appointments/${appointment.id}`)
      .send({ status: "CANCELLED" });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.status, "CANCELLED");
    assert.notEqual(patchRes.body.data.cancelledAt, null);

    const getRes = await request.get(`/api/appointments/${appointment.id}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.status, "CANCELLED");
    assert.notEqual(getRes.body.data.cancelledAt, null);
  });

  it("PATCH /api/appointments/:id rejects cancelling twice with 409 APPOINTMENT_ALREADY_CANCELLED", async () => {
    const { doctor, patient } = await createParticipants();
    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    const firstCancel = await request
      .patch(`/api/appointments/${appointment.id}`)
      .send({ status: "CANCELLED" });
    assert.equal(firstCancel.status, 200);

    const secondCancel = await request
      .patch(`/api/appointments/${appointment.id}`)
      .send({ status: "CANCELLED" });
    assert.equal(secondCancel.status, 409);
    assert.equal(secondCancel.body.error.code, "APPOINTMENT_ALREADY_CANCELLED");
  });

  it("GET /api/appointments returns appointments ordered by scheduledAt ascending", async () => {
    const { doctor, patient } = await createParticipants();

    const later = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-22T15:00:00.000Z",
    });
    const earlier = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T09:00:00.000Z",
    });
    const middle = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-21T12:00:00.000Z",
    });

    const res = await request.get("/api/appointments");

    assert.equal(res.status, 200);
    assert.deepEqual(
      res.body.data.map((item) => item.id),
      [earlier.id, middle.id, later.id],
    );
  });

  it("DELETE /api/patients/:id with appointments returns 409 PATIENT_HAS_APPOINTMENTS and keeps patient", async () => {
    const { doctor, patient } = await createParticipants();
    await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    const delRes = await request.delete(`/api/patients/${patient.id}`);
    assert.equal(delRes.status, 409);
    assert.equal(delRes.body.error.code, "PATIENT_HAS_APPOINTMENTS");

    const getRes = await request.get(`/api/patients/${patient.id}`);
    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.data.id, patient.id);
  });

  it("DELETE /api/appointments/:id returns 204 and subsequent GET returns 404 APPOINTMENT_NOT_FOUND", async () => {
    const { doctor, patient } = await createParticipants();
    const appointment = await createAppointment({
      patientId: patient.id,
      doctorId: doctor.id,
      scheduledAt: "2026-11-20T14:30:00.000Z",
    });

    const delRes = await request.delete(`/api/appointments/${appointment.id}`);
    assert.equal(delRes.status, 204);

    const getRes = await request.get(`/api/appointments/${appointment.id}`);
    assert.equal(getRes.status, 404);
    assert.equal(getRes.body.error.code, "APPOINTMENT_NOT_FOUND");
  });

  it("GET /api/appointments/abc returns 400 INVALID_ID with exact Appointment message", async () => {
    const res = await request.get("/api/appointments/abc");

    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, "INVALID_ID");
    assert.equal(
      res.body.error.message,
      "Appointment id must be a positive integer",
    );
  });
});

import assert from "node:assert/strict";
import supertest from "supertest";
import { createApp } from "../src/app.js";
import { ensureNativeEnums } from "../src/config/native-enums.js";
import { Specialty, sequelize } from "../src/models/index.js";

const TEST_DB_NAME = "hospital_test";
let sequence = 0;

const nextSeq = () => ++sequence;

export const request = supertest(createApp());

/**
 * Impide ejecutar operaciones destructivas fuera de la base aislada de tests.
 */
export function assertTestDatabase() {
  const dbName = process.env.DB_NAME;

  if (dbName !== TEST_DB_NAME) {
    throw new Error(
      `Refusing to run tests against database "${dbName ?? ""}": DB_NAME must be ${TEST_DB_NAME}`,
    );
  }
}

/**
 * Verifica aislamiento y recrea el esquema limpio antes de correr cada archivo.
 */
export async function prepareDatabase() {
  assertTestDatabase();
  await sequelize.authenticate();
  await ensureNativeEnums(sequelize);
  await sequelize.sync({ force: true });
}

/**
 * Limpia todas las tablas y reinicia secuencias entre tests.
 */
export async function resetTables() {
  assertTestDatabase();
  await sequelize.query(
    "TRUNCATE TABLE appointments, doctors, nurses, patients, specialties, users RESTART IDENTITY CASCADE",
  );
}

/**
 * Limpia residuos de la corrida y cierra el pool de Sequelize.
 */
export async function closeDatabase() {
  await resetTables();
  await sequelize.close();
}

export async function createSpecialty(name = `Specialty ${nextSeq()}`) {
  return Specialty.create({ name });
}

export async function createPatient(overrides = {}) {
  const seq = nextSeq();
  const res = await request.post("/api/patients").send({
    firstName: "Lucia",
    lastName: "Gomez",
    documentNumber: String(30000000 + seq),
    birthDate: "1992-05-14",
    ...overrides,
  });

  assert.equal(res.status, 201);
  return res.body.data;
}

export async function createUser(overrides = {}) {
  const seq = nextSeq();
  const res = await request.post("/api/users").send({
    name: "Ada Lovelace",
    email: `user${seq}@example.com`,
    password: "Password123!",
    ...overrides,
  });

  assert.equal(res.status, 201);
  return res.body.data;
}

export async function createDoctor(specialtyId, overrides = {}) {
  const seq = nextSeq();
  const res = await request.post("/api/doctors").send({
    firstName: "Gregory",
    lastName: "House",
    licenseNumber: `MN-${10000 + seq}`,
    specialtyId,
    ...overrides,
  });

  assert.equal(res.status, 201);
  return res.body.data;
}

export async function createNurse(overrides = {}) {
  const seq = nextSeq();
  const res = await request.post("/api/nurses").send({
    firstName: "Clara",
    lastName: "Barton",
    licenseNumber: `EN-${10000 + seq}`,
    ...overrides,
  });

  assert.equal(res.status, 201);
  return res.body.data;
}

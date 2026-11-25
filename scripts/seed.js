// Siembra el catálogo de especialidades sin duplicar filas.
// El esquema debe existir: npm run db:sync

import { sequelize, Specialty } from "../src/models/index.js";

const SPECIALTIES = [
  { name: "Cardiología" },
  { name: "Pediatría" },
  { name: "Clínica médica" },
  { name: "Diagnóstico clínico" },
  { name: "Traumatología" },
];

try {
  await sequelize.authenticate();
  await Specialty.bulkCreate(SPECIALTIES, { ignoreDuplicates: true });
  console.log(`Specialties seeded: ${SPECIALTIES.length}`);
} catch (error) {
  console.error("Unable to seed specialties:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}

// Sincroniza el esquema de la base con los modelos de Sequelize.
//
// OJO: `alter: true` compara modelo y tabla en las DOS direcciones.
// Agrega columnas que faltan, pero también BORRA las que existen en la
// tabla y no están declaradas en el modelo. Leé el SQL que imprime antes
// de darlo por bueno.
//
// Uso: npm run db:sync
// Reset destructivo y explícito: npm run db:sync -- --force

import { sequelize } from "../src/models/index.js";

const force = process.argv.includes("--force");

async function ensureNativeEnums() {
  // Estos tipos se declaran como strings en los modelos para evitar que
  // Sequelize genere nombres propios como enum_appointments_status.
  await sequelize.query(`
    DO $$
    BEGIN
      CREATE TYPE user_role AS ENUM ('ROLE_USER', 'ROLE_ADMIN');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await sequelize.query(`
    DO $$
    BEGIN
      CREATE TYPE appointment_status AS ENUM
        ('SCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
}

try {
  await sequelize.authenticate();
  await ensureNativeEnums();

  if (force) {
    console.warn("WARNING: --force drops ALL tables and their data");
  }

  await sequelize.sync({
    alter: !force,
    force,
    logging: (sql) => console.log(sql),
  });
  console.log("Esquema sincronizado desde los modelos");
} catch (error) {
  console.error("No se pudo sincronizar el esquema:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}

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
import { ensureNativeEnums } from "../src/config/native-enums.js";

const force = process.argv.includes("--force");

try {
  await sequelize.authenticate();
  await ensureNativeEnums(sequelize);

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

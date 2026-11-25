/**
 * Crea los tipos ENUM nativos de PostgreSQL si todavía no existen.
 */
export async function ensureNativeEnums(sequelize) {
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

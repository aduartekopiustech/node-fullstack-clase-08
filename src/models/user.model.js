import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name cannot be empty" },
        len: {
          args: [2, 120],
          msg: "Name must be between 2 and 120 characters",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: "Email must be a valid email address" },
      },
    },
    role: {
      // "user_role" es el tipo ENUM nativo creado en PostgreSQL.
      // No usamos DataTypes.ENUM: Sequelize espera que ese tipo se llame
      // enum_users_role y sync({ alter: true }) falla con
      // "cannot cast type user_role to enum_users_role".
      type: "user_role",
      allowNull: false,
      defaultValue: "ROLE_USER",
      validate: {
        isIn: {
          args: [["ROLE_USER", "ROLE_ADMIN"]],
          msg: "Invalid role",
        },
      },
    },
    password: {
      // Guarda el HASH, no el texto plano. Nunca se devuelve en una respuesta.
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    underscored: true,
    timestamps: true,
  },
);

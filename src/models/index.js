import { sequelize } from "../config/database.js";
import { User } from "./user.model.js";
import { Specialty } from "./specialty.model.js";
import { Patient } from "./patient.model.js";
import { Doctor } from "./doctor.model.js";
import { Nurse } from "./nurse.model.js";
import { Appointment } from "./appointment.model.js";

Specialty.hasMany(Doctor, {
  foreignKey: { name: "specialtyId", allowNull: false },
  as: "doctors",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Doctor.belongsTo(Specialty, {
  foreignKey: { name: "specialtyId", allowNull: false },
  as: "specialty",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Patient.hasMany(Appointment, {
  foreignKey: { name: "patientId", allowNull: false },
  as: "appointments",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Appointment.belongsTo(Patient, {
  foreignKey: { name: "patientId", allowNull: false },
  as: "patient",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Doctor.hasMany(Appointment, {
  foreignKey: { name: "doctorId", allowNull: false },
  as: "appointments",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Appointment.belongsTo(Doctor, {
  foreignKey: { name: "doctorId", allowNull: false },
  as: "doctor",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

export { sequelize, User, Specialty, Patient, Doctor, Nurse, Appointment };

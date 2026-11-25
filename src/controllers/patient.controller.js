import { ForeignKeyConstraintError, Op } from "sequelize";
import { Patient } from "../models/index.js";
import { toPatientResponse } from "../dtos/patient.dto.js";
import { AppError } from "../errors/app-error.js";

const patientNotFound = () =>
  new AppError("Patient not found", {
    status: 404,
    code: "PATIENT_NOT_FOUND",
  });

export const list = async (req, res) => {
  const patients = await Patient.findAll({ order: [["id", "ASC"]] });

  res.json({ data: patients.map(toPatientResponse) });
};

export const search = async (req, res) => {
  const keywords = String(req.query.keywords ?? "").trim();

  if (!keywords) {
    return res.json({ data: [] });
  }

  const pattern = `%${keywords}%`;
  const patients = await Patient.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike]: pattern } },
        { lastName: { [Op.iLike]: pattern } },
      ],
    },
    order: [["id", "ASC"]],
  });

  res.json({ data: patients.map(toPatientResponse) });
};

export const getById = async (req, res) => {
  const patient = await Patient.findByPk(req.resourceId);

  if (!patient) {
    throw patientNotFound();
  }

  res.json({ data: toPatientResponse(patient) });
};

export const create = async (req, res) => {
  const patient = await Patient.create(req.dto);

  res
    .status(201)
    .location(`/api/patients/${patient.id}`)
    .json({ data: toPatientResponse(patient) });
};

export const update = async (req, res) => {
  const patient = await Patient.findByPk(req.resourceId);

  if (!patient) {
    throw patientNotFound();
  }

  await patient.update(req.dto);

  res.json({ data: toPatientResponse(patient) });
};

export const remove = async (req, res) => {
  const patient = await Patient.findByPk(req.resourceId);

  if (!patient) {
    throw patientNotFound();
  }

  try {
    await patient.destroy();
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw new AppError("Patient has appointments and cannot be deleted", {
        status: 409,
        code: "PATIENT_HAS_APPOINTMENTS",
      });
    }

    throw error;
  }

  res.status(204).send();
};

import { ForeignKeyConstraintError, Op } from "sequelize";
import { Doctor, Specialty } from "../models/index.js";
import { toDoctorResponse } from "../dtos/doctor.dto.js";
import { AppError } from "../errors/app-error.js";

const withSpecialty = {
  model: Specialty,
  as: "specialty",
  attributes: ["id", "name"],
};

const doctorNotFound = () =>
  new AppError("Doctor not found", {
    status: 404,
    code: "DOCTOR_NOT_FOUND",
  });

export const list = async (req, res) => {
  const doctors = await Doctor.findAll({
    include: withSpecialty,
    order: [["id", "ASC"]],
  });

  res.json({ data: doctors.map(toDoctorResponse) });
};

export const search = async (req, res) => {
  const keywords = String(req.query.keywords ?? "").trim();

  if (!keywords) {
    return res.json({ data: [] });
  }

  const pattern = `%${keywords}%`;
  const doctors = await Doctor.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike]: pattern } },
        { lastName: { [Op.iLike]: pattern } },
      ],
    },
    include: withSpecialty,
    order: [["id", "ASC"]],
  });

  res.json({ data: doctors.map(toDoctorResponse) });
};

export const getById = async (req, res) => {
  const doctor = await Doctor.findByPk(req.resourceId, {
    include: withSpecialty,
  });

  if (!doctor) {
    throw doctorNotFound();
  }

  res.json({ data: toDoctorResponse(doctor) });
};

export const create = async (req, res) => {
  const doctor = await Doctor.create(req.dto);
  await doctor.reload({ include: withSpecialty });

  res
    .status(201)
    .location(`/api/doctors/${doctor.id}`)
    .json({ data: toDoctorResponse(doctor) });
};

export const update = async (req, res) => {
  const doctor = await Doctor.findByPk(req.resourceId);

  if (!doctor) {
    throw doctorNotFound();
  }

  await doctor.update(req.dto);
  await doctor.reload({ include: withSpecialty });

  res.json({ data: toDoctorResponse(doctor) });
};

export const remove = async (req, res) => {
  const doctor = await Doctor.findByPk(req.resourceId);

  if (!doctor) {
    throw doctorNotFound();
  }

  try {
    await doctor.destroy();
  } catch (error) {
    if (error instanceof ForeignKeyConstraintError) {
      throw new AppError("Doctor has appointments and cannot be deleted", {
        status: 409,
        code: "DOCTOR_HAS_APPOINTMENTS",
      });
    }

    throw error;
  }

  res.status(204).send();
};

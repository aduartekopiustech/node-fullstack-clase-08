import { Op } from "sequelize";
import { Nurse } from "../models/index.js";
import { toNurseResponse } from "../dtos/nurse.dto.js";
import { AppError } from "../errors/app-error.js";

const nurseNotFound = () =>
  new AppError("Nurse not found", {
    status: 404,
    code: "NURSE_NOT_FOUND",
  });

export const list = async (req, res) => {
  const nurses = await Nurse.findAll({ order: [["id", "ASC"]] });

  res.json({ data: nurses.map(toNurseResponse) });
};

export const search = async (req, res) => {
  const keywords = String(req.query.keywords ?? "").trim();

  if (!keywords) {
    return res.json({ data: [] });
  }

  const pattern = `%${keywords}%`;
  const nurses = await Nurse.findAll({
    where: {
      [Op.or]: [
        { firstName: { [Op.iLike]: pattern } },
        { lastName: { [Op.iLike]: pattern } },
      ],
    },
    order: [["id", "ASC"]],
  });

  res.json({ data: nurses.map(toNurseResponse) });
};

export const getById = async (req, res) => {
  const nurse = await Nurse.findByPk(req.resourceId);

  if (!nurse) {
    throw nurseNotFound();
  }

  res.json({ data: toNurseResponse(nurse) });
};

export const create = async (req, res) => {
  const nurse = await Nurse.create(req.dto);

  res
    .status(201)
    .location(`/api/nurses/${nurse.id}`)
    .json({ data: toNurseResponse(nurse) });
};

export const update = async (req, res) => {
  const nurse = await Nurse.findByPk(req.resourceId);

  if (!nurse) {
    throw nurseNotFound();
  }

  await nurse.update(req.dto);

  res.json({ data: toNurseResponse(nurse) });
};

export const remove = async (req, res) => {
  const nurse = await Nurse.findByPk(req.resourceId);

  if (!nurse) {
    throw nurseNotFound();
  }

  await nurse.destroy();

  res.status(204).send();
};

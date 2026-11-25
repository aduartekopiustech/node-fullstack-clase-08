import { Appointment, Doctor, Patient } from "../models/index.js";
import { toAppointmentResponse } from "../dtos/appointment.dto.js";
import { AppError } from "../errors/app-error.js";

const parties = [
  {
    model: Patient,
    as: "patient",
    attributes: ["id", "firstName", "lastName"],
  },
  {
    model: Doctor,
    as: "doctor",
    attributes: ["id", "firstName", "lastName"],
  },
];

const appointmentNotFound = () =>
  new AppError("Appointment not found", {
    status: 404,
    code: "APPOINTMENT_NOT_FOUND",
  });

export const list = async (req, res) => {
  const appointments = await Appointment.findAll({
    include: parties,
    order: [["scheduledAt", "ASC"]],
  });

  res.json({ data: appointments.map(toAppointmentResponse) });
};

export const getById = async (req, res) => {
  const appointment = await Appointment.findByPk(req.resourceId, {
    include: parties,
  });

  if (!appointment) {
    throw appointmentNotFound();
  }

  res.json({ data: toAppointmentResponse(appointment) });
};

export const create = async (req, res) => {
  const appointment = await Appointment.create(req.dto);
  await appointment.reload({ include: parties });

  res
    .status(201)
    .location(`/api/appointments/${appointment.id}`)
    .json({ data: toAppointmentResponse(appointment) });
};

export const update = async (req, res) => {
  const appointment = await Appointment.findByPk(req.resourceId);

  if (!appointment) {
    throw appointmentNotFound();
  }

  const isCancelling = req.dto.status === "CANCELLED";

  if (isCancelling && appointment.status === "CANCELLED") {
    throw new AppError("Appointment is already cancelled", {
      status: 409,
      code: "APPOINTMENT_ALREADY_CANCELLED",
    });
  }

  const data = { ...req.dto };

  if (req.dto.status) {
    data.cancelledAt = isCancelling ? new Date() : null;
  }

  await appointment.update(data);
  await appointment.reload({ include: parties });

  res.json({ data: toAppointmentResponse(appointment) });
};

export const remove = async (req, res) => {
  const appointment = await Appointment.findByPk(req.resourceId);

  if (!appointment) {
    throw appointmentNotFound();
  }

  await appointment.destroy();

  res.status(204).send();
};

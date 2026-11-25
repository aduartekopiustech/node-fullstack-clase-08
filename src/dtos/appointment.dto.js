import * as yup from "yup";

const patientId = yup.number().integer().positive();
const doctorId = yup.number().integer().positive();
const scheduledAt = yup
  .date()
  .typeError("scheduledAt must be a valid ISO 8601 timestamp");
const durationMinutes = yup.number().integer().min(5).max(240);
const reason = yup.string().trim().min(3).max(255).nullable();
const status = yup
  .string()
  .oneOf(["SCHEDULED", "CANCELLED", "COMPLETED", "NO_SHOW"], "Invalid status");

export const createAppointmentDto = yup
  .object({
    patientId: patientId.required(),
    doctorId: doctorId.required(),
    scheduledAt: scheduledAt.required(),
    durationMinutes,
    reason,
  })
  .noUnknown(true, "Unknown fields are not allowed");

export const updateAppointmentDto = yup
  .object({
    patientId,
    doctorId,
    scheduledAt,
    durationMinutes,
    reason,
    status,
  })
  .noUnknown(true, "Unknown fields are not allowed")
  .test(
    "at-least-one",
    "At least one field is required",
    (value) => Object.keys(value ?? {}).length > 0,
  );

const toPartyResponse = (party) => ({
  id: party.id,
  firstName: party.firstName,
  lastName: party.lastName,
});

const toTimestamp = (value) =>
  value instanceof Date ? value.toISOString() : value;

export function toAppointmentResponse(appointment) {
  return {
    id: appointment.id,
    scheduledAt: toTimestamp(appointment.scheduledAt),
    durationMinutes: appointment.durationMinutes,
    reason: appointment.reason,
    status: appointment.status,
    cancelledAt: toTimestamp(appointment.cancelledAt),
    patient: toPartyResponse(appointment.patient),
    doctor: toPartyResponse(appointment.doctor),
  };
}

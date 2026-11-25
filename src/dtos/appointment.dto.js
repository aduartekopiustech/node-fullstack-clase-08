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

const queryDate = yup
  .string()
  .matches(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD")
  .test("valid-date", "date must be a valid date", (value) => {
    if (!value) return true;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  });

export const searchAppointmentsQueryDto = yup
  .object({
    doctorId,
    date: queryDate,
    documentNumber: yup
      .string()
      .trim()
      .matches(/^[0-9]{7,10}$/, "Document number must contain 7 to 10 digits"),
    patientName: yup.string().trim().min(1),
  })
  .noUnknown(true, "Unknown query parameters are not allowed");

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

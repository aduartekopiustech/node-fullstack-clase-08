import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";

const UNIQUE_ERRORS = {
  email: {
    code: "EMAIL_TAKEN",
    message: "Email is already registered",
  },
  document_number: {
    code: "DOCUMENT_NUMBER_TAKEN",
    message: "Document number is already registered",
  },
  license_number: {
    code: "LICENSE_NUMBER_TAKEN",
    message: "License number is already registered",
  },
  name: {
    code: "SPECIALTY_NAME_TAKEN",
    message: "Specialty name is already registered",
  },
};

const CONSTRAINT_ERRORS = {
  appointments_doctor_slot_unique: {
    code: "DOCTOR_SLOT_TAKEN",
    message: "Doctor already has an appointment at that time",
  },
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  // JSON mal formado: lo lanza express.json()
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body is not valid JSON",
      },
    });
  }

  // La constraint y la columna identifican qué valor está duplicado.
  if (error instanceof UniqueConstraintError) {
    const constraint = error.parent?.constraint;
    const field = Object.keys(error.fields ?? {})[0];
    const conflict = CONSTRAINT_ERRORS[constraint] ?? UNIQUE_ERRORS[field];

    return res.status(409).json({
      error: {
        code: conflict?.code ?? "DUPLICATE_VALUE",
        message: conflict?.message ?? "Value is already registered",
      },
    });
  }

  // Una FK inexistente en create/update es una referencia inválida.
  // Los 409 por borrar recursos en uso se traducen en cada controller.
  if (error instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      error: {
        code: "INVALID_REFERENCE",
        message: "Referenced resource does not exist",
      },
    });
  }

  // La base rechazó una validación del modelo
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid user data",
        details: error.errors.map((item) => item.message),
      },
    });
  }

  const status = error.status ?? 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: {
      code: error.code ?? "INTERNAL_ERROR",
      message: status >= 500 ? "Unexpected server error" : error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  });
};

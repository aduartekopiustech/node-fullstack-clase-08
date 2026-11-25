import * as yup from "yup";

export const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.queryDto = await schema.validate(req.query ?? {}, {
      abortEarly: false,
      stripUnknown: false,
    });
    next();
  } catch (error) {
    if (!(error instanceof yup.ValidationError)) {
      return next(error);
    }

    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid query parameters",
        details: error.errors,
      },
    });
  }
};

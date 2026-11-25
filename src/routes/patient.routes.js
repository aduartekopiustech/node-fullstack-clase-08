import { Router } from "express";
import * as controller from "../controllers/patient.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js";
import { createPatientDto, updatePatientDto } from "../dtos/patient.dto.js";

export const patientRouter = Router();

// /search va ANTES de /:id, o Express lo interpreta como un id.
patientRouter.get("/search", controller.search);
patientRouter.get("/", controller.list);
patientRouter.get("/:id", validateId("Patient"), controller.getById);
patientRouter.post("/", validateBody(createPatientDto), controller.create);
patientRouter.patch(
  "/:id",
  validateId("Patient"),
  validateBody(updatePatientDto),
  controller.update,
);
patientRouter.delete("/:id", validateId("Patient"), controller.remove);

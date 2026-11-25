import { Router } from "express";
import * as controller from "../controllers/doctor.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js";
import { createDoctorDto, updateDoctorDto } from "../dtos/doctor.dto.js";

export const doctorRouter = Router();

// /search va ANTES de /:id, o Express lo interpreta como un id.
doctorRouter.get("/search", controller.search);
doctorRouter.get("/", controller.list);
doctorRouter.get("/:id", validateId("Doctor"), controller.getById);
doctorRouter.post("/", validateBody(createDoctorDto), controller.create);
doctorRouter.patch(
  "/:id",
  validateId("Doctor"),
  validateBody(updateDoctorDto),
  controller.update,
);
doctorRouter.delete("/:id", validateId("Doctor"), controller.remove);

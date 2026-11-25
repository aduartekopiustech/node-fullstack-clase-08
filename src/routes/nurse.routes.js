import { Router } from "express";
import * as controller from "../controllers/nurse.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js";
import { createNurseDto, updateNurseDto } from "../dtos/nurse.dto.js";

export const nurseRouter = Router();

// /search va ANTES de /:id, o Express lo interpreta como un id.
nurseRouter.get("/search", controller.search);
nurseRouter.get("/", controller.list);
nurseRouter.get("/:id", validateId("Nurse"), controller.getById);
nurseRouter.post("/", validateBody(createNurseDto), controller.create);
nurseRouter.patch(
  "/:id",
  validateId("Nurse"),
  validateBody(updateNurseDto),
  controller.update,
);
nurseRouter.delete("/:id", validateId("Nurse"), controller.remove);

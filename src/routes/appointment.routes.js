import { Router } from "express";
import * as controller from "../controllers/appointment.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js";
import { validateQuery } from "../middlewares/validate-query.middleware.js";
import {
  createAppointmentDto,
  searchAppointmentsQueryDto,
  updateAppointmentDto,
} from "../dtos/appointment.dto.js";

export const appointmentRouter = Router();

// /search va ANTES de /:id, o Express lo interpreta como un id.
appointmentRouter.get(
  "/search",
  validateQuery(searchAppointmentsQueryDto),
  controller.search,
);
appointmentRouter.get("/", controller.list);
appointmentRouter.get("/:id", validateId("Appointment"), controller.getById);
appointmentRouter.post(
  "/",
  validateBody(createAppointmentDto),
  controller.create,
);
appointmentRouter.patch(
  "/:id",
  validateId("Appointment"),
  validateBody(updateAppointmentDto),
  controller.update,
);
appointmentRouter.delete(
  "/:id",
  validateId("Appointment"),
  controller.remove,
);

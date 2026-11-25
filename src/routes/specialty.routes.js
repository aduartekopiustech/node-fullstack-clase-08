import { Router } from "express";
import * as controller from "../controllers/specialty.controller.js";
import { validateId } from "../middlewares/validate-id.middleware.js";

export const specialtyRouter = Router();

specialtyRouter.get("/", controller.list);
specialtyRouter.get("/:id", validateId("Specialty"), controller.getById);

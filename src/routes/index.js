import { Router } from "express";
import { userRouter } from "./user.routes.js";
import { specialtyRouter } from "./specialty.routes.js";
import { patientRouter } from "./patient.routes.js";

export const apiRouter = Router();

apiRouter.use("/users", userRouter);
apiRouter.use("/specialties", specialtyRouter);
apiRouter.use("/patients", patientRouter);

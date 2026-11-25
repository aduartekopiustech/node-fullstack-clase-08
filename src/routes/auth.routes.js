import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { loginDto } from "../dtos/user.dto.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginDto), controller.login);

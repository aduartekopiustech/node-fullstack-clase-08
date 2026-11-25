import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateUserId } from "../middlewares/validate-id.middleware.js";
import { requireRole } from "../middlewares/require-role.middleware.js";
import {
  assignRoleDto,
  createUserDto,
  updateUserDto,
} from "../dtos/user.dto.js";

export const userRouter = Router();

// /search va ANTES de /:id, o Express lo interpreta como un id
userRouter.get("/search", controller.search);
userRouter.get("/", controller.list);
userRouter.get("/:id", validateUserId, controller.getById);
userRouter.post("/", validateBody(createUserDto), controller.create);
userRouter.patch(
  "/:id",
  validateUserId,
  validateBody(updateUserDto),
  controller.update,
);
// Cambiar un rol no es un PATCH de datos comunes: tiene su ruta y su guard.
userRouter.patch(
  "/:id/role",
  requireRole("ROLE_ADMIN"),
  validateUserId,
  validateBody(assignRoleDto),
  controller.assignRole,
);
userRouter.delete("/:id", validateUserId, controller.remove);

import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import { toUserResponse } from "../dtos/user.dto.js";
import { AppError } from "../errors/app-error.js";

// Un solo error para "no existe" y "password incorrecta": si cambia el
// mensaje, el atacante descubre qué emails están registrados.
const invalidCredentials = () =>
  new AppError("Invalid credentials", {
    status: 401,
    code: "INVALID_CREDENTIALS",
  });

export const login = async (req, res) => {
  const { email, password } = req.dto;

  const user = await User.findOne({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw invalidCredentials();
  }

  res.json({ data: toUserResponse(user) });
};

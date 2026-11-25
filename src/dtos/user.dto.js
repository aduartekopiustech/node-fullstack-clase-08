import * as yup from "yup";

// Los campos se escriben una sola vez y se reusan en los contratos.
const name = yup.string().trim().min(2).max(120);
const email = yup.string().trim().lowercase().email().max(255);
const password = yup.string().trim().min(8).max(72);
const role = yup
  .string()
  .oneOf(["ROLE_USER", "ROLE_ADMIN"], "Role must be ROLE_USER or ROLE_ADMIN");

// Crear: name, email y password son obligatorios. El rol no se acepta:
// si el cliente pudiera mandarlo, se autoasignaría ROLE_ADMIN.
export const createUserDto = yup
  .object({
    name: name.required(),
    email: email.required(),
    password: password.required(),
  })
  .noUnknown(true, "Unknown fields are not allowed");

// Actualizar: todo opcional, pero al menos un campo tiene que venir.
export const updateUserDto = yup
  .object({ name, email, password })
  .noUnknown(true, "Unknown fields are not allowed")
  .test(
    "at-least-one",
    "At least one field is required",
    (value) => Object.keys(value ?? {}).length > 0,
  );

// Cambiar el rol es una operación aparte, con su propio contrato.
export const assignRoleDto = yup
  .object({ role: role.required() })
  .noUnknown(true, "Unknown fields are not allowed");

// Login: email y password, sin reglas de formato de alta.
export const loginDto = yup
  .object({
    email: email.required(),
    password: yup.string().trim().required(),
  })
  .noUnknown(true, "Unknown fields are not allowed");

// Salida: lo que la API expone de un usuario. Nunca la columna `password`.
export function toUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

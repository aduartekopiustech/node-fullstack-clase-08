// Autorización simple para la práctica: el rol llega por un header.
//
// OJO: esto NO es autenticación. Cualquiera puede enviar `x-user-role:
// ROLE_ADMIN`. En un proyecto real el rol sale de un token firmado que el
// servidor verifica; el header es solo para ver la mecánica del middleware.
export const requireRole = (role) => (req, res, next) => {
  const currentRole = req.header("x-user-role");

  if (currentRole !== role) {
    return res.status(403).json({
      error: { code: "FORBIDDEN", message: "Insufficient permissions" },
    });
  }

  next();
};

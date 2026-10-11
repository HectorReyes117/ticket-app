import { mockApi } from "@/services/api";
import { findByEmail } from "@/features/users/services/userService";
import type { User } from "@/types";

export const DEMO_PASSWORD = "1234";

export interface Credentials {
  email: string;
  password: string;
}

export async function login(
  credentials: Credentials,
): Promise<User> {
  const user = findByEmail(credentials.email);
  await mockApi(null);

  if (!user || credentials.password !== DEMO_PASSWORD) {
    throw new Error(
      "Correo o contraseña incorrectos. Usa una cuenta @unicaribe.edu.do y la contraseña de demostración.",
    );
  }
  if (!user.active) {
    throw new Error("Esta cuenta está desactivada. Contacta a un administrador.");
  }
  return { ...user, presence: "online", lastActiveAt: new Date().toISOString() };
}
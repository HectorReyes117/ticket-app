export function required(value: string): string | undefined {
  return value.trim().length > 0 ? undefined : "Este campo es obligatorio.";
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateEmail(value: string): string | undefined {
  if (value.trim().length === 0) return required(value);
  return isValidEmail(value)
    ? undefined
    : "Ingresa una dirección de correo válida.";
}

export function isValidPhone(value: string): boolean {
  return /^\+?[0-9 ()-]{8,15}$/.test(value);
}

export function validatePhone(value: string): string | undefined {
  if (value.trim().length === 0) return undefined;
  return isValidPhone(value)
    ? undefined
    : "Ingresa un número de teléfono válido.";
}

export function isPositiveNumber(value: string): boolean {
  return value !== "" && !Number.isNaN(Number(value)) && Number(value) >= 0;
}
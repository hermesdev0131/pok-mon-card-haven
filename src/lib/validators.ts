// CPF validation (Brazilian individual taxpayer registry) — mod-11 algorithm
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(digits[10]);
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export async function hashCPF(cpf: string): Promise<string> {
  const digits = cpf.replace(/\D/g, '');
  const data = new TextEncoder().encode(digits);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function validateAge(dateStr: string, minAge: number = 18): boolean {
  const dob = new Date(dateStr);
  if (isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age >= minAge;
}

// CNPJ validation (Brazilian company registry) — mod-11 algorithm
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let remainder = sum % 11;
  if (parseInt(digits[12]) !== (remainder < 2 ? 0 : 11 - remainder)) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  remainder = sum % 11;
  return parseInt(digits[13]) === (remainder < 2 ? 0 : 11 - remainder);
}

export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export interface NicknameChecks {
  length: boolean;
  noSpaces: boolean;
  validChars: boolean;
}

export function checkNickname(nickname: string): NicknameChecks {
  return {
    length: nickname.length >= 4 && nickname.length <= 20,
    noSpaces: nickname.length > 0 && !/\s/.test(nickname),
    validChars: nickname.length > 0 && /^[a-zA-Z0-9_\-]+$/.test(nickname),
  };
}

export function validateNickname(nickname: string): { valid: boolean; error?: string } {
  const checks = checkNickname(nickname);
  if (!checks.length) return { valid: false, error: 'Apelido deve ter entre 4 e 20 caracteres' };
  if (!checks.noSpaces) return { valid: false, error: 'Apelido não pode conter espaços' };
  if (!checks.validChars) return { valid: false, error: 'Apelido pode conter apenas letras, números, _ e -' };
  return { valid: true };
}

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
}

export function checkPassword(password: string): PasswordChecks {
  return {
    length: password.length >= 10 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
  };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  const checks = checkPassword(password);
  if (!checks.length) return { valid: false, error: 'Senha deve ter entre 10 e 128 caracteres' };
  if (!checks.uppercase) return { valid: false, error: 'Senha deve ter ao menos 1 letra maiúscula' };
  if (!checks.number) return { valid: false, error: 'Senha deve ter ao menos 1 número' };
  if (!checks.special) return { valid: false, error: 'Senha deve ter ao menos 1 caractere especial' };
  return { valid: true };
}

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

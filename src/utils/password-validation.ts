/**
 * TRMS Password Security Policy:
 * - Minimum 7 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 * - At least one special character (@$!%*?&)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;

export interface PasswordStrength {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordStrength {
  const errors: string[] = [];
  
  if (password.length < 7) {
    errors.push('Password must be at least 7 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Include at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Include at least one lowercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Include at least one number.');
  }
  if (!/[@$!%*?&]/.test(password)) {
    errors.push('Include at least one special character (@$!%*?&).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

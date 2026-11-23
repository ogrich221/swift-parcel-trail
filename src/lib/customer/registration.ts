export interface RegistrationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  password: string;
  confirm: string;
  agree: boolean;
}

export function validatePhone(phone: string): boolean {
  const clean = phone.trim();
  const digitsOnly = clean.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 16) return false;
  return /^[+]?[\d\s\-().]{7,25}$/.test(clean);
}

export function getPasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong' | '';
  color: string;
  hasLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
} {
  if (!password) {
    return {
      score: 0,
      label: '',
      color: 'bg-muted',
      hasLength: false,
      hasLetter: false,
      hasNumber: false,
      hasSpecial: false
    };
  }

  const hasLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  let score = 0;
  if (hasLength) score++;
  if (hasLetter && hasNumber) score++;
  if (hasSpecial) score++;
  if (password.length >= 10 && hasLetter && hasNumber && hasSpecial) score++;

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = 'bg-red-500';

  if (score >= 4) {
    label = 'Strong';
    color = 'bg-emerald-500';
  } else if (score === 3) {
    label = 'Good';
    color = 'bg-blue-500';
  } else if (score === 2) {
    label = 'Fair';
    color = 'bg-amber-500';
  }

  return {
    score,
    label,
    color,
    hasLength,
    hasLetter,
    hasNumber,
    hasSpecial
  };
}

export function validateRegistrationData(data: RegistrationData): {valid: boolean; errors: Record<string, string>} {
  const errors: Record<string, string> = {};

  if (!data.first_name.trim()) errors.first_name = 'First name is required.';
  if (!data.last_name.trim()) errors.last_name = 'Last name is required.';

  if (!data.email.trim()) {
    errors.email = 'Email address is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required.';
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Please provide a valid phone number (minimum 7 digits).';
  }

  if (!data.country.trim()) errors.country = 'Country is required.';
  if (!data.city.trim()) errors.city = 'City is required.';
  if (!data.address.trim()) errors.address = 'Residential address is required.';

  if (!data.password) {
    errors.password = 'Password is required.';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else {
    const strength = getPasswordStrength(data.password);
    if (!strength.hasLetter || (!strength.hasNumber && !strength.hasSpecial)) {
      errors.password = 'Password must contain both letters and numbers/symbols.';
    }
  }

  if (!data.confirm) {
    errors.confirm = 'Please confirm your password.';
  } else if (data.password !== data.confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  if (!data.agree) {
    errors.agree = 'You must agree to the Terms and Conditions and Privacy Policy.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

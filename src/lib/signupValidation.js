export function signupValidationError({ name, email, password, ageConfirmed }) {
  if (!name || !String(name).trim()) {
    return "Enter your name, a valid email address, and a password with at least 8 characters.";
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    return "Enter a valid email address.";
  }
  if (!password || String(password).length < 8) {
    return "Enter your name, a valid email address, and a password with at least 8 characters.";
  }
  if (!ageConfirmed) {
    return "You must be at least 13 years old to create an account.";
  }
  return "";
}
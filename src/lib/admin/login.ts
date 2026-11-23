// The account identifier is public configuration, never an authentication bypass.
export const masterAdminEmail = 'ogrichindeed@gmail.com';

export function adminCredentials(passcode: string) {
  return { email: masterAdminEmail, password: passcode };
}

// Public pages must not offer the administrator a route into the workspace.
export function isMasterAdminEmail(email?: string | null): boolean {
  return typeof email === 'string' && email.toLowerCase() === masterAdminEmail.toLowerCase();
}

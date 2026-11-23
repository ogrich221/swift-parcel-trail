// The account identifier is public configuration, never an authentication bypass.
export const masterAdminEmail = 'swiftdeliveryexpress4@gmail.com';

export function adminCredentials(passcode: string) {
  return { email: masterAdminEmail, password: passcode };
}

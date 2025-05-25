// Simple admin authentication with hardcoded credentials
// In a production app, you would use a more secure approach

export const ADMIN_USERNAME = "admin"
export const ADMIN_PASSWORD = "braincast2024"

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

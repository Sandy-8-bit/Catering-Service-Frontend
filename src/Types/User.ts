/**
 * API types for admin users
 */

export interface User {
  userId: number
  name: string
  email: string
  phone: string
  role: string
  password?: string
}

export interface UserPayload {
  name: string
  email: string
  phone: string
  password?: string
  role: string
}

/**
 * API types for admin users
 */

export interface User {
  userId: number
  name: string
  email: string
  phone: string
  roles: string[]
  password?: string
}

export interface UserPayload {
  name: string
  email: string
  phone: string
  password?: string
  roles: string[]
}

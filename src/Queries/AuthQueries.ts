import axiosInstance from '../utils/axios'
import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'
import { apiRoutes } from '../routes/apiRoutes'
import type {
  LoginRequest,
  RegisterRequest,
  Verify,
  AuthResponse,
  VerifyResponse,
} from '../types/authTypes'

/**
 * -------------------------------------------
 * USER AUTH HOOKS - LOGIN / REGISTER / VERIFY TOTP
 * -------------------------------------------
 */

/**
 * 🔐 LOGIN USER
 */
export const useLogin = () => {
  const loginUser = async (payload: LoginRequest): Promise<AuthResponse> => {
    try {
      const res = await axiosInstance.post(apiRoutes.login, payload)

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Login failed')
      }

      return res.data as AuthResponse
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Login failed')
      } else {
        toast.error('Something went wrong while logging in')
      }
      throw error
    }
  }

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.token) {
        Cookies.set('token', data.token)
      }
    },
  })
}

/**
 * 🆕 REGISTER USER
 */
export const useRegister = () => {
  const registerUser = async (
    payload: RegisterRequest
  ): Promise<AuthResponse> => {
    try {
      const res = await axiosInstance.post(apiRoutes.register, payload)

      if (res.status !== 201 && res.status !== 200) {
        throw new Error(res.data?.message || 'Registration failed')
      }

      return res.data as AuthResponse
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Registration failed')
      } else {
        toast.error('Something went wrong while registering')
      }
      throw error
    }
  }

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast.success('Registration Successful')
    },
  })
}

/**
 * 🔑 VERIFY TOTP CODE
 */
export const useVerifyTotp = () => {
  const verifyTotp = async (payload: Verify): Promise<VerifyResponse> => {
    try {
      const res = await axiosInstance.post(apiRoutes.verify, payload)

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Verification failed')
      }

      return res.data as VerifyResponse
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Verification failed')
      } else {
        toast.error('Something went wrong while verifying')
      }
      throw error
    }
  }

  return useMutation({
    mutationFn: verifyTotp,
    onSuccess: (data) => {
      Cookies.set('token', data.token)
      localStorage.setItem('token', data.token)
    },
  })
}

import axios from 'axios'
import { useMutation } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import { toast } from 'react-hot-toast'
import axiosInstance from '../utils/axios'
import { apiRoutes } from '../routes/apiRoutes'
import type {
  LoginRequest,
  RegisterRequest,
  Verify,
  AuthResponse,
  VerifyResponse,
} from '../types/authTypes'

/**
 * 🔐 LOGIN USER
 */
export const useLogin = () => {
  const loginUser = async (payload: LoginRequest): Promise<AuthResponse> => {
    const res = await axiosInstance.post(apiRoutes.login, payload)

    if (res.status !== 200) {
      throw new Error(res.data?.message || 'Login failed')
    }

    return res.data
  }

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (!data?.token) return

      // ✅ Store JWT in cookie (CATERING prefix)
      Cookies.set('CATERING_TOKEN', data.token, {
        expires: 1, // 1 day
        secure: true,
        sameSite: 'strict',
      })

      // ✅ Store user info in localStorage (CATERING prefix)
      localStorage.setItem('CATERING_ROLE', data.role || '')
      localStorage.setItem('CATERING_USER_ID', String(data.Id))

      toast.success('Logged in successfully')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Login failed')
      } else {
        toast.error('Something went wrong')
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
    const res = await axiosInstance.post(apiRoutes.register, payload)

    if (res.status !== 200 && res.status !== 201) {
      throw new Error(res.data?.message || 'Registration failed')
    }

    return res.data
  }

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      toast.success(data?.message || 'Registration successful')
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || 'Registration failed')
      } else {
        toast.error('Something went wrong')
      }
    },
  })
}

/**
 * 🔑 VERIFY TOTP
 */
export const useVerifyTotp = () => {
  const verifyTotp = async (payload: Verify): Promise<VerifyResponse> => {
    const res = await axiosInstance.post(apiRoutes.verify, payload)

    if (res.status !== 200) {
      throw new Error(res.data?.message || 'Verification failed')
    }

    return res.data
  }

  return useMutation({
    mutationFn: verifyTotp,
    onSuccess: (data) => {
      if (!data?.token) return

      // ✅ Store JWT in cookie (CATERING prefix)
      Cookies.set('CATERING_TOKEN', data.token, {
        expires: 1, // 1 day
        secure: true,
        sameSite: 'strict',
      })

      // ✅ Store user info in localStorage (CATERING prefix)
      localStorage.setItem('CATERING_ROLE', data.role || '')
      localStorage.setItem('CATERING_USER_ID', String(data.Id))

      toast.success('Logged in successfully')
    },
    onError: () => {
      toast.error('Verification failed')
    },
  })
}

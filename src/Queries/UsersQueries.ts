/**
 * -------------------------------------------
 * User Service Hooks - CRUD Operations
 * -------------------------------------------
 * Endpoints (from user-controller):
 *
 * GET    /api/admin/users
 * GET    /api/admin/users/{id}
 * POST   /api/admin/users
 * PUT    /api/admin/users/{id}
 * DELETE /api/admin/users/{id}
 */

import { apiRoutes } from '@/routes/apiRoutes'
import type { User, UserPayload } from '@/types/User'
import { authHandler } from '@/utils/authHandler'
import axiosInstance from '@/utils/axios'
import { handleApiError } from '@/utils/handleApiError'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

const USERS_KEY = ['users'] as const
const userKey = (id: number | string) => [...USERS_KEY, id] as const

/**
 * 🔍 Fetch all users
 */
export const useFetchUsers = () => {
  const fetchAll = async (): Promise<User[]> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(apiRoutes.users, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return (res.data?.data ?? []) as User[]
    } catch (error: unknown) {
      handleApiError(error, 'Fetching Users')
      return []
    }
  }

  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * 🔍 Fetch single user by id
 */
export const useFetchUserById = (id: number) => {
  const fetchById = async (): Promise<User> => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.get(`${apiRoutes.users}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.status !== 200) {
        throw new Error(res.data?.message || 'Failed to fetch user')
      }

      return res.data as User
    } catch (error) {
      handleApiError(error, 'User')
    }
  }

  return useQuery({
    queryKey: userKey(id),
    queryFn: fetchById,
    enabled: typeof id === 'number',
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })
}

/**
 * ➕ Create a new user
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient()

  const createUser = async (payload: UserPayload) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.post(apiRoutes.users, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      return res.data?.data as User
    } catch (error) {
      handleApiError(error, 'Create user')
    }
  }

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}

/**
 * ✏️ Edit an existing user
 */
export const useEditUser = () => {
  const queryClient = useQueryClient()

  const editUser = async (user: User) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const { userId, ...payload } = user
      if (!userId && userId !== 0) {
        throw new Error('User id is required')
      }

      const body: UserPayload = {
        ...payload,
        roles: payload.roles ?? [],
      }

      const res = await axiosInstance.put(
        `${apiRoutes.users}/${userId}`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data as User
    } catch (error) {
      handleApiError(error, 'ModifyUser')
    }
  }

  return useMutation({
    mutationFn: editUser,
    onSuccess: (_data, variables) => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      queryClient.invalidateQueries({ queryKey: userKey(variables.userId) })
    },
  })
}

/**
 * ❌ Delete a user
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  const deleteUser = async (user: User) => {
    try {
      const token = authHandler()
      if (!token) throw new Error('Unauthorized to perform this action.')

      const res = await axiosInstance.delete(
        `${apiRoutes.users}/${user.userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return res.data?.data
    } catch (error) {
      handleApiError(error, 'Delete User')
    }
  }

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}

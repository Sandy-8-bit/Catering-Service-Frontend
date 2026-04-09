import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Order } from '@/types/order'

interface OrderFormContextType {
  savedFormData: Order | null
  saveFormData: (data: Order) => void
  clearFormData: () => void
  getInitialFormData: (isNewOrder?: boolean) => Order | null
}

const OrderFormContext = createContext<OrderFormContextType | undefined>(
  undefined
)

const FORM_DATA_KEY = 'orderFormData'

export const OrderFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [savedFormData, setSavedFormData] = useState<Order | null>(null)

  // ✅ Load from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(FORM_DATA_KEY)
      if (storedData) {
        setSavedFormData(JSON.parse(storedData))
      }
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }, [])

  // ✅ Save
  const saveFormData = (data: Order) => {
    setSavedFormData(data)
    try {
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving form data:', error)
    }
  }

  // ✅ Clear
  const clearFormData = () => {
    setSavedFormData(null)
    try {
      localStorage.removeItem(FORM_DATA_KEY)
    } catch (error) {
      console.error('Error clearing form data:', error)
    }
  }

  // ✅ Get initial form data - use localStorage as initial data
  const getInitialFormData = (isNewOrder?: boolean): Order | null => {
    // If new order, clear and return null to use default
    if (isNewOrder) {
      clearFormData()
      return null
    }
    // Otherwise return saved data from localStorage
    return savedFormData
  }

  return (
    <OrderFormContext.Provider
      value={{ savedFormData, saveFormData, clearFormData, getInitialFormData }}
    >
      {children}
    </OrderFormContext.Provider>
  )
}

export const useOrderFormContext = () => {
  const context = useContext(OrderFormContext)
  if (!context) {
    throw new Error(
      'useOrderFormContext must be used within OrderFormProvider'
    )
  }
  return context
}
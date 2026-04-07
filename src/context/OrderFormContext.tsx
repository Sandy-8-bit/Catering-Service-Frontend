import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Order } from '@/types/order'

interface OrderFormContextType {
  savedFormData: Order | null
  saveFormData: (data: Order) => void
  clearFormData: () => void
  restoreFormData: () => Order | null
}

const OrderFormContext = createContext<OrderFormContextType | undefined>(
  undefined
)

const SESSION_FLAG = 'orderFormSessionActive'
const FORM_DATA_KEY = 'orderFormData'

export const OrderFormProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [savedFormData, setSavedFormData] = useState<Order | null>(null)

  // Load saved data from localStorage on mount
  // Clear data if it's a manual refresh (F5, Ctrl+R) or new session
  useEffect(() => {
    const isActiveSession = sessionStorage.getItem(SESSION_FLAG)
    
    // Detect if page was manually refreshed by checking navigation type
    const isPageRefresh = 
      performance.navigation.type === 1 || // Legacy API: reload type
      ((performance.getEntriesByType('navigation')[0] as any)?.type === 'reload') // Modern API with type assertion
    
    if (!isActiveSession || isPageRefresh) {
      // New session or manual refresh detected - clear form data
      localStorage.removeItem(FORM_DATA_KEY)
      setSavedFormData(null)
    } else {
      // Continuing from in-app navigation, restore saved data
      const storedData = localStorage.getItem(FORM_DATA_KEY)
      if (storedData) {
        try {
          setSavedFormData(JSON.parse(storedData))
        } catch (error) {
          console.error('Failed to parse stored order form data:', error)
        }
      }
    }
    
    // Mark this session as active for subsequent navigations
    sessionStorage.setItem(SESSION_FLAG, 'true')
  }, [])

  const saveFormData = (data: Order) => {
    setSavedFormData(data)
    localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data))
  }

  const clearFormData = () => {
    setSavedFormData(null)
    localStorage.removeItem(FORM_DATA_KEY)
  }

  const restoreFormData = (): Order | null => {
    return savedFormData
  }

  const value: OrderFormContextType = {
    savedFormData,
    saveFormData,
    clearFormData,
    restoreFormData,
  }

  return (
    <OrderFormContext.Provider value={value}>
      {children}
    </OrderFormContext.Provider>
  )
}

export const useOrderFormContext = () => {
  const context = useContext(OrderFormContext)
  if (!context) {
    throw new Error(
      'useOrderFormContext must be used within an OrderFormProvider'
    )
  }
  return context
}

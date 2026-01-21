import { useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useFetchDriverOrderDelivery } from '@/queries/driverQueries'

const DriverOrderPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  const { data, isLoading, isError } = useFetchDriverOrderDelivery({
    orderId: parsedOrderId,
  })

  useEffect(() => {
    if (data) {
      console.log('Driver Order Delivery Data:', data)
    }
  }, [data])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-xl font-semibold">
        Order Details (ID: {parsedOrderId})
      </h1>

      {isLoading && (
        <p className="text-sm text-slate-500">Loading...</p>
      )}

      {isError && (
        <p className="text-sm text-red-500">
          Failed to load order details
        </p>
      )}

      {!isLoading && !isError && (
        <p className="text-sm text-slate-600">
          Check console for API response
        </p>
      )}
    </div>
  )
}

export default DriverOrderPage

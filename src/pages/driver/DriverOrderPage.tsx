import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useFetchDriverOrderDelivery, useCompleteReturnDelivery, useUpdateReturnPickupDate, useUpdateDeliveryVessels } from '@/queries/driverQueries'
import type { DriverOrderDetail } from '@/types/driverOrderDetail'
import {
  MapPin,
  Phone,
  Calendar,
  Clock,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Truck,
  Plus,
} from 'lucide-react'

// Removed - vessel options are now loaded from API

const DriverOrderPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  const { data, isLoading, isError } = useFetchDriverOrderDelivery({
    orderId: parsedOrderId,
  })

  const order: DriverOrderDetail | undefined = data?.[0]

  const [vessels, setVessels] = useState<
    { id?: number; name: string; quantityGiven: number }[]
  >([])

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Vessel return tracking (for close order)
  const [vesselReturns, setVesselReturns] = useState<
    { id: number; quantityReturned: number }[]
  >([])

  // Payment details for close order
  const [amountCollected, setAmountCollected] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<string>('CASH')
  const [isCloseOrderLoading, setIsCloseOrderLoading] = useState(false)

  // Return pickup date for delivery
  const [returnPickupDate, setReturnPickupDate] = useState<string>('')
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false)

  // Add vessel form
  const [newVesselName, setNewVesselName] = useState<string>('')
  const [newVesselQuantity, setNewVesselQuantity] = useState<number>(0)
  const [isAddingVessel, setIsAddingVessel] = useState(false)

  const { mutate: completeReturn } = useCompleteReturnDelivery()
  const { mutate: updateReturnDate } = useUpdateReturnPickupDate()
  const { mutate: updateVessels } = useUpdateDeliveryVessels()

  const isDelivered = order?.orderStatus === 'DELIVERED'
  const isOrderDelivered = order?.orderStatus === 'ORDER_DELIVERED'
  const isPending = order?.orderStatus === 'PENDING'
  const isOutForDelivery = order?.orderStatus === 'OUT_FOR_DELIVERY'

  useEffect(() => {
    if (order?.vessels) {
      setVessels(order.vessels)
      // Initialize vessel returns
      const initialReturns = order.vessels.map(v => ({
        id: v.id,
        quantityReturned: 0,
      }))
      setVesselReturns(initialReturns)
      // Initialize amount collected with balance amount
      setAmountCollected(order.orderBalanceAmount)
    }
  }, [order])

  // Vessel data is loaded from API response

  // 🚚 Mark as Delivered
  const handleMarkAsDelivered = () => {
    // Clear previous messages
    setError('')
    setSuccess('')

    // Validation checks
    if (!returnPickupDate) {
      setError('Please select return pickup date')
      return
    }

    console.log('Marking as delivered with payload:', {
      deliveryId: order!.id,
      returnPickupDate,
    })

    setIsDeliveryLoading(true)

    updateReturnDate(
      {
        deliveryId: order!.id,
        returnPickupDate,
      },
      {
        onSuccess: (data) => {
          console.log('Order marked as delivered:', data)
          setSuccess('Order marked as delivered successfully!')
          setReturnPickupDate('')
          setIsDeliveryLoading(false)
        },
        onError: (error: any) => {
          console.error('Delivery error:', error?.response?.data || error)
          setError(error?.response?.data?.message || 'Failed to mark delivery. Please try again.')
          setIsDeliveryLoading(false)
        },
      }
    )
  }

  // 📦 Add Vessel
  const handleAddVessel = () => {
    // Clear previous messages
    setError('')
    setSuccess('')

    // Validation checks
    if (!newVesselName.trim()) {
      setError('Please select a vessel type')
      return
    }

    if (newVesselQuantity <= 0) {
      setError('Please enter valid quantity')
      return
    }

    console.log('Adding vessel with payload:', {
      driverId: order!.driverId,
      orderId: order!.orderId,
      vessels: [
        {
          name: newVesselName,
          quantityGiven: newVesselQuantity,
        },
      ],
    })

    setIsAddingVessel(true)

    updateVessels(
      {
        driverId: order!.driverId,
        orderId: order!.orderId,
        vessels: [
          {
            name: newVesselName,
            quantityGiven: newVesselQuantity,
          },
        ],
      },
      {
        onSuccess: (data) => {
          console.log('Vessel added successfully:', data)
          setSuccess('Vessel added successfully!')
          setNewVesselName('')
          setNewVesselQuantity(0)
          setIsAddingVessel(false)
          // Reset vessels from updated data
          if (data?.data && Array.isArray(data.data)) {
            const updatedVessels = data.data[0]?.vessels || []
            setVessels(updatedVessels)
          }
        },
        onError: (error: any) => {
          console.error('Add vessel error:', error?.response?.data || error)
          setError(error?.response?.data?.message || 'Failed to add vessel. Please try again.')
          setIsAddingVessel(false)
        },
      }
    )
  }

  //  Close Order
  const handleCloseOrder = async () => {
    // Clear previous messages
    setError('')
    setSuccess('')

    // Validation checks
    if (amountCollected <= 0) {
      setError('Please enter valid amount collected')
      return
    }

    if (!paymentMode) {
      setError('Please select payment mode')
      return
    }

    console.log('Closing order with payload:', {
      deliveryId: order!.id,
      vessels: vesselReturns,
      amountCollected,
      paymentMode,
    })

    setIsCloseOrderLoading(true)

    completeReturn(
      {
        deliveryId: order!.id,
        vessels: vesselReturns,
        amountCollected,
        paymentMode,
      },
      {
        onSuccess: (data) => {
          console.log('Order closed successfully:', data)
          setSuccess('Order closed successfully!')
          setVesselReturns(
            order!.vessels.map(v => ({
              id: v.id,
              quantityReturned: 0,
            }))
          )
          setAmountCollected(0)
          setPaymentMode('CASH')
          setIsCloseOrderLoading(false)
        },
        onError: (error: any) => {
          console.error('Close order error:', error?.response?.data || error)
          setError(error?.response?.data?.message || 'Failed to close order. Please try again.')
          setIsCloseOrderLoading(false)
        },
      }
    )
  }

  const handleVesselReturnChange = (vesselId: number, quantity: number) => {
    setVesselReturns(prev =>
      prev.map(v => (v.id === vesselId ? { ...v, quantityReturned: quantity } : v))
    )
  }

  if (isLoading)
    return <div className="p-6 text-center">Loading order...</div>

  if (isError || !order)
    return <div className="p-6 text-center">Failed to load order</div>

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ORDER_PLACED':
        return 'bg-yellow-100 text-yellow-800'
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-100 text-blue-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">

      {/* HEADER */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 shadow-md">
        <div className="flex justify-between">
          <h1 className="font-bold text-lg">Order #{order.orderId}</h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
              order.orderStatus
            )}`}
          >
            {order.orderStatus}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-green-700 font-medium text-sm">{success}</p>
          </div>
        )}

        {/* Customer Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900 text-lg">Customer Details</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="font-medium text-gray-900">{order.customerName}</p>
                <a href={`tel:${order.customerPhone}`} className="text-blue-600 text-sm">
                  {order.customerPhone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-gray-700 text-sm">{order.customerAddress}</p>
                {order.locationUrl && (
                  <a
                    href={order.locationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm font-medium"
                  >
                    Open in Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900 text-lg">Event Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-500">Event Type</p>
                <p className="font-medium text-gray-900 text-sm">{order.eventType}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-500">People</p>
                <p className="font-medium text-gray-900 text-sm">{order.totalPeople}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900 text-sm">
                  {new Date(order.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium text-gray-900 text-sm">
                  {order.eventTime.slice(0, 5)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-900 text-lg">Payment Summary</h2>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold text-gray-900">₹{order.orderTotalAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Advance Paid</span>
              <span className="font-semibold text-green-600">₹{order.orderAdvanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-900 font-medium">Balance to Collect</span>
              <span className={`font-bold text-lg ${order.orderBalanceAmount < 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(order.orderBalanceAmount).toFixed(2)}
                {order.orderBalanceAmount < 0 && ' (Overpaid)'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* VESSEL SECTION */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Vessels Information</h2>
            {vessels.length > 0 && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* VESSEL LIST */}
          {vessels.length > 0 ? (
            <div className="space-y-3">
              {vessels.map((v, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 md:flex-row md:justify-between md:items-center border rounded-md p-3 bg-gray-50"
                >
                  <div className="flex-1">
                    <span className="font-medium block">{v.name}</span>
                    <span className="text-sm text-gray-600">
                      Quantity Given: {v.quantityGiven}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-center py-4">No vessels added yet</p>

              {/* Add Vessel Form */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-blue-200">
                  <Plus className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Add Vessel</h3>
                </div>

                {/* Vessel Type Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Vessel Type *
                  </label>
                  <select
                    value={newVesselName}
                    onChange={e => setNewVesselName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base bg-white"
                  >
                    <option value="">Select Vessel Type</option>
                    <option value="Vessel A">Vessel A</option>
                    <option value="Vessel B">Vessel B</option>
                    <option value="Vessel C">Vessel C</option>
                    <option value="Vessel D">Vessel D</option>
                    <option value="Vessel E">Vessel E</option>
                    <option value="Vessel F">Vessel F</option>
                  </select>
                </div>

                {/* Quantity Input */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newVesselQuantity || ''}
                    onChange={e => setNewVesselQuantity(Number(e.target.value))}
                    placeholder="Enter quantity"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  />
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddVessel}
                  disabled={
                    isAddingVessel ||
                    !newVesselName ||
                    newVesselQuantity <= 0
                  }
                  className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm md:text-base hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                  {isAddingVessel ? 'Adding Vessel...' : 'Add Vessel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY SECTION - OUT FOR DELIVERY */}
      {isOutForDelivery && (
        <div className="p-4 md:p-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 md:p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="font-bold text-lg md:text-xl text-gray-900">Mark as Delivered</h2>
            </div>

            {/* Return Pickup Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <label className="block font-semibold text-gray-800 text-base md:text-lg">
                  Return Pickup Date
                </label>
              </div>
              <input
                type="date"
                value={returnPickupDate}
                onChange={e => setReturnPickupDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
              />
              <p className="text-xs md:text-sm text-gray-600">
                Select the date when items will be returned or picked up
              </p>
            </div>

            {/* Delivery Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900 text-sm">Order Details</p>
                  <p className="text-xs text-green-800 mt-1">Customer: <span className="font-medium">{order?.customerName}</span></p>
                  <p className="text-xs text-green-800">Location: <span className="font-medium">{order?.customerAddress}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Deliver Button */}
          <div className="mt-6 p-4 md:p-0">
            <button
              onClick={handleMarkAsDelivered}
              disabled={
                isDeliveryLoading ||
                !returnPickupDate
              }
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-base md:text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
              type="button"
            >
              {isDeliveryLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> 
                  <span>Marking Delivered...</span>
                </span>
              ) : (
                'Mark as Delivered'
              )}
            </button>
          </div>
        </div>
      )}

      {/* CLOSE ORDER SECTION */}
      {(isDelivered || isOrderDelivered || isPending) && (
        <div className="p-4 md:p-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 md:p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="font-bold text-lg md:text-xl text-gray-900">Complete Order</h2>
            </div>

            {/* Vessel Returns */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800 text-base md:text-lg">Vessel Returns</h3>
              </div>
              {order?.vessels && order.vessels.length > 0 ? (
                <div className="space-y-3">
                  {order.vessels.map(vessel => (
                    <div
                      key={vessel.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm md:text-base">{vessel.name}</p>
                          <p className="text-xs md:text-sm text-gray-600 mt-1">
                            Quantity Given: <span className="font-medium">{vessel.quantityGiven}</span>
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 w-full md:w-auto">
                          <label className="text-xs text-gray-600 font-medium">Quantity Returned</label>
                          <input
                            type="number"
                            min={0}
                            max={vessel.quantityGiven}
                            placeholder="0"
                            value={
                              vesselReturns.find(v => v.id === vessel.id)
                                ?.quantityReturned || ''
                            }
                            onChange={e =>
                              handleVesselReturnChange(
                                vessel.id,
                                Number(e.target.value)
                              )
                            }
                            className="w-full md:w-28 border border-gray-300 rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm text-center py-4">No vessels in this order</p>
              )}
            </div>

            {/* Amount Collected */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <label className="block font-semibold text-gray-800 text-base md:text-lg">
                  Amount Collected
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold text-base md:text-lg">₹</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={amountCollected || ''}
                  onChange={e => setAmountCollected(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs md:text-sm text-gray-600 flex justify-between">
                <span>Balance to collect:</span>
                <span className={`font-semibold ${order?.orderBalanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{order?.orderBalanceAmount.toFixed(2)}
                </span>
              </p>
            </div>

            {/* Payment Mode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                <label className="block font-semibold text-gray-800 text-base md:text-lg">
                  Payment Mode
                </label>
              </div>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-sm md:text-base font-medium"
              >
                <option value="CASH">💵 Cash</option>
                <option value="CARD">💳 Card</option>
                <option value="UPI">📱 UPI</option>
                <option value="ONLINE_TRANSFER">🏦 Online Transfer</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* CLOSE ORDER BUTTON */}
      {(isDelivered || isOrderDelivered || isPending) && (
        <div className="p-4 mt-6 border-t">
          <button
            onClick={handleCloseOrder}
            disabled={
              isCloseOrderLoading ||
              amountCollected <= 0
            }
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold text-base md:text-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60 transition-all shadow-md hover:shadow-lg"
            type="button"
          >
            {isCloseOrderLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> 
                <span>Closing Order...</span>
              </span>
            ) : (
              'Close Order'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default DriverOrderPage

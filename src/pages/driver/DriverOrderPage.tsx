import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useFetchDriverOrderDelivery } from '@/queries/driverQueries'
import { useUpdateDeliveryVessels } from '@/queries/driverQueries'
import type { DriverOrderDetail } from '@/types/driverOrderDetail'
import { MapPin, Phone, Calendar, Clock, Users, Package, AlertCircle, CheckCircle } from 'lucide-react'

const DriverOrderPage = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const parsedOrderId = Number(orderId)

  const { data, isLoading, isError } = useFetchDriverOrderDelivery({
    orderId: parsedOrderId,
  })

  const order: DriverOrderDetail | undefined = data?.[0]

  const [vessels, setVessels] = useState<
    {
      id?: number
      name: string
      quantityGiven: number
     
    }[]
  >([])

  const [newVesselName, setNewVesselName] = useState('')
const [newVesselQty, setNewVesselQty] = useState<number>(0)

const handleAddVessel = () => {
  setError('')
  setSuccess('')

  if (!newVesselName.trim()) {
    setError('Vessel name is required')
    return
  }

  if (newVesselQty <= 0) {
    setError('Quantity must be greater than 0')
    return
  }

  setVessels(prev => [
    ...prev,
    {
      name: newVesselName.trim(),
      quantityGiven: newVesselQty,
    },
  ])

  // reset inputs
  setNewVesselName('')
  setNewVesselQty(0)
}

  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')

  const { mutate: updateVessels, isPending: isUpdating } =
    useUpdateDeliveryVessels()

  useEffect(() => {
    if (order?.vessels) {
      setVessels(order.vessels)
      setError('')
      setSuccess('')
    }
  }, [order])


  
const validateVessels = () => {
  if (vessels.length === 0) {
    setError('Please add at least one vessel')
    return false
  }
  return true
}

const isEditingVessels = vessels.length > 0

  const handleSave = () => {
    setError('')
    setSuccess('')

    if (!validateVessels()) {
      return
    }

    updateVessels(
      {
        driverId: order!.driverId,
        orderId: order!.orderId,
        vessels: vessels.map(v => ({
          name: v.name,
          quantityGiven: v.quantityGiven,
        })),
      },
      {
        onSuccess: () => {
          setSuccess('Vessel information saved successfully! Starting delivery...')
          setTimeout(() => {
            setSuccess('')
          }, 3000)
        },
        onError: (err: any) => {
          const errorMessage =
            err?.response?.data?.message ||
            err?.message ||
            'Failed to save vessel information. Please try again.'
          setError(errorMessage)
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Failed to load order details</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Order #{order.orderId}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
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
{/* Add Vessel Card */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col gap-4">
<h2 className="font-semibold text-gray-900 text-lg">
  {isEditingVessels ? 'Edit Vessels' : 'Add Vessels'}
</h2>


  {/* Input Row */}
  <div className="flex gap-3">
    <input
      type="text"
      placeholder="Vessel name"
      value={newVesselName}
      onChange={e => setNewVesselName(e.target.value)}
      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
    />

    <input
      type="number"
      min={1}
      placeholder="Qty"
      value={newVesselQty || ''}
      onChange={e => setNewVesselQty(Number(e.target.value))}
      className="w-24 border border-gray-300 rounded-md px-3 py-2 text-center focus:ring-2 focus:ring-blue-500"
    />

   <button
  onClick={handleAddVessel}
  className="bg-blue-600 text-white px-4 rounded-md font-medium hover:bg-blue-700"
>
  {isEditingVessels ? 'Add More' : 'Add'}
  </button>
  </div>

  {/* Vessel List */}
  {vessels.length > 0 && (
    <div className="flex flex-col gap-2">
      {vessels.map((v, i) => (
        <div
          key={i}
          className="flex items-center justify-between border border-gray-100 rounded-md p-3"
        >
          <p className="font-medium text-gray-900">{v.name}</p>
          <span className="font-semibold text-blue-600">
            Qty: {v.quantityGiven}
          </span>
        </div>
      ))}
    </div>
  )}
    </div> 
      </div>
        <div className=" bg-white border-t border-gray-200 p-4 shadow-lg">
          <button
            onClick={handleSave}
            disabled={isUpdating || vessels.every(v => v.quantityGiven === 0)}
            className={`w-full font-semibold py-4 rounded-lg text-lg transition-colors shadow-md flex items-center justify-center gap-2 ${
              isUpdating || vessels.every(v => v.quantityGiven === 0)
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white active:bg-blue-700 hover:bg-blue-700'
            }`}
          >
            {isUpdating ? (
              <>
                <span className="inline-block animate-spin">⟳</span>
                Saving...
              </>
            ) : (
              'Confirm & Start Delivery'
            )}
          </button>
        </div>
    </div>
  )
}

export default DriverOrderPage
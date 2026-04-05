import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useFetchDriverOrderDelivery,
  useCompleteReturnDelivery,
  useUpdateReturnPickupDate,
  useUpdateDeliveryVessels,
} from '@/queries/driverQueries'
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
  Trash2,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'
import { appRoutes } from '@/routes/appRoutes'

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusClass: Record<string, string> = {
  ORDER_PLACED: 'bg-zinc-100 text-zinc-700',
  OUT_FOR_DELIVERY: 'bg-orange-50 text-orange-600',
  DELIVERED: 'bg-green-50 text-green-700',
  ORDER_DELIVERED: 'bg-green-50 text-green-700',
  PENDING: 'bg-zinc-100 text-zinc-600',
}

// ── Component ─────────────────────────────────────────────────────────────────

const DriverOrderPage = () => {
  const { t } = useTranslation()
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
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

  const [vesselReturns, setVesselReturns] = useState<
    { id: number; quantityReturned: number }[]
  >([])
  const [amountCollected, setAmountCollected] = useState<number>(0)
  const [paymentMode, setPaymentMode] = useState<string>('CASH')
  const [isCloseOrderLoading, setIsCloseOrderLoading] = useState(false)

  const [returnPickupDate, setReturnPickupDate] = useState<string>('')
  const [isDeliveryLoading, setIsDeliveryLoading] = useState(false)

  const [newVesselName, setNewVesselName] = useState<string>('')
  const [newVesselQuantity, setNewVesselQuantity] = useState<number>(0)

  const [pendingVessels, setPendingVessels] = useState<
    { name: string; quantityGiven: number; quantityReturned: 0 }[]
  >([])
  const [isStartingOrder, setIsStartingOrder] = useState(false)

  const { mutate: completeReturn } = useCompleteReturnDelivery()
  const { mutate: updateReturnDate } = useUpdateReturnPickupDate()
  const { mutate: updateVessels } = useUpdateDeliveryVessels()

  const isDelivered = order?.orderStatus === 'DELIVERED'
  const isOrderDelivered = order?.orderStatus === 'ORDER_DELIVERED'
  const isPending = order?.orderStatus === 'PENDING'
  const isOutForDelivery = order?.orderStatus === 'OUT_FOR_DELIVERY'
  const orderplaced = order?.orderStatus === 'ORDER_PLACED'
  const statusLabel: Record<string, string> = {
    ORDER_PLACED: t('driver_status_order_placed'),
    OUT_FOR_DELIVERY: t('driver_status_out_for_delivery'),
    DELIVERED: t('driver_status_delivered'),
    ORDER_DELIVERED: t('driver_status_order_delivered'),
    PENDING: t('driver_status_pending'),
  }

  useEffect(() => {
    if (order?.vessels) {
      setVessels(order.vessels)
      setVesselReturns(
        order.vessels.map((v) => ({ id: v.id, quantityReturned: 0 }))
      )
      setAmountCollected(order.orderBalanceAmount)
    }
  }, [order])

  const handleMarkAsDelivered = () => {
    setError('')
    setSuccess('')
    if (!returnPickupDate) {
      setError(t('driver_select_return_pickup_date'))
      return
    }
    setIsDeliveryLoading(true)
    updateReturnDate(
      { deliveryId: order!.id, returnPickupDate },
      {
        onSuccess: () => {
          setSuccess(t('driver_order_marked_delivered'))
          setReturnPickupDate('')
          setIsDeliveryLoading(false)
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              t('driver_failed_mark_delivery')
          )
          setIsDeliveryLoading(false)
        },
      }
    )
  }

  const handleAddVessel = () => {
    setError('')
    setSuccess('')
    if (!newVesselName.trim()) {
      setError(t('driver_select_vessel_type'))
      return
    }
    if (newVesselQuantity <= 0) {
      setError(t('driver_enter_valid_quantity'))
      return
    }
    setPendingVessels((prev) => [
      ...prev,
      {
        name: newVesselName,
        quantityGiven: newVesselQuantity,
        quantityReturned: 0,
      },
    ])
    setNewVesselName('')
    setNewVesselQuantity(0)
  }

  const handleRemovePendingVessel = (index: number) =>
    setPendingVessels((prev) => prev.filter((_, i) => i !== index))

  const handlePendingQuantityChange = (index: number, quantity: number) =>
    setPendingVessels((prev) =>
      prev.map((v, i) => (i === index ? { ...v, quantityGiven: quantity } : v))
    )

  const handleStartOrder = () => {
    setError('')
    setSuccess('')
    if (pendingVessels.length === 0) {
      setError(t('driver_add_at_least_one_vessel'))
      return
    }
    setIsStartingOrder(true)
    updateVessels(
      {
        driverId: order!.driverId,
        orderId: order!.orderId,
        vessels: pendingVessels,
      },
      {
        onSuccess: (data) => {
          setSuccess(t('driver_order_started_success'))
          setPendingVessels([])
          setIsStartingOrder(false)
          if (data?.data && Array.isArray(data.data)) {
            setVessels(data.data[0]?.vessels || [])
          }
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              t('driver_failed_start_order')
          )
          setIsStartingOrder(false)
        },
      }
    )
  }

  const handleCloseOrder = async () => {
    setError('')
    setSuccess('')
    if (amountCollected <= 0) {
      setError(t('driver_enter_valid_amount_collected'))
      return
    }
    if (!paymentMode) {
      setError(t('driver_select_payment_mode'))
      return
    }
    setIsCloseOrderLoading(true)
    completeReturn(
      {
        deliveryId: order!.id,
        vessels: vesselReturns,
        amountCollected,
        paymentMode,
      },
      {
        onSuccess: () => {
          setSuccess(t('driver_order_closed_success'))
          setVesselReturns(
            order!.vessels.map((v) => ({ id: v.id, quantityReturned: 0 }))
          )
          setAmountCollected(0)
          setPaymentMode('CASH')
          setIsCloseOrderLoading(false)
        },
        onError: (err: any) => {
          setError(
            err?.response?.data?.message ||
              t('driver_failed_close_order')
          )
          setIsCloseOrderLoading(false)
        },
      }
    )
  }

  const handleVesselReturnChange = (vesselId: number, quantity: number) =>
    setVesselReturns((prev) =>
      prev.map((v) =>
        v.id === vesselId ? { ...v, quantityReturned: quantity } : v
      )
    )

  const handleBack = () => {
    const storedDriverId = Number(localStorage.getItem('CATERING_USER_ID'))
    const fallbackDriverId = order?.driverId ?? storedDriverId
    const fallbackPath = fallbackDriverId
      ? `/driver/driver-dashboard/${fallbackDriverId}`
      : appRoutes.signInPage

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallbackPath, { replace: true })
  }

  const balanceAmount = order ? order.orderTotalAmount - (order.amountReceived || 0) : 0

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
          <p className="text-xs text-zinc-500">{t('driver_loading_order')}</p>
        </div>
      </div>
    )

  if (isError || !order)
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">{t('driver_failed_load_order')}</p>
      </div>
    )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-50 pb-10">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('back')}
          </button>
          <div className="h-7 w-px bg-zinc-200" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-zinc-400">{t('order')}</p>
            <p className="truncate text-base font-bold text-zinc-900">
              #{order.orderId}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusClass[order.orderStatus] ?? 'bg-zinc-100 text-zinc-600'}`}
        >
          {statusLabel[order.orderStatus] ?? order.orderStatus}
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        {/* ── Alerts ── */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-3">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <p className="text-sm font-medium text-green-700">{success}</p>
          </div>
        )}

        {/* ── Customer Details ── */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
          <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            {t('customer')}
          </p>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {order.customerName}
              </p>
              <a
                href={`tel:${order.customerPhone}`}
                className="text-sm font-medium text-orange-600"
              >
                {order.customerPhone}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div>
              <p className="text-sm leading-relaxed text-zinc-700">
                {order.customerAddress}
              </p>
              {order.locationUrl && (
                <a
                  href={order.locationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-medium text-orange-600"
                >
                  {t('open_in_maps')} 
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Event Details ── */}
        <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
          <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
            {t('event')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-400">{t('driver_type')}</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {order.eventType}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-400">{t('total_people')}</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {order.totalPeople}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-400">{t('event_date')}</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {new Date(order.eventDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div>
                <p className="text-[11px] text-zinc-400">{t('event_time')}</p>
                <p className="text-sm font-semibold text-zinc-900">
                  {order.eventTime.slice(0, 5)}
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* ── Vessels ── */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              {t('driver_vessels')}
            </p>
            {vessels.length + pendingVessels.length > 0 && (
              <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
                {t('driver_vessel_count', {
                  count: vessels.length + pendingVessels.length,
                })}
              </span>
            )}
          </div>

          {/* Saved */}
          {vessels.length > 0 && (
            <div className="flex flex-col gap-2">
              {vessels.map((v, i) => (
                <div
                  key={v.id ?? i}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5"
                >
                  <span className="text-sm font-medium text-zinc-900">
                    {v.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t('quantity')}:{' '}
                    <span className="font-semibold text-zinc-800">
                      {v.quantityGiven}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Locally added */}
          {pendingVessels.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                {t('driver_newly_added')}
              </p>
              {pendingVessels.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5"
                >
                  <span className="flex-1 text-sm font-medium text-zinc-900">
                    {v.name}
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={v.quantityGiven || ''}
                    onChange={(e) =>
                      handlePendingQuantityChange(i, Number(e.target.value))
                    }
                    className="w-16 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-center text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleRemovePendingVessel(i)}
                    className="p-1 text-zinc-400 transition-colors hover:text-red-500"
                    type="button"
                    aria-label={t('remove')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {vessels.length === 0 && pendingVessels.length === 0 && (
            <p className="py-3 text-center text-sm text-zinc-400">
              {t('driver_no_vessels_added')}
            </p>
          )}

          {/* Add vessel form */}
          {orderplaced && (
            <div className="flex flex-col gap-2.5 border-t border-zinc-100 pt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                <Plus className="h-3.5 w-3.5" /> {t('driver_add_vessel')}
              </p>
              <select
                value={newVesselName}
                onChange={(e) => setNewVesselName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="">{t('driver_select_vessel_type')}</option>
                <option value="Drum">Drum</option>
                <option value="Milk can">Milk can</option>
                <option value="Drum Cap">Drum Cap</option>
              </select>
              <input
                type="number"
                min={1}
                value={newVesselQuantity || ''}
                onChange={(e) => setNewVesselQuantity(Number(e.target.value))}
                placeholder={t('quantity')}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <button
                onClick={handleAddVessel}
                disabled={!newVesselName || newVesselQuantity <= 0}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                type="button"
              >
                <Plus className="h-4 w-4" /> {t('add')}
              </button>
            </div>
          )}

          {/* Start Order */}
          {pendingVessels.length > 0 && (
            <button
              onClick={handleStartOrder}
              disabled={isStartingOrder}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              <Truck className="h-4 w-4" />
              {isStartingOrder ? t('driver_starting') : t('driver_start_order')}
            </button>
          )}
        </div>

        {/* ── Delivery Section ── */}
        {isOutForDelivery && (
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
            <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              {t('driver_mark_delivered')}
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t('driver_return_pickup_date')}
              </label>
              <input
                type="date"
                value={returnPickupDate}
                onChange={(e) => setReturnPickupDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleMarkAsDelivered}
              disabled={isDeliveryLoading || !returnPickupDate}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {isDeliveryLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{' '}
                  {t('driver_marking')}
                </>
              ) : (
                t('driver_mark_as_delivered')
              )}
            </button>
          </div>
        )}

        {/* ── Close Order Section ── */}
        {(isDelivered || isOrderDelivered || isPending) && (
          <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white px-4 py-3.5">
            <p className="text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              {t('driver_complete_order')}
            </p>

            {/* Vessel Returns */}
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <Package className="h-4 w-4 text-zinc-400" /> {t('driver_vessel_returns')}
              </p>
              {order?.vessels && order.vessels.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {order.vessels.map((vessel) => (
                    <div
                      key={vessel.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {vessel.name}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {t('driver_given')}: {vessel.quantityGiven}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <label className="text-[11px] text-zinc-400">
                          {t('driver_returned')}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={vessel.quantityGiven}
                          placeholder="0"
                          value={
                            vesselReturns.find((v) => v.id === vessel.id)
                              ?.quantityReturned || ''
                          }
                          onChange={(e) =>
                            handleVesselReturnChange(
                              vessel.id,
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-3 text-center text-sm text-zinc-400">
                  {t('driver_no_vessels_order')}
                </p>
              )}
            </div>

            {/* Vessel Return Summary */}
            {order?.vessels && order.vessels.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-blue-100 px-3 py-2.5">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  ✓ {t('driver_vessel_return_summary') || 'Vessel Return Status'}
                </p>
                <div className="flex flex-col gap-1.5">
                  {order.vessels.map((vessel) => {
                    const returned = vesselReturns.find((v) => v.id === vessel.id)
                      ?.quantityReturned || 0
                    const pending = vessel.quantityGiven - returned
                    return (
                      <div key={vessel.id} className="flex items-center justify-between">
                        <span className="text-sm text-black-900">
                          {vessel.name}
                        </span>
                        <span className="text-xs font-medium text-blue-700">
                          Returned: <span className="font-bold">{vessel.quantityReturned}</span> / {vessel.quantityGiven}
                         
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Amount Collected */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                <CreditCard className="h-4 w-4 text-zinc-400" /> {t('driver_amount_collected')}
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-zinc-500">
                  ₹
                </span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={balanceAmount || ''}
                  onChange={(e) => setAmountCollected(Number(e.target.value))}
                  className="w-full rounded-lg border border-zinc-300 py-2.5 pr-4 pl-7 text-sm focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{t('driver_balance_to_collect')}</span>
                <span
                  className={`font-semibold ${order?.orderBalanceAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}
                >
                  ₹{order?.orderBalanceAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="flex flex-col gap-2 rounded-lg border border-green-100 px-3 py-2.5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                💰 {t('driver_payment_summary') || 'Payment Status'}
              </p>
              <div className="flex flex-col gap-1.5">

                   <div className="flex items-center justify-between border-t border-green-200 pt-1.5">
                  <span className="text-sm text-gray-900 font-medium">
                    {t('driver_total_order_amount') || 'Total Order Amount'}
                  </span>
                  <span className="text-sm font-bold text-green-800">
                    ₹{order?.orderTotalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-900">
                    {t('driver_amount_already_received') || 'Amount Already Received'}
                  </span>
                  <span className="text-sm font-bold text-green-700">
                    ₹{order?.amountReceived?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-green-200 pt-1.5">
                  <span className="text-sm text-gray-900 font-medium">
                    {t('driver_balance_amount') || 'Balance Amount Due'}
                  </span>
                  <span
                    className={`text-sm font-bold ${order?.orderTotalAmount - (order?.amountReceived || 0) > 0 ? 'text-orange-600' : 'text-green-700'}`}
                  >
                    ₹{Math.abs(order?.orderTotalAmount - (order?.amountReceived || 0)).toFixed(2)}
                    {order?.orderTotalAmount - (order?.amountReceived || 0) < 0 && ` (${t('driver_overpaid') || 'Overpaid'})`}
                  </span>
                </div>
             
              </div>
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-800">
                {t('driver_payment_mode')}
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 focus:border-transparent focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="CASH">{t('driver_cash')}</option>
                <option value="CARD">{t('driver_card')}</option>
                <option value="UPI">UPI</option>
                <option value="ONLINE_TRANSFER">{t('driver_online_transfer')}</option>
              </select>
            </div>

            {/* Close button */}
            <button
              onClick={handleCloseOrder}
              disabled={isCloseOrderLoading || amountCollected <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
            >
              {isCloseOrderLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{' '}
                  {t('driver_closing')}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> {t('driver_close_order')}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DriverOrderPage

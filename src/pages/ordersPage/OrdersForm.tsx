import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ButtonSm from '@/components/common/Buttons'
import Input, { InputCheckbox } from '@/components/common/Input'
import lodash from 'lodash'
import {
  useCreateOrder,
  useFetchOrderById,
  useUpdateOrder,
} from '@/queries/ordersQueries'
import type { Order } from '@/types/order'
import { useFetchAdditionalItems } from '@/queries/additionalItemsQueries'
import {
  defaultOrderData,
  eventTypeOptions,
  paymentTypeOptions,
} from '@/constants/constants'
import DropdownSelect from '@/components/common/DropDown'
import DateInput from '@/components/common/DateInput'
import TimeInput from '@/components/common/TimeInput'
import ProductMenuSelector from '@/components/orders/ProductMenuSelector'
import AdditionalItemsSelector from '@/components/orders/AdditionalItemsSelector'
import AdditionalMenuSelector from '@/components/orders/AdditionalMenuSelector'
import { mapOrderToUpdatePayload, mapOrderToPayload } from '@/utils/TypeMappers'
import SkeletonForm from '@/components/common/Skleton'
import { ArrowLeft } from 'lucide-react'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchUsers } from '@/queries/usersQueries'
import { useFetchProducts } from '@/queries/productQueries'
import {
  calculateMenuItemsSubtotal,
  calculateOneLeafPrice,
  calculateAdditionalMenuItemsSubtotal,
  calculateAdditionalItemsSubtotal,
  calculateSubtotalBeforeDelivery,
  calculateDiscountFromPercentage,
  calculateDiscountPercentageFromAmount,
} from '@/utils/ordersCalculations'
import VoiceInput from '@/components/common/VoiceInput'
import { useOrderFormContext } from '@/context/OrderFormContext'

export const OrdersForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  const selectedDateParam = searchParams.get('selectedDate')
  const orderIdParam = Number(searchParams.get('orderId'))
  const orderId = Number.isFinite(orderIdParam) ? orderIdParam : undefined
  const { data: user = [], isLoading: isUserOptionLoading } = useFetchUsers()
  const { data: products = [] } = useFetchProducts()
  const { data: existingOrder, isLoading: isOrderLoading } =
    useFetchOrderById(orderId)

  const { data: additionalItems = [], isLoading: isAdditionalLoading } =
    useFetchAdditionalItems()

  const { saveFormData, clearFormData } = useOrderFormContext()
  const [editData, setEditData] = useState<Order>(defaultOrderData)

  const { mutate: createOrder, isPending: isCreatePending } = useCreateOrder()
  const { mutate: updateOrder, isPending: isUpdatePending } = useUpdateOrder()

useEffect(() => {
  if (isEditMode) {
    if (existingOrder) {
      setEditData(existingOrder)
    }
    return
  }

  // Create mode
  let initialData: Order = defaultOrderData

  try {
    const stored = localStorage.getItem('orderFormData')
    if (stored) {
      initialData = JSON.parse(stored)
    }
  } catch (err) {
    console.error("Failed to load from localStorage", err)
  }

  if (selectedDateParam) {
    initialData = {
      ...initialData,
      eventDate: selectedDateParam,
    }
  }

  setEditData(initialData)
}, [isEditMode, existingOrder, selectedDateParam])
  // Auto-save form data to localStorage whenever it changes (only in create mode)
  useEffect(() => {
    if (isEditMode ) return

    const timer = setTimeout(() => {
      saveFormData(editData)
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
  }, [editData, saveFormData, isEditMode])

  const isPaymentTypeRequired = (editData.advanceAmount || 0) > 0

  const handleCreateOrder = () => {
    createOrder(mapOrderToPayload(editData), {
      onSuccess: () => {
        clearFormData() // Clear saved data on successful submission
        navigate(appRoutes.orders.path)
      },
    })
  }

  const handleUpdateOrder = () => {
    updateOrder(mapOrderToUpdatePayload(editData, existingOrder), {
      onSuccess: () => {
        clearFormData() // Clear saved data on successful submission
        navigate(appRoutes.orders.path)
      },
    })
  }

  const driverOptions = user
    .filter((user) => user.role === 'DRIVER')
    .map((driver) => ({
      id: driver.userId,
      label: driver.name,
    }))

  // Calculate totals
  useEffect(() => {
    const menuItemsSubtotal = calculateMenuItemsSubtotal(editData)

    const additionalMenuItemsSubtotal = (
      editData.additionalMenuItems ?? []
    ).reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price ?? 0) * item.quantity
    }, 0)

    const additionalItemsSubtotal =
      editData.additionalItems?.reduce(
        (sum, item) => sum + (item.lineTotal || 0),
        0
      ) || 0

    const subtotalBeforeDelivery =
      menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal

    const deliveryCharge = editData.deliveredByUs
      ? editData.deliveryCharge || 0
      : 0

    const grossTotal = subtotalBeforeDelivery + deliveryCharge

    let discountAmount = 0
    if (editData.discountAmount && editData.discountAmount > 0) {
      discountAmount = editData.discountAmount
    } else if (editData.discountPercentage && editData.discountPercentage > 0) {
      discountAmount = Math.round(
        grossTotal * (editData.discountPercentage / 100)
      )
    }

    const netTotal = Math.round(grossTotal - discountAmount)
    const balance = netTotal - (editData.advanceAmount || 0)

    setEditData((prev) => ({
      ...prev,
      totalAmount: netTotal,
      balanceAmount: balance,
    }))
  }, [
    editData.items,
    editData.additionalMenuItems,
    editData.additionalItems,
    editData.deliveredByUs,
    editData.deliveryCharge,
    editData.discountAmount,
    editData.discountPercentage,
    editData.advanceAmount,
    editData.totalPlates,
    editData.priceReducedPerPlate,
    products,
  ])

  const getSubtotalBeforeDelivery = () => {
    return calculateSubtotalBeforeDelivery(editData, products)
  }

  const handleDiscountPercentageChange = (value: string) => {
    const percentage = Number(value)
    const subtotal = getSubtotalBeforeDelivery()
    const calculatedAmount = calculateDiscountFromPercentage(
      subtotal,
      percentage
    )
    setEditData((prev) => ({
      ...prev,
      discountPercentage: percentage,
      discountAmount: calculatedAmount,
    }))
  }

  const handleDiscountAmountChange = (value: string) => {
    const amount = Number(value)
    const subtotal = getSubtotalBeforeDelivery()
    const calculatedPercentage = calculateDiscountPercentageFromAmount(
      subtotal,
      amount
    )
    setEditData((prev) => ({
      ...prev,
      discountAmount: amount,
      discountPercentage: calculatedPercentage,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const handleClearForm = () => {
    setEditData(defaultOrderData)
    clearFormData()
  }

  const TIME_PRESETS = [
    { label: t('tiffin'), value: '07:00:00' },
    { label: t('lunch'), value: '11:00:00' },
    { label: t('dinner'), value: '19:00:00' },
  ]

  const safeNumber = (value: string | number | undefined) => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Check if form is valid for submission
  const isFormValidForSubmit = (): boolean => {
    const hasName = !!(editData.customerName && editData.customerName.trim() !== '')
    const hasPhone = !!(editData.customerPhone && editData.customerPhone.trim() !== '')
    return hasName && hasPhone
  }

  if (isOrderLoading || isUserOptionLoading || isAdditionalLoading)
    return <SkeletonForm inputCount={12} />

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex w-max flex-row items-center gap-2 text-start text-xl font-semibold text-zinc-800">
          <ArrowLeft
            onClick={() => {
              navigate(-1)
            }}
            size={24}
            className="cursor-pointer hover:scale-105 active:scale-110"
          />
          {isEditMode ? t('edit_order') : t('create_order')}
        </h1>
        <ActionButtons
          isEditMode={isEditMode}
          editData={editData}
          existingOrder={existingOrder}
          defaultOrderData={defaultOrderData}
          setEditData={setEditData}
          navigate={navigate}
          onCreateOrder={handleCreateOrder}
          onUpdateOrder={handleUpdateOrder}
          onClearForm={() => {
            clearFormData()
            setEditData(defaultOrderData)
          }}
          isCreatePending={isCreatePending}
          isUpdatePending={isUpdatePending}
          isFormValid={isFormValidForSubmit()}
        />
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-5 p-4 sm:p-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Customer Information */}
          <header className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              {t('customer_information')}
            </h2>
            <p className="text-sm text-zinc-500">{t('form_intro_text')}</p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <VoiceInput
              title={t('name')}
              name="customerName"
              placeholder={t('eg_name')}
              inputValue={editData.customerName}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  customerName: value,
                }))
              }
              required
            />

            <Input
              title={t('phone_number')}
              name="phoneNumber"
              prefixText="+91"
              placeholder={t('phone_placeholder')}
              inputValue={editData.customerPhone}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  customerPhone: value,
                }))
              }
              required
            />

            <Input
              title={t('address')}
              name="address"
              placeholder={t('address_placeholder')}
              inputValue={editData.customerAddress}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  customerAddress: value,
                }))
              }
            />

            <DropdownSelect
              title={t('event_type')}
              options={eventTypeOptions}
              required
              selected={
                eventTypeOptions.find(
                  (option) => option.label === editData.eventType
                ) || { id: 0, label: t('select_event_type') }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, eventType: option.label }))
              }
            />

            <DateInput
              title={t('event_date')}
              value={editData.eventDate}
              onChange={(value) =>
                setEditData((prev) => ({ ...prev, eventDate: value }))
              }
            />
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-700">
                {t('event_time')}
              </label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setEditData((prev) => ({
                        ...prev,
                        eventTime: preset.value,
                      }))
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      editData.eventTime === preset.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <TimeInput
                title=""
                name="time"
                value={editData.eventTime}
                onChange={(value) =>
                  setEditData((prev) => ({
                    ...prev,
                    eventTime: value.length === 5 ? `${value}:00` : value,
                  }))
                }
              />
            </div>
            <Input
              title={t('total_plates')}
              prefixText={t('count')}
              placeholder=""
              inputValue={editData.totalPlates?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  totalPlates: safeNumber(value),
                }))
              }
            />
          </div>
          {/* Delivery & Payment */}
          <header className="mt-6 space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              {t('delivery_payment')}
            </h2>
            <p className="text-sm text-zinc-500">
              {t('delivery_payment_text')}
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            <InputCheckbox
              title={t('delivery_by_us')}
              checked={editData.deliveredByUs}
              onChange={(checked) =>
                setEditData((prev) => ({ ...prev, deliveredByUs: checked }))
              }
              label={t('delivery_preference')}
            />
            {editData.deliveredByUs && (
              <>
                <DropdownSelect
                  title={t('assign_driver')}
                  options={driverOptions}
                  required
                  selected={
                    driverOptions.find(
                      (option) => option.id === editData.driver?.driverId
                    ) || { id: 0, label: t('select_driver') }
                  }
                  onChange={(option) =>
                    setEditData((prev) => ({
                      ...prev,
                      driver: {
                        driverId: option.id,
                        driverName: option.label,
                        driverNumber: '',
                      },
                    }))
                  }
                />
                <Input
                  title={t('delivery_charges')}
                  prefixText="₹"
                  placeholder="0"
                  inputValue={editData.deliveryCharge?.toString() || ''}
                  onChange={(value) =>
                    setEditData((prev) => ({
                      ...prev,
                      deliveryCharge: safeNumber(value),
                    }))
                  }
                />
                <Input
                  title={t('location_url')}
                  name="Location Url"
                  placeholder={t('location_url_placeholder')}
                  inputValue={editData.locationUrl}
                  onChange={(value) =>
                    setEditData((prev) => ({
                      ...prev,
                      locationUrl: value,
                    }))
                  }
                />
              </>
            )}
          </div>

          {/* Menu items */}
          <ProductMenuSelector
            selectedItems={editData.items}
            onChange={(items) =>
              setEditData((prev) => ({
                ...prev,
                items,
              }))
            }
          />

          {/* Additional Menu Items */}
          <AdditionalMenuSelector
            selectedItems={editData.additionalMenuItems ?? []}
            onChange={(items) =>
              setEditData((prev) => ({
                ...prev,
                additionalMenuItems: items,
              }))
            }
          />

          {/* Additional Items */}
          <AdditionalItemsSelector
            availableItems={additionalItems}
            selectedItems={editData.additionalItems ?? []}
            isLoading={isAdditionalLoading}
            onChange={(items) =>
              setEditData((prev) => ({
                ...prev,
                additionalItems: items,
              }))
            }
          />

          <header className="mt-6 space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              {t('payment')}
            </h2>
            <p className="text-sm text-zinc-500">{t('payment_text')}</p>
          </header>

          {/* Total Amount Display */}
          {(() => {
            const menuItemsSubtotal = calculateMenuItemsSubtotal(editData)
            const additionalMenuItemsSubtotal =
              calculateAdditionalMenuItemsSubtotal(editData, products)
            const additionalItemsSubtotal =
              calculateAdditionalItemsSubtotal(editData)
            const oneLeafPrice = calculateOneLeafPrice(editData)

            return (
              <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:p-5">
                <div className="flex justify-between gap-3 text-sm text-zinc-600">
                  <span>{t('one_leaf_price')}:</span>
                  <span className="font-regular text-zinc-900">
                    ₹{Math.round(oneLeafPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-sm text-zinc-600">
                  <span>{t('total_leaf_items_subtotal')}:</span>
                  <span className="font-regular text-zinc-900">
                    ₹{menuItemsSubtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-zinc-600">
                  <span>{t('additional_menu_items_subtotal')}:</span>
                  <span className="font-regular text-zinc-900">
                    ₹{additionalMenuItemsSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <span>{t('additional_items_subtotal')}:</span>
                  <span className="font-regular text-zinc-900">
                    ₹{additionalItemsSubtotal.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-sm text-zinc-600">
                  <span className="font-semibold">
                    {t('subtotal_before_delivery')}:
                  </span>
                  <span className="font-semibold text-zinc-900">
                    ₹{getSubtotalBeforeDelivery().toLocaleString()}
                  </span>
                </div>
                {editData.deliveredByUs && (
                  <div className="flex justify-between text-sm text-zinc-600">
                    <span>{t('delivery_charges')}:</span>
                    <span className="font-regular text-zinc-900">
                      ₹{(editData.deliveryCharge || 0).toLocaleString()}
                    </span>
                  </div>
                )}
                {((editData.discountAmount ?? 0) > 0 ||
                  (editData.discountPercentage ?? 0) > 0) &&
                  (() => {
                    const discountAmount = editData.discountAmount || 0
                    const discountLabel = editData.discountPercentage
                      ? `Discount (${editData.discountPercentage}%)`
                      : 'Discount'

                    return discountAmount > 0 ? (
                      <>
                        <div className="flex justify-between text-sm text-green-600">
                          <span>{discountLabel}:</span>
                          <span className="font-regular">
                            - ₹{discountAmount.toLocaleString()}
                          </span>
                        </div>
                      </>
                    ) : null
                  })()}
                <div className="flex justify-between border-t border-zinc-200 pt-3">
                  <span className="font-semibold text-zinc-900">
                    {t('total')}:
                  </span>
                  <span className="text-lg font-bold text-zinc-900">
                    ₹{(editData.totalAmount ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )
          })()}

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Input
              title={t('price_reduced_per_plate')}
              prefixText="₹"
              placeholder="0"
              inputValue={editData.priceReducedPerPlate?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  priceReducedPerPlate: safeNumber(value),
                }))
              }
            />

            <Input
              title={t('discount_percentage')}
              placeholder="0"
              suffixText="%"
              inputValue={editData.discountPercentage?.toString() || ''}
              onChange={handleDiscountPercentageChange}
            />
            <Input
              title={t('discount_amount')}
              placeholder="0"
              prefixText="₹"
              inputValue={editData.discountAmount?.toString() || ''}
              onChange={handleDiscountAmountChange}
            />
            <Input
              title={t('advance_amount')}
              placeholder={t('advance_amount_placeholder')}
              prefixText="₹"
              inputValue={editData.advanceAmount?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  advanceAmount: safeNumber(value),
                }))
              }
            />
            <DropdownSelect
              title={t('payment_type')}
              autoScroll={false}
              options={paymentTypeOptions}
              required={isPaymentTypeRequired}
              selected={
                (editData.paymentType && paymentTypeOptions.find(
                  (option) =>
                    option.label.toLowerCase() ===
                    editData.paymentType.toLowerCase()
                )) || { id: 0, label: t('select_payment_type') }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, paymentType: option.label }))
              }
            />
          </div>
          <ActionButtons
            isEditMode={isEditMode}
            editData={editData}
            existingOrder={existingOrder}
            defaultOrderData={defaultOrderData}
            setEditData={setEditData}
            navigate={navigate}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
            onClearForm={handleClearForm}
            isCreatePending={isCreatePending}
            isUpdatePending={isUpdatePending}
            isFormValid={isFormValidForSubmit()}
          />
        </form>
      </section>
    </main>
  )
}

interface ActionButtonsProps {
  isEditMode: boolean
  editData: Order
  existingOrder?: Order
  defaultOrderData: Order
  setEditData: React.Dispatch<React.SetStateAction<Order>>
  navigate: ReturnType<typeof useNavigate>
  onCreateOrder: () => void
  onUpdateOrder: () => void
  onClearForm: () => void
  isCreatePending: boolean
  isUpdatePending: boolean
  isFormValid: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isEditMode,
  editData,
  existingOrder,
  defaultOrderData,
  setEditData,
  navigate,
  onCreateOrder,
  onUpdateOrder,
  onClearForm,
  isCreatePending,
  isUpdatePending,
  isFormValid,
}) => {
  const { t } = useTranslation()

  const isSubmitDisabled = (): boolean => {
    if (!isFormValid) return true
    
    if (isEditMode) {
      return lodash.isEqual(editData, existingOrder)
    } else {
      return lodash.isEqual(editData, defaultOrderData)
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-3">
      {!isEditMode && !lodash.isEqual(editData, defaultOrderData) && (
        <ButtonSm
          state="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
          type="button"
          onClick={onClearForm}
        >
          {t('clear_form') || 'Clear Form'}
        </ButtonSm>
      )}
      <ButtonSm
        state="outline"
        className="disabled:cursor-not-allowed disabled:opacity-80!"
        type="button"
        disabled={isEditMode ? lodash.isEqual(editData, existingOrder) : false}
        onClick={() => {
          if (isEditMode) {
            setEditData(existingOrder || defaultOrderData)
          } else {
            // Don't clear data when going back - just navigate
            navigate(-1)
          }
        }}
      >
        {isEditMode ? t('discard_changes') : t('cancel')}
      </ButtonSm>
      <ButtonSm
        className="disabled:cursor-not-allowed disabled:opacity-80!"
        type="submit"
        disabled={isSubmitDisabled()}
        state="default"
        isPending={isCreatePending || isUpdatePending}
        onClick={() => {
          if (isEditMode) {
            onUpdateOrder()
          } else {
            onCreateOrder()
          }
        }}
      >
        {isEditMode ? t('save_changes') : t('create_new_order')}
      </ButtonSm>
    </div>
  )
}

export default OrdersForm
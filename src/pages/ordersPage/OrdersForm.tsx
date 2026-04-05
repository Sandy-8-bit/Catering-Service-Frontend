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
import VoiceInput from '@/components/common/VoiceInput'

export const OrdersForm = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  const orderIdParam = Number(searchParams.get('orderId'))
  const orderId = Number.isFinite(orderIdParam) ? orderIdParam : undefined
  const { data: user = [], isLoading: isUserOptionLoading } = useFetchUsers()
  const { data: products = [] } = useFetchProducts()
  const { data: existingOrder, isLoading: isOrderLoading } =
    useFetchOrderById(orderId)

  const { data: additionalItems = [], isLoading: isAdditionalLoading } =
    useFetchAdditionalItems()

  const [editData, setEditData] = useState<Order>(defaultOrderData)

  const { mutate: createOrder, isPending: isCreatePending } = useCreateOrder()
  const { mutate: updateOrder, isPending: isUpdatePending } = useUpdateOrder()


  const isPaymentTypeRequired = (editData.advanceAmount || 0) > 0
  const handleCreateOrder = () => {
    createOrder(mapOrderToPayload(editData), {
      onSuccess: () => {
        navigate(appRoutes.orders.path)
      },
    })
  }

  const handleUpdateOrder = () => {
    updateOrder(mapOrderToUpdatePayload(editData, existingOrder))
  }

  const driverOptions = user!
    .filter((user) => user.role === 'DRIVER')
    .map((driver) => ({
      id: driver.userId,
      label: driver.name,
    }))

  useEffect(() => {
    if (!existingOrder) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(existingOrder)
  }, [existingOrder])

  useEffect(() => {
    // 1. Menu Items Subtotal = (Price Per Plate - Price Reduced Per Plate) × Total Plates
    const menuItemsSubtotal = (() => {
      const pricePerPlate =
        editData.items?.reduce((sum, item) => {
          const unitPrice =
            item.unitPrice ||
            (item.quantity > 0 ? item.totalPrice / item.quantity : 0)
          return sum + unitPrice
        }, 0) || 0
      const adjustedPrice = pricePerPlate - (editData.priceReducedPerPlate || 0)
      return Math.round((editData.totalPlates || 1) * adjustedPrice)
    })()

    // 2. Additional Menu Items Subtotal
    const additionalMenuItemsSubtotal = (
      editData.additionalMenuItems ?? []
    ).reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId)
      return sum + (product?.price ?? 0) * item.quantity
    }, 0)

    // 3. Additional Items Subtotal
    const additionalItemsSubtotal =
      editData.additionalItems?.reduce(
        (sum, item) => sum + (item.lineTotal || 0),
        0
      ) || 0

    // 4. Subtotal Before Delivery
    const subtotalBeforeDelivery =
      menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal

    // 5. Delivery Charge
    const deliveryCharge = editData.deliveredByUs
      ? editData.deliveryCharge || 0
      : 0

    // 6. Gross Total
    const grossTotal = subtotalBeforeDelivery + deliveryCharge

    // 7. Discount Amount
    let discountAmount = 0
    if (editData.discountAmount && editData.discountAmount > 0) {
      discountAmount = editData.discountAmount
    } else if (editData.discountPercentage && editData.discountPercentage > 0) {
      discountAmount = Math.round(
        grossTotal * (editData.discountPercentage / 100)
      )
    }

    // 8. Total Amount
    const netTotal = Math.round(grossTotal - discountAmount)

    // 9. Balance Amount
    const balance = netTotal - (editData.advanceAmount || 0)

    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Helper to calculate subtotal before delivery
  const getSubtotalBeforeDelivery = () => {
    const pricePerPlate =
      editData.items?.reduce((sum, item) => {
        const unitPrice =
          item.unitPrice ||
          (item.quantity > 0 ? item.totalPrice / item.quantity : 0)
        return sum + unitPrice
      }, 0) || 0
    const adjustedPrice = pricePerPlate - (editData.priceReducedPerPlate || 0)
    const menuItemsSubtotal = Math.round(
      (editData.totalPlates || 1) * adjustedPrice
    )
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
    return (
      menuItemsSubtotal + additionalMenuItemsSubtotal + additionalItemsSubtotal
    )
  }

  const handleDiscountPercentageChange = (value: string) => {
    const percentage = Number(value)
    const subtotal = getSubtotalBeforeDelivery()
    const calculatedAmount = Math.round(subtotal * (percentage / 100))
    setEditData((prev) => ({
      ...prev,
      discountPercentage: percentage,
      discountAmount: calculatedAmount,
    }))
  }

  const handleDiscountAmountChange = (value: string) => {
    const amount = Number(value)
    const subtotal = getSubtotalBeforeDelivery()
    const calculatedPercentage =
      subtotal > 0 ? Math.round((amount / subtotal) * 100 * 100) / 100 : 0
    setEditData((prev) => ({
      ...prev,
      discountAmount: amount,
      discountPercentage: calculatedPercentage,
    }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  const safeNumber = (value: string | number | undefined) => {
  const num = Number(value)
  return isNaN(num) ? 0 : num
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
          isCreatePending={isCreatePending}
          isUpdatePending={isUpdatePending}
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
            <TimeInput
              title={t('event_time')}
              name="time"
              value={editData.eventTime}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  eventTime: value.length === 5 ? `${value}:00` : value,
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
              </>
            )}

            <Input
              title="Total Plates"
              prefixText={t('count')}
              placeholder="Enter total plates"
              inputValue={editData.totalPlates?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  totalPlates: safeNumber(value),
                }))
              }
            />
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
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:p-5">
            <div className="flex justify-between gap-3 text-sm text-zinc-600">
  <span>{t('one_leaf_price')}:</span>
  <span className="font-regular text-zinc-900">
    ₹
    {(() => {
      const pricePerPlate =
        editData.items?.reduce((sum, item) => {
          const unitPrice =
            item.unitPrice ||
            (item.quantity > 0
              ? item.totalPrice / item.quantity
              : 0)
          return sum + unitPrice
        }, 0) || 0

      const oneLeafPrice =
        pricePerPlate - (editData.priceReducedPerPlate || 0)

      return Math.round(oneLeafPrice).toLocaleString()
    })()}
  </span>
</div>
            <div className="flex justify-between gap-3 text-sm text-zinc-600">
              <span>{t('total_leaf_items_subtotal')}:</span>
              <span className="font-regular text-zinc-900">
                ₹
                {(() => {
                  const pricePerPlate =
                    editData.items?.reduce((sum, item) => {
                      const unitPrice =
                        item.unitPrice ||
                        (item.quantity > 0
                          ? item.totalPrice / item.quantity
                          : 0)
                      return sum + unitPrice
                    }, 0) || 0
                  const adjustedPrice =
                    pricePerPlate - (editData.priceReducedPerPlate || 0)
                  return Math.round(
                    (editData.totalPlates || 1) * adjustedPrice
                  ).toLocaleString()
                })()}
              </span>

              
            </div>
            
            <div className="flex justify-between text-sm text-zinc-600">
              <span>{t('additional_menu_items_subtotal')}:</span>
              <span className="font-regular text-zinc-900">
                ₹
                {(editData.additionalMenuItems ?? [])
                  .reduce((sum, item) => {
                    const product = products.find(
                      (p) => p.id === item.productId
                    )
                    return sum + (product?.price ?? 0) * item.quantity
                  }, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600">
              <span>{t('additional_items_subtotal')}:</span>
              <span className="font-regular text-zinc-900">
                ₹
                {editData.additionalItems
                  ?.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-sm text-zinc-600">
              <span className="font-semibold">{t('subtotal_before_delivery')}:</span>
              <span className="font-semibold text-zinc-900">
                ₹
                {(() => {
                  const pricePerPlate =
                    editData.items?.reduce((sum, item) => {
                      const unitPrice =
                        item.unitPrice ||
                        (item.quantity > 0
                          ? item.totalPrice / item.quantity
                          : 0)
                      return sum + unitPrice
                    }, 0) || 0
                  const adjustedPrice =
                    pricePerPlate - (editData.priceReducedPerPlate || 0)
                  const menuItemsSubtotal = Math.round(
                    (editData.totalPlates || 1) * adjustedPrice
                  )
                  const additionalMenuItemsSubtotal = (
                    editData.additionalMenuItems ?? []
                  ).reduce((sum, item) => {
                    const product = products.find(
                      (p) => p.id === item.productId
                    )
                    return sum + (product?.price ?? 0) * item.quantity
                  }, 0)
                  const additionalItemsSubtotal =
                    editData.additionalItems?.reduce(
                      (sum, item) => sum + (item.lineTotal || 0),
                      0
                    ) || 0
                  return (
                    menuItemsSubtotal +
                    additionalMenuItemsSubtotal +
                    additionalItemsSubtotal
                  ).toLocaleString()
                })()}
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
                // Calculate menu items subtotal
                const pricePerPlate =
                  editData.items?.reduce((sum, item) => {
                    const unitPrice =
                      item.unitPrice ||
                      (item.quantity > 0 ? item.totalPrice / item.quantity : 0)
                    return sum + unitPrice
                  }, 0) || 0
                const adjustedPrice =
                  pricePerPlate - (editData.priceReducedPerPlate || 0)
                const menuItemsSubtotal = Math.round(
                  (editData.totalPlates || 1) * adjustedPrice
                )

                // Calculate additional menu items subtotal
                const additionalMenuItemsSubtotal = (
                  editData.additionalMenuItems ?? []
                ).reduce((sum, item) => {
                  const product = products.find((p) => p.id === item.productId)
                  return sum + (product?.price ?? 0) * item.quantity
                }, 0)

                // Calculate gross total
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const grossTotal =
                  menuItemsSubtotal +
                  additionalMenuItemsSubtotal +
                  (editData.additionalItems?.reduce(
                    (sum, item) => sum + (item.lineTotal || 0),
                    0
                  ) || 0) +
                  (editData.deliveredByUs ? editData.deliveryCharge || 0 : 0)

                // Use discountAmount if available
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
              <span className="font-semibold text-zinc-900">{t('total')}:</span>
              <span className="text-lg font-bold text-zinc-900">
                ₹{(editData.totalAmount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

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
                paymentTypeOptions.find(
                  (option) =>
                    option.label.toLocaleLowerCase() ===
                    editData.paymentType.toLocaleLowerCase()
                ) || { id: 0, label: t('select_payment_type') }
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
            isCreatePending={isCreatePending}
            isUpdatePending={isUpdatePending}
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
  isCreatePending: boolean
  isUpdatePending: boolean
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
  isCreatePending,
  isUpdatePending,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <ButtonSm
        state="outline"
        className="disabled:cursor-not-allowed disabled:opacity-80!"
        type="button"
        disabled={isEditMode ? lodash.isEqual(editData, existingOrder) : false}
        onClick={() => {
          if (isEditMode) setEditData(existingOrder || defaultOrderData)
          else navigate(-1)
        }}
      >
        {isEditMode ? t('discard_changes') : t('cancel')}
      </ButtonSm>
      <ButtonSm
        className="disabled:cursor-not-allowed disabled:opacity-80!"
        type="submit"
        disabled={
          isEditMode
            ? lodash.isEqual(editData, existingOrder)
            : lodash.isEqual(editData, defaultOrderData)
        }
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

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ButtonSm from '@/components/common/Buttons'
import Input, { InputCheckbox } from '@/components/common/Input'
import { appRoutes } from '@/routes/appRoutes'
import {
  useCreateOrder,
  useFetchOrderById,
  useUpdateOrder,
} from '@/queries/OrdersQueries'
import type { Order, OrderPayload } from '@/types/Order'
import { useFetchAdditionalItems } from '@/queries/AdditionalItemsQueries'
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

const mapOrderToPayload = (order: Order): OrderPayload => ({
  customerName: order.customerName ?? '',
  customerPhone: order.customerPhone ?? '',
  customerAddress: order.customerAddress ?? '',
  eventType: order.eventType ?? '',
  eventDate: order.eventDate ?? '',
  eventTime: order.eventTime ?? '',
  totalPeople: order.totalPeople ?? 0,
  deliveredByUs: order.deliveredByUs ?? true,
  driverId: order.driver?.driverId,
  advanceAmount: order.advanceAmount ?? 0,
  paymentType: order.paymentType ?? '',
  items:
    order.items?.map((item) => ({
      productId: item.product.productId,
      quantity: item.quantity,
    })) ?? [],
  additionalItems:
    order.additionalItems && order.additionalItems.length
      ? order.additionalItems.map((item) => ({
          additionalItemId: item.additionalItem.additionalItemId,
          quantity: item.quantity,
          returned: item.returned,
        }))
      : undefined,
})

export const OrdersForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  const orderIdParam = Number(searchParams.get('orderId'))
  const orderId = Number.isFinite(orderIdParam) ? orderIdParam : undefined

  const { data: existingOrder, isLoading: isOrderLoading } =
    useFetchOrderById(orderId)

  const { data: additionalItems = [], isLoading: isAdditionalLoading } =
    useFetchAdditionalItems()

  const { mutateAsync: createOrder, isPending: isCreatePending } =
    useCreateOrder()
  const { mutateAsync: updateOrder, isPending: isUpdatePending } =
    useUpdateOrder()

  const [editData, setEditData] = useState<OrderPayload>(() => defaultOrderData)

  useEffect(() => {
    if (!existingOrder) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(mapOrderToPayload(existingOrder))
  }, [existingOrder])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('Customer info payload ready:', {
      customerName: editData.customerName,
      customerPhone: editData.customerPhone,
      customerAddress: editData.customerAddress,
    })
  }

  if (isOrderLoading) return <div>Loading...</div>

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row gap-4 p-4">
        <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
          {isEditMode ? 'Edit Order' : 'Create Order'}
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-5 p-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Customer Information */}
          <header className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              Customer Information
            </h2>
            <p className="text-sm text-zinc-500">
              Start with the basics. We will extend the form step by step.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              title="Customer Name"
              name="customerName"
              placeholder="Eg. Priya Chandran"
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
              title="Phone Number"
              name="phoneNumber"
              prefixText="+91"
              placeholder="10-digit contact"
              inputValue={editData.customerPhone}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  customerPhone: value,
                }))
              }
            />

            <Input
              title="Address"
              name="address"
              placeholder="Delivery or event address"
              inputValue={editData.customerAddress}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  customerAddress: value,
                }))
              }
            />

            <DropdownSelect
              title="Event Type"
              options={eventTypeOptions}
              required
              selected={
                eventTypeOptions.find(
                  (option) => option.label === editData.eventType
                ) || { id: 0, label: 'Select Event Type' }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, eventType: option.label }))
              }
            />

            <DateInput
              title="Event Date"
              value={editData.eventDate}
              onChange={(value) =>
                setEditData((prev) => ({ ...prev, eventDate: value }))
              }
            />
            <TimeInput
              title="Event Time"
              name="time"
              value={editData.eventTime}
              onChange={(value) =>
                setEditData((prev) => ({ ...prev, eventTime: value }))
              }
            />
          </div>
          {/* Delivery & Payment */}
          <header className="mt-6 space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              Delivery & Payment
            </h2>
            <p className="text-sm text-zinc-500">
              Decides how the order will be delivered and paid for.
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            <InputCheckbox
              title="Delivery by us "
              checked={editData.deliveredByUs}
              onChange={(checked) =>
                setEditData((prev) => ({ ...prev, deliveredByUs: checked }))
              }
              label="Delivery Preference"
            />

            <Input
              title="Driver Id"
              name="driverId"
              placeholder="10-digit contact"
              inputValue={editData.driverId?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  driverId: Number(value),
                }))
              }
            />

            <DropdownSelect
              title="Payment Type"
              options={paymentTypeOptions}
              required
              selected={
                paymentTypeOptions.find(
                  (option) => option.label === editData.paymentType
                ) || { id: 0, label: 'Select Payment Type' }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, paymentType: option.label }))
              }
            />
            <Input
              title="Advance Amount"
              name="advanceAmount"
              placeholder="Enter advance amount"
              prefixText="₹"
              inputValue={editData.advanceAmount?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  advanceAmount: Number(value),
                }))
              }
            />
          </div>
          {/* Menu items */}
          <header className="mt-6 space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              Menu Items
            </h2>
            <p className="text-sm text-zinc-500">
              Pick the dishes and specific product quantities for the event.
            </p>
          </header>

          <ProductMenuSelector
            selectedItems={editData.items}
            onChange={(items) =>
              setEditData((prev) => ({
                ...prev,
                items,
              }))
            }
          />

          {/* Menu items */}
          <header className="mt-6 space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              Additional Items
            </h2>
            <p className="text-sm text-zinc-500">
              Pick the additional items & quantities for the event.
            </p>
          </header>

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

          <div className="flex flex-wrap justify-end gap-3">
            <ButtonSm
              state="outline"
              type="button"
              onClick={() => navigate(appRoutes.orders.path)}
            >
              Cancel
            </ButtonSm>
            <ButtonSm state="default" type="submit">
              Create New Order
            </ButtonSm>
          </div>
        </form>
      </section>
    </main>
  )
}

export default OrdersForm

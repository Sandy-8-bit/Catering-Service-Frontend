import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { mapOrderToUpdatePayload, mapOrderToPayload } from '@/utils/TypeMappers'
import { ArrowLeft } from 'lucide-react'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchUsers } from '@/queries/usersQueries'

export const OrdersForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('mode') === 'edit'
  const orderIdParam = Number(searchParams.get('orderId'))
  const orderId = Number.isFinite(orderIdParam) ? orderIdParam : undefined
  const { data: user = [], isLoading: isUserOptionLoading } = useFetchUsers()
  const { data: existingOrder, isLoading: isOrderLoading } =
    useFetchOrderById(orderId)

  const { data: additionalItems = [], isLoading: isAdditionalLoading } =
    useFetchAdditionalItems()

  const [editData, setEditData] = useState<Order>(defaultOrderData)

  const { mutate: createOrder, isPending: isCreatePending } = useCreateOrder()
  const { mutate: updateOrder, isPending: isUpdatePending } = useUpdateOrder()

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
    const total = Number(editData.totalAmount) || 0
    const advance = Number(editData.advanceAmount) || 0
    const balance = Math.max(total - advance, 0)
    setEditData((prev) => ({
      ...prev,
      balanceAmount: balance,
    }))
  }, [editData.totalAmount, editData.advanceAmount])

  useEffect(() => {
    if (!existingOrder) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(existingOrder)
  }, [existingOrder])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log('Customer info payload ready:', {
      customerName: editData.customerName,
      customerPhone: editData.customerPhone,
      customerAddress: editData.customerAddress,
    })

  }

  if (isOrderLoading || isUserOptionLoading || isAdditionalLoading)
    return <div>Loading...</div>

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row items-center justify-between gap-4 p-4">
        <h1 className="flex w-max flex-row items-center gap-2 text-start text-xl font-semibold text-zinc-800">
          <ArrowLeft
            onClick={() => {
              navigate(-1)
            }}
            size={24}
            className="cursor-pointer hover:scale-105 active:scale-110"
          />
          {isEditMode ? 'Edit Order' : 'Create Order'}
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
            {editData.deliveredByUs && (
              <DropdownSelect
                title="Assign Driver"
                options={driverOptions}
                required
                selected={
                  driverOptions.find(
                    (option) => option.id === editData.driver?.driverId
                  ) || { id: 0, label: 'Select Driver' }
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
            )}
            <DropdownSelect
              title="Payment Type"
              options={paymentTypeOptions}
              required
              selected={
                paymentTypeOptions.find(
                  (option) =>
                    option.label.toLocaleLowerCase() ===
                    editData.paymentType.toLocaleLowerCase()
                ) || { id: 0, label: 'Select Payment Type' }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, paymentType: option.label }))
              }
            />
            <Input
              title="Total Amount"
              placeholder="Enter total amount"
              prefixText="₹"
              inputValue={editData.totalAmount?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  totalAmount: Number(value),
                }))
              }
            />
            <Input
              title="Advance Amount"
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
            <Input
              title="Balance Amount"
              placeholder="Enter balance amount"
              prefixText="₹"
              inputValue={editData.balanceAmount?.toString() || ''}
              onChange={() => {}}
            />

            <Input
              title="Total People"
              prefixText="Count"
              placeholder="Enter total people count"
              inputValue={editData.totalPeople?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  totalPeople: Number(value),
                }))
              }
            />
            <InputCheckbox
              title="Returnable Items Checked "
              checked={editData.returnableItemsChecked}
              onChange={(checked) =>
                setEditData((prev) => ({
                  ...prev,
                  returnableItemsChecked: checked,
                }))
              }
              label="Returnable items "
            />
            {/* <DropdownSelect
              title="Status"
              options={statusOptions}
              required
              selected={
                statusOptions.find(
                  (option) =>
                    option.label.toLocaleLowerCase() ===
                    editData.status.toLocaleLowerCase()
                ) || { id: 0, label: 'Select Status' }
              }
              onChange={(option) =>
                setEditData((prev) => ({ ...prev, status: option.label }))
              }
            /> */}
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
        {isEditMode ? 'Discard Changes' : 'Cancel'}
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
        {isEditMode ? 'Save Changes' : 'Create New Order'}
      </ButtonSm>
    </div>
  )
}

export default OrdersForm

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
import { mapOrderToUpdatePayload, mapOrderToPayload } from '@/utils/TypeMappers'
import { ArrowLeft } from 'lucide-react'
import { appRoutes } from '@/routes/appRoutes'
import { useFetchUsers } from '@/queries/usersQueries'
import VoiceInput from '@/components/common/VoiceInput'

export const OrdersForm = () => {
  const { t } = useTranslation()
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
    if (!existingOrder) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(existingOrder)
  }, [existingOrder])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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

      <section className="flex flex-col gap-5 p-6">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Customer Information */}
          <header className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-800">
              {t('customer_information')}
            </h2>
            <p className="text-sm text-zinc-500">
              {t('form_intro_text')}
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            <VoiceInput
              title={t('customer_name')}
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
            )}

            <Input
              title={t('total_people')}
              prefixText={t('count')}
              placeholder={t('total_people_placeholder')}
              inputValue={editData.totalPeople?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  totalPeople: Number(value),
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

          {/* Menu items */}
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
            <h2 className="text-base font-semibold text-zinc-800">{t('payment')}</h2>
            <p className="text-sm text-zinc-500">
              {t('payment_text')}
            </p>
          </header>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              title={t('advance_amount')}
              placeholder={t('advance_amount_placeholder')}
              prefixText="₹"
              inputValue={editData.advanceAmount?.toString() || ''}
              onChange={(value) =>
                setEditData((prev) => ({
                  ...prev,
                  advanceAmount: Number(value),
                }))
              }
            />
            <DropdownSelect
              title={t('payment_type')}
              options={paymentTypeOptions}
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

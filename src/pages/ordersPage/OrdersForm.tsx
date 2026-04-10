import { useEffect, useState, useRef } from 'react'
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
import { useOrderFormContext } from '@/context/OrderFormContext'
import DialogBox from '@/components/common/DialogBox'
import VoiceOrderDialog from '@/components/orders/VoiceOrderDialog'
import { Mic, ChevronDown } from 'lucide-react'

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
  const [isInitialized, setIsInitialized] = useState(false)
  const [showVoiceDialog, setShowVoiceDialog] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    customer: true,
    delivery: true,
    payment: true,
    menu: false,
  })
  const [expandedMenuItems, setExpandedMenuItems] = useState({
    productMenu: true,
    additionalMenu: false,
    additionalItems: false,
  })

  // Refs for click outside detection
  const productMenuRef = useRef<HTMLDivElement>(null)
  const additionalMenuRef = useRef<HTMLDivElement>(null)
  const additionalItemsRef = useRef<HTMLDivElement>(null)

  const { mutate: createOrder, isPending: isCreatePending } = useCreateOrder()
  const { mutate: updateOrder, isPending: isUpdatePending } = useUpdateOrder()

  // Handle accordion behavior for menu items - close others when one is opened
  const toggleMenuItemSection = (section: keyof typeof expandedMenuItems) => {
    setExpandedMenuItems((prev) => {
      const newState = {
        productMenu: false,
        additionalMenu: false,
        additionalItems: false,
      }
      newState[section] = !prev[section]
      return newState
    })
  }

  // Handle click outside for menu items
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        expandedMenuItems.productMenu
      ) {
        // Only close if clicking outside product menu and it's expanded
        if (
          !additionalMenuRef.current?.contains(target) &&
          !additionalItemsRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            productMenu: false,
          }))
        }
      }

      if (
        additionalMenuRef.current &&
        !additionalMenuRef.current.contains(target) &&
        expandedMenuItems.additionalMenu
      ) {
        if (
          !productMenuRef.current?.contains(target) &&
          !additionalItemsRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            additionalMenu: false,
          }))
        }
      }

      if (
        additionalItemsRef.current &&
        !additionalItemsRef.current.contains(target) &&
        expandedMenuItems.additionalItems
      ) {
        if (
          !productMenuRef.current?.contains(target) &&
          !additionalMenuRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            additionalItems: false,
          }))
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedMenuItems])


  // Handle click outside for menu items
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (
        productMenuRef.current &&
        !productMenuRef.current.contains(target) &&
        expandedMenuItems.productMenu
      ) {
        // Only close if clicking outside product menu and it's expanded
        if (
          !additionalMenuRef.current?.contains(target) &&
          !additionalItemsRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            productMenu: false,
          }))
        }
      }

      if (
        additionalMenuRef.current &&
        !additionalMenuRef.current.contains(target) &&
        expandedMenuItems.additionalMenu
      ) {
        if (
          !productMenuRef.current?.contains(target) &&
          !additionalItemsRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            additionalMenu: false,
          }))
        }
      }

      if (
        additionalItemsRef.current &&
        !additionalItemsRef.current.contains(target) &&
        expandedMenuItems.additionalItems
      ) {
        if (
          !productMenuRef.current?.contains(target) &&
          !additionalMenuRef.current?.contains(target)
        ) {
          setExpandedMenuItems((prev) => ({
            ...prev,
            additionalItems: false,
          }))
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [expandedMenuItems])

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
      <header className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-4">
        <h1 className="flex w-max flex-row items-center gap-1 text-start text-base font-semibold text-zinc-800 sm:gap-2 sm:text-lg md:text-xl">
          <ArrowLeft
            onClick={() => {
              navigate(-1)
            }}
            size={20}
            className="shrink-0 cursor-pointer hover:scale-105 active:scale-110 sm:h-6 sm:w-6"
          />
          <span className="truncate">
            {isEditMode ? t('edit_order') : t('create_order')}
          </span>
        </h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <ButtonSm
            state="outline"
            onClick={() => setShowVoiceDialog(true)}
            className="px-2 py-1.5 text-xs font-medium sm:px-3 sm:py-2 sm:text-sm"
          >
            <Mic className="mr-1 h-3.5 w-3.5 shrink-0 text-zinc-700 sm:mr-2 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{t('voice_order')}</span>
            <span className="inline sm:hidden">Voice</span>
          </ButtonSm>
          <ActionButtons
            isEditMode={isEditMode}
            editData={editData}
            existingOrder={existingOrder}
            defaultOrderData={defaultOrderData}
            setEditData={setEditData}
            onClearForm={handleClearForm}
            navigate={navigate}
            isFormValid={isFormValidForSubmit()}
            onCreateOrder={handleCreateOrder}
            onUpdateOrder={handleUpdateOrder}
            isCreatePending={isCreatePending}
            isUpdatePending={isUpdatePending}
          />
        </div>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <section className="flex flex-col gap-3 p-3 sm:gap-5 sm:p-6">
        <form className="flex flex-col gap-3 sm:gap-5" onSubmit={handleSubmit}>
          {/* Customer Information */}
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                customer: !prev.customer,
              }))
            }
            className="-mx-2 mt-0 flex w-full items-center justify-between space-y-1 rounded-lg p-2 transition-colors hover:bg-zinc-50"
          >
            <div className="space-y-1 text-left">
              <h2 className="text-xs font-semibold text-zinc-800 sm:text-sm md:text-base">
                {t('customer_information')}
              </h2>
           
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                expandedSections.customer ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.customer && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
              <Input
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
              <div className="space-y-2 sm:space-y-3">
                <label className="text-xs font-medium text-zinc-700 sm:text-sm">
                  {t('event_time')}
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
                      className={`rounded-lg border-2 px-2 py-1.5 text-xs font-medium transition-all sm:px-3 sm:py-2 sm:text-sm ${
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
          )}
          {/* Delivery & Payment */}
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                delivery: !prev.delivery,
              }))
            }
            className="-mx-2 mt-6 flex w-full items-center justify-between space-y-1 rounded-lg p-2 transition-colors hover:bg-zinc-50"
          >
            <div className="space-y-1 text-left">
              <h2 className="text-xs font-semibold text-zinc-800 sm:text-sm md:text-base">
                {t('delivery_payment')}
              </h2>
         
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                expandedSections.delivery ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.delivery && (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
              <InputCheckbox
                title={t('delivery_by_us')}
                checked={editData.deliveredByUs}
                onChange={(checked) =>
                  setEditData((prev) => ({ ...prev, deliveredByUs: checked }))
                }
                
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
          )}

          {/* Menu Selection */}
          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({ ...prev, menu: !prev.menu }))
            }
            className="-mx-2 mt-6 flex w-full items-center justify-between space-y-1 rounded-lg p-2 transition-colors hover:bg-zinc-50"
          >
            <div className="space-y-1 text-left">
              <h2 className="text-xs font-semibold text-zinc-800 sm:text-sm md:text-base">
                {t('Menu Selection')}
              </h2>
         
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                expandedSections.menu ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.menu && (
            <div className="flex flex-col gap-5 sm:gap-6">
              {/* Product Menu Items Separator */}
              <div
                ref={productMenuRef}
                className="flex flex-col space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <button
                  type="button"
                  onClick={() => toggleMenuItemSection('productMenu')}
                  className="flex w-full items-center justify-between space-y-1 rounded-lg transition-colors hover:bg-zinc-100"
                >
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-xs font-semibold text-zinc-800 sm:text-sm">
                      {t('orders_menu_items')}
                    </h3>
                    <p className="text-[10px] text-zinc-500 sm:text-xs">
                      {editData.items?.length || 0} {t('selected_items')}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                      expandedMenuItems.productMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`flex flex-col overflow-hidden transition-all duration-200 ${
                    expandedMenuItems.productMenu
                      ? 'visible max-h-[1500px] opacity-100'
                      : 'invisible max-h-0 opacity-0'
                  }`}
                >
                  {expandedMenuItems.productMenu && (
                    <div className="max-h-[1200px] flex-1 overflow-y-auto border-t border-zinc-200 pt-4">
                      <ProductMenuSelector
                        selectedItems={editData.items}
                        onChange={(items) =>
                          setEditData((prev) => ({
                            ...prev,
                            items,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Menu Items Separator */}
              <div
                ref={additionalMenuRef}
                className="flex flex-col space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <button
                  type="button"
                  onClick={() => toggleMenuItemSection('additionalMenu')}
                  className="flex w-full items-center justify-between space-y-1 rounded-lg transition-colors hover:bg-zinc-100"
                >
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-xs font-semibold text-zinc-800 sm:text-sm">
                      {t('orders_additional_menu_items')}
                    </h3>
                    <p className="text-[10px] text-zinc-500 sm:text-xs">
                      {editData.additionalMenuItems?.length || 0}{' '}
                      {t('selected_items')}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                      expandedMenuItems.additionalMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`flex flex-col overflow-hidden transition-all duration-200 ${
                    expandedMenuItems.additionalMenu
                      ? 'visible max-h-[1500px] opacity-100'
                      : 'invisible max-h-0 opacity-0'
                  }`}
                >
                  {expandedMenuItems.additionalMenu && (
                    <div className="max-h-[1200px] flex-1 overflow-y-auto border-t border-zinc-200 pt-4">
                      <AdditionalMenuSelector
                        selectedItems={editData.additionalMenuItems ?? []}
                        onChange={(items) =>
                          setEditData((prev) => ({
                            ...prev,
                            additionalMenuItems: items,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Items Separator */}
              <div
                ref={additionalItemsRef}
                className="flex flex-col space-y-3 rounded-lg border border-zinc-100 bg-zinc-50 p-4"
              >
                <button
                  type="button"
                  onClick={() => toggleMenuItemSection('additionalItems')}
                  className="flex w-full items-center justify-between space-y-1 rounded-lg transition-colors hover:bg-zinc-100"
                >
                  <div className="space-y-1.5 text-left">
                    <h3 className="text-xs font-semibold text-zinc-800 sm:text-sm">
                      {t('additional_items')}
                    </h3>
                    <p className="text-[10px] text-zinc-500 sm:text-xs">
                      {editData.additionalItems?.length || 0}{' '}
                      {t('selected_items')}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                      expandedMenuItems.additionalItems ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`flex flex-col overflow-hidden transition-all duration-200 ${
                    expandedMenuItems.additionalItems
                      ? 'visible max-h-[1500px] opacity-100'
                      : 'invisible max-h-0 opacity-0'
                  }`}
                >
                  {expandedMenuItems.additionalItems && (
                    <div className="max-h-[1200px] flex-1 overflow-y-auto border-t border-zinc-200 pt-4">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                payment: !prev.payment,
              }))
            }
            className="-mx-2 mt-6 flex w-full items-center justify-between space-y-1 rounded-lg p-2 transition-colors hover:bg-zinc-50"
          >
            <div className="space-y-1 text-left">
              <h2 className="text-xs font-semibold text-zinc-800 sm:text-sm md:text-base">
                {t('payment')}
              </h2>
        
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform sm:h-5 sm:w-5 ${
                expandedSections.payment ? 'rotate-180' : ''
              }`}
            />
          </button>
          {expandedSections.payment && (
            <>
              {/* Total Amount Display */}
              {(() => {
                // Calculate display values using utility functions
                const menuItemsSubtotal = calculateMenuItemsSubtotal(editData)
                const additionalMenuItemsSubtotal =
                  calculateAdditionalMenuItemsSubtotal(editData, products)
                const additionalItemsSubtotal =
                  calculateAdditionalItemsSubtotal(editData)
                const oneLeafPrice = calculateOneLeafPrice(editData)

                return (
                  <div className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 sm:gap-3 sm:p-5">
                    <div className="flex justify-between gap-3 text-xs text-zinc-600 sm:text-sm">
                      <span>{t('one_leaf_price')}:</span>
                      <span className="font-regular text-zinc-900">
                        ₹{Math.round(oneLeafPrice).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-xs text-zinc-600 sm:text-sm">
                      <span>{t('total_leaf_items_subtotal')}:</span>
                      <span className="font-regular text-zinc-900">
                        ₹{menuItemsSubtotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-600 sm:text-sm">
                      <span>{t('additional_menu_items_subtotal')}:</span>
                      <span className="font-regular text-zinc-900">
                        ₹{additionalMenuItemsSubtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-600 sm:text-sm">
                      <span>{t('additional_items_subtotal')}:</span>
                      <span className="font-regular text-zinc-900">
                        ₹{additionalItemsSubtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-zinc-200 pt-2 text-xs text-zinc-600 sm:text-sm">
                      <span className="font-semibold">
                        {t('subtotal_before_delivery')}:
                      </span>
                      <span className="font-semibold text-zinc-900">
                        ₹{getSubtotalBeforeDelivery().toLocaleString()}
                      </span>
                    </div>
                    {editData.deliveredByUs && (
                      <div className="flex justify-between text-xs text-zinc-600 sm:text-sm">
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
                            <div className="flex justify-between text-xs text-green-600 sm:text-sm">
                              <span>{discountLabel}:</span>
                              <span className="font-regular">
                                - ₹{discountAmount.toLocaleString()}
                              </span>
                            </div>
                          </>
                        ) : null
                      })()}
                    <div className="flex justify-between border-t border-zinc-200 pt-3">
                      <span className="text-xs font-semibold text-zinc-900 sm:text-sm">
                        {t('total')}:
                      </span>
                      <span className="text-sm font-bold text-zinc-900 sm:text-lg">
                        ₹{(editData.totalAmount ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })()}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-4">
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
                    setEditData((prev) => ({
                      ...prev,
                      paymentType: option.label,
                    }))
                  }
                />
              </div>
            </>
          )}
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

      {showVoiceDialog && (
        <DialogBox setToggleDialogueBox={setShowVoiceDialog} width="420px">
          <VoiceOrderDialog
            onClose={() => setShowVoiceDialog(false)}
            eventDate={editData.eventDate}
          />
        </DialogBox>
      )}
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
        className="px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-80! sm:px-3 sm:py-2 sm:text-sm"
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
        className="px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-80! sm:px-3 sm:py-2 sm:text-sm"
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
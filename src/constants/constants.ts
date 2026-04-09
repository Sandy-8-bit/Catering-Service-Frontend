import type { DropdownOption } from '@/components/common/DropDown'
import type { Order } from '@/types/order'

export const units: DropdownOption[] = [
  { id: 1, label: 'Kg' },
  { id: 2, label: 'Gm' },
]

export const ROLE_OPTIONS: DropdownOption[] = [
  { id: 1, label: 'ADMIN' },
  { id: 2, label: 'STAFF' },
  { id: 3, label: 'DRIVER' },
]

export const eventTypeOptions: DropdownOption[] = [
  'Wedding',
  'Reception',
  'periya kariyam',
  'Birthday',
  'Housewarming',
  'Baby Shower',
  ''
].map((label, index) => ({ id: index + 1, label }))

export const paymentTypeOptions: DropdownOption[] = [
  'CASH',
  'UPI',
  'Bank Transfer',
  'CARD',
  'Cheque',
].map((label, index) => ({ id: index + 1, label }))

export const statusOptions: DropdownOption[] = [
  ' CONFIRMED',
  ' IN_PROGRESS',
  ' DELIVERED',
  ' COMPLETED',
  ' CANCELLED',
].map((label, index) => ({ id: index + 1, label }))

export const defaultOrderData: Order = {
  id: 0,
  customerName: '',
  customerPhone: '',
  balanceAmount: 0,
  customerAddress: '',
  eventType: '',
  eventDate: '',
  eventTime: '',
  totalPlates: 0,
  deliveredByUs: false,
  offerPercentage: 0,
  advanceAmount: 0,
  paymentType: '',
  items: [],
  additionalItems: [],
  additionalMenuItems: [],
  createdAt: '',
  updatedAt: '',
  locationUrl: '',
  priceReducedPerPlate: 0,
  totalAmount: 0,
  discountAmount: 0,
  discountPercentage: 0,
  deliveryCharge: 0,
  driver: undefined,
}

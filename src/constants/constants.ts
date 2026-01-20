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
  'Corporate',
  'Birthday',
  'Housewarming',
  'Baby Shower',
].map((label, index) => ({ id: index + 1, label }))

export const paymentTypeOptions: DropdownOption[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Card',
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
  customerAddress: '',
  eventType: '',
  eventDate: '',
  eventTime: '',
  totalPeople: 0,
  deliveredByUs: false,
  totalAmount: 0,
  advanceAmount: 0,
  balanceAmount: 0,
  paymentType: '',
  status: '',
  returnableItemsChecked: false,
  items: [],
  additionalItems: [],
  createdAt: '',
  updatedAt: '',
}

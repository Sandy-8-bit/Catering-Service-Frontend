import type { DropdownOption } from '@/components/common/DropDown'
import type { OrderPayload } from '@/types/Order'

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

export const defaultOrderData: OrderPayload = {
  customerName: '',
  customerPhone: '',
  customerAddress: '',
  eventType: '',
  eventDateTime: '',
  totalPeople: 0,
  deliveredByUs: false,
  advanceAmount: 0,
  paymentType: '',
  items: [],
  additionalItems: [],
}

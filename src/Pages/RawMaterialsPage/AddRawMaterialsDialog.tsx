import { type FormEvent, useState } from 'react'

import ButtonSm from '@/components/common/Buttons'
import DropdownSelect, {
  type DropdownOption,
} from '@/components/common/DropDown'
import Input from '@/components/common/Input'
import { units } from '@/constants/constants'
import {
  type RawMaterial,
  type RawMaterialPayload,
  useCreateRawMaterial,
} from '@/queries/RawMaterialsQueries'

interface AddRawMaterialsDialogProps {
  onCancel: () => void
  onCreated: (material?: RawMaterial) => void
}

const blankUnit: DropdownOption = { id: 0, label: 'Select unit' }

export const AddRawMaterialsDialog = ({
  onCancel,
  onCreated,
}: AddRawMaterialsDialogProps) => {
  const { mutateAsync, isPending } = useCreateRawMaterial()
  const [primaryName, setPrimaryName] = useState('')
  const [secondaryName, setSecondaryName] = useState('')
  const [purchaseUnit, setPurchaseUnit] = useState<DropdownOption>(blankUnit)
  const [consumptionUnit, setConsumptionUnit] =
    useState<DropdownOption>(blankUnit)
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('')

  const hasRequiredFields =
    primaryName.trim().length > 0 &&
    purchaseUnit.id !== 0 &&
    consumptionUnit.id !== 0 &&
    purchasePrice !== '' &&
    Number(purchasePrice) > 0

  const resetForm = () => {
    setPrimaryName('')
    setSecondaryName('')
    setPurchaseUnit(blankUnit)
    setConsumptionUnit(blankUnit)
    setPurchasePrice('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!hasRequiredFields) return

    const payload: RawMaterialPayload = {
      primaryName: primaryName.trim(),
      secondaryName: secondaryName.trim(),
      purchaseUnit: purchaseUnit.label,
      consumptionUnit: consumptionUnit.label,
      purchasePrice:
        typeof purchasePrice === 'number'
          ? purchasePrice
          : Number(purchasePrice) || 0,
    }

    try {
      const created = await mutateAsync(payload)
      resetForm()
      onCreated(created)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
      <header className="flex w-full items-center justify-between text-lg font-semibold text-slate-700">
        Add Raw Material
        <img
          onClick={() => {
            resetForm()
            onCancel()
          }}
          className="w-5 cursor-pointer"
          src="/icons/close-icon.svg"
          alt="close"
        />
      </header>

      <div className="grid w-full grid-cols-1 gap-3">
        <Input
          title="Primary Name"
          placeholder="Eg: Tomato"
          inputValue={primaryName}
          onChange={(value) => setPrimaryName(String(value))}
          required
        />
        <Input
          title="Secondary Name"
          placeholder="Optional"
          inputValue={secondaryName}
          onChange={(value) => setSecondaryName(String(value))}
        />
        <DropdownSelect
          title="Purchase Unit"
          options={units}
          selected={purchaseUnit}
          placeholder="Select unit"
          onChange={setPurchaseUnit}
          required
        />
        <DropdownSelect
          title="Consumption Unit"
          options={units}
          selected={consumptionUnit}
          placeholder="Select unit"
          onChange={setConsumptionUnit}
          required
        />
        <Input
          title="Purchase Price (₹)"
          placeholder="0.00"
          inputValue={purchasePrice}
          type="num"
          min={0}
          onChange={(value) => setPurchasePrice(value)}
          required
        />
      </div>

      <section className="mt-2 grid w-full grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <ButtonSm
          className="justify-center font-semibold"
          state="outline"
          text="Cancel"
          type="button"
          onClick={() => {
            resetForm()
            onCancel()
          }}
          disabled={isPending}
        />
        <ButtonSm
          className="items-center justify-center bg-green-600 text-white hover:bg-green-700"
          state="default"
          type="submit"
          text={isPending ? 'Adding…' : 'Add Material'}
          disabled={!hasRequiredFields || isPending}
          isPending={isPending}
        />
      </section>
    </form>
  )
}

export default AddRawMaterialsDialog

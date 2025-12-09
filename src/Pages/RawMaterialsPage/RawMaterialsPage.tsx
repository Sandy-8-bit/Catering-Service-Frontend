import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import TableDropDown from '@/components/common/TableDropDown'
import { TableInput } from '@/components/common/TableInput'
import { units } from '@/constants/constants'
import {
  useFetchRawMaterials,
  type RawMaterial,
  type RawMaterialPayload,
  useEditRawMaterial,
  useCreateRawMaterial,
} from '@/queries/RawMaterialsQueries'

import { DeleteRawMaterialsDialog } from './DeleteRawMaterialsDialog'
import { Edit3, Filter, Plus, UploadCloud, X } from 'lucide-react'
import DropdownSelect from '@/components/common/DropDown'

const createEmptyRawMaterial = (id: number): RawMaterial => ({
  id,
  primaryName: '',
  secondaryName: '',
  purchaseUnit: '',
  consumptionUnit: '',
  purchasePrice: 0,
})

export const RawMaterialsPage = () => {
  // queries
  const {
    data: rawMaterials = [],
    isLoading: isRawMaterialsLoading,
    isFetching,
  } = useFetchRawMaterials()
  const { mutateAsync: editRawMaterial, isPending: isEditRawMaterialsPending } =
    useEditRawMaterial()
  const {
    mutateAsync: createRawMaterial,
    isPending: isCreateRawMaterialPending,
  } = useCreateRawMaterial()

  // States
  const [editData, setEditData] = useState<RawMaterial[]>([])
  const [selectedRows, setSelectedRows] = useState<RawMaterial[]>([])
  const [formState, setFormState] = useState<'add' | 'edit' | 'delete' | null>(
    null
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditMode = formState === 'edit'
  const isAddMode = formState === 'add'
  const canEditRow = (rowId: number) => isEditMode || (isAddMode && rowId < 0)

  // useEffects
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(rawMaterials.map((item) => ({ ...item })))
  }, [rawMaterials])

  const originalMap = useMemo(() => {
    return new Map(rawMaterials.map((item) => [item.id, item]))
  }, [rawMaterials])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
      // comparing only relevant fields isquals gives many error so manul is better
      return (
        original.primaryName !== row.primaryName ||
        (original.secondaryName ?? '') !== (row.secondaryName ?? '') ||
        original.purchaseUnit !== row.purchaseUnit ||
        original.consumptionUnit !== row.consumptionUnit ||
        original.purchasePrice !== row.purchasePrice
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const newMaterialDraft = useMemo(
    () => editData.find((item) => item.id < 0),
    [editData]
  )

  const isAddDraftValid = useMemo(() => {
    if (!newMaterialDraft) return false
    const primaryName = newMaterialDraft.primaryName?.trim() ?? ''
    const purchaseUnit = newMaterialDraft.purchaseUnit?.trim() ?? ''
    const consumptionUnit = newMaterialDraft.consumptionUnit?.trim() ?? ''
    const purchasePrice = Number(newMaterialDraft.purchasePrice ?? 0)

    return (
      primaryName.length > 0 &&
      purchaseUnit.length > 0 &&
      consumptionUnit.length > 0 &&
      purchasePrice > 0
    )
  }, [newMaterialDraft])

  const selectedRowIndices = useMemo(() => {
    return selectedRows
      .map((row) => editData.findIndex((item) => item.id === row.id))
      .filter((index) => index !== -1)
  }, [selectedRows, editData])

  const updateRowField = (
    rowId: number,
    field: keyof RawMaterial,
    value: string | number
  ) => {
    setEditData((prev) =>
      prev.map((item) =>
        item.id === rowId
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  const handleSaveChanges = async () => {
    if (isAddMode) {
      if (!newMaterialDraft || !isAddDraftValid || isCreateRawMaterialPending) {
        return
      }

      const payload: RawMaterialPayload = {
        primaryName: newMaterialDraft.primaryName.trim(),
        secondaryName: newMaterialDraft.secondaryName?.trim() ?? '',
        purchaseUnit: newMaterialDraft.purchaseUnit,
        consumptionUnit: newMaterialDraft.consumptionUnit,
        purchasePrice: Number(newMaterialDraft.purchasePrice) || 0,
      }

      try {
        await createRawMaterial(payload)
        setFormState(null)
        setSelectedRows([])
        setEditData((prev) => prev.filter((item) => item.id >= 0))
      } catch (error) {
        console.error(error)
      }
      return
    }

    if (!isEditMode) {
      setFormState('edit')
      return
    }

    if (!hasChanges) {
      setFormState(null)
      return
    }

    if (isEditRawMaterialsPending) return

    try {
      await Promise.all(changedRows.map((row) => editRawMaterial(row)))
      setFormState(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(rawMaterials.map((item) => ({ ...item })))
    setSelectedRows([])
    setFormState(null)
  }

  const handleSelectionChange = (indices: number[], rows: RawMaterial[]) => {
    setSelectedRows(rows)
  }

  const handleAddRawMaterialRow = () => {
    if (formState === 'add') return

    const newTempId = Date.now() * -1
    const blankRow = createEmptyRawMaterial(newTempId)

    setFormState('add')
    setEditData((prev) => {
      const alreadyExists = prev.some((item) => item.id === newTempId)
      if (alreadyExists) return prev
      return [blankRow, ...prev]
    })
  }

  // Data cells layout
  const rawMaterialTableColumns: DataCell[] = [
    {
      headingTitle: 'Primary Name',
      accessVar: 'primaryName',
      className: 'max-w-32',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.id, 'primaryName', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Secondary Name',
      accessVar: 'secondaryName',
      className: 'w-42',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.id, 'secondaryName', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Purchase Unit',
      accessVar: 'purchaseUnit',
      className: 'w-32',
      render: (value, row) => {
        const normalizedValue = String(value ?? '').trim()
        const selectedOption = units.find(
          (unit) => unit.label.toLowerCase() === normalizedValue.toLowerCase()
        ) ?? {
          id: 0,
          label: normalizedValue,
        }
        return (
          <TableDropDown
            isEditMode={canEditRow(row.id)}
            title=""
            options={units}
            selected={selectedOption}
            placeholder="Select Unit"
            onChange={(e) => {
              updateRowField(row.id, 'purchaseUnit', e.label)
            }}
          />
        )
      },
    },
    {
      headingTitle: 'Consumption Unit',
      accessVar: 'consumptionUnit',
      className: 'w-42',
      render: (value, row) => {
        const normalizedValue = String(value ?? '').trim()
        const selectedOption = units.find(
          (unit) => unit.label.toLowerCase() === normalizedValue.toLowerCase()
        ) ?? {
          id: 0,
          label: normalizedValue,
        }
        return (
          <TableDropDown
            isEditMode={canEditRow(row.id)}
            title=""
            options={units}
            selected={selectedOption}
            placeholder="Select Unit"
            onChange={(e) => {
              updateRowField(row.id, 'consumptionUnit', e.label)
            }}
          />
        )
      },
    },
    {
      headingTitle: 'Purchase Price (₹)',
      accessVar: 'purchasePrice',
      className: 'w-48',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? 0}
          type="num"
          onChange={(val) =>
            updateRowField(
              row.id,
              'purchasePrice',
              typeof val === 'number' ? val : Number(val) || 0
            )
          }
        />
      ),
    },
  ]
  const handleDeleteSelected = () => {
    if (selectedRows.length === 0) return
    setIsDeleteDialogOpen(true)
  }

  return (
    <main className="layout-container flex min-h-[95vh] w-full flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row gap-4 p-4">
        <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
          Raw Materials
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />
      <section className="flex w-full flex-row justify-between gap-3 px-3 py-4">
        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditRawMaterialsPending}
            isPending={isEditRawMaterialsPending}
          >
            <Filter className="h-4 w-4 text-black" />
            Filter
          </ButtonSm>
          <div className="divider min-h-full border border-[#F1F1F1]" />
          <DropdownSelect
            className="font-medium"
            onChange={() => {}}
            options={[]}
            selected={{ id: 1, label: 'Table View' }}
            disabled={isEditRawMaterialsPending}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditRawMaterialsPending}
            isPending={isEditRawMaterialsPending}
          >
            <UploadCloud className="h-5 w-5 text-black" />
            Export Data
          </ButtonSm>
          <div className="divider min-h-full border border-[#F1F1F1]" />
          {isAddMode ? (
            <>
              <ButtonSm
                className={
                  !isAddDraftValid ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!isAddDraftValid || isCreateRawMaterialPending}
                isPending={isCreateRawMaterialPending}
              >
                <Edit3 className="mr-2 h-4 w-4 text-white" /> Save Material
              </ButtonSm>
              <ButtonSm
                state="outline"
                onClick={handleDiscardChanges}
                disabled={isCreateRawMaterialPending}
                isPending={isCreateRawMaterialPending}
              >
                <X className="h-4 w-4 text-black" /> Cancel Add
              </ButtonSm>
            </>
          ) : (
            <>
              <ButtonSm
                className={
                  !hasChanges && isEditMode
                    ? 'cursor-not-allowed! opacity-100!'
                    : ''
                }
                state={isEditMode ? 'default' : 'outline'}
                onClick={() => void handleSaveChanges()}
                disabled={
                  isEditRawMaterialsPending || (isEditMode && !hasChanges)
                }
                isPending={isEditRawMaterialsPending}
              >
                {(hasChanges || !isEditMode) && (
                  <Edit3
                    className={`mr-2 h-4 w-4 ${
                      isEditMode
                        ? hasChanges
                          ? 'text-white'
                          : 'text-white/80'
                        : 'text-black'
                    }`}
                  />
                )}{' '}
                {isEditMode
                  ? isEditRawMaterialsPending
                    ? 'Saving…'
                    : 'Save Changes'
                  : 'Edit Table'}
              </ButtonSm>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditRawMaterialsPending}
                  isPending={isEditRawMaterialsPending}
                >
                  <X className="h-4 w-4 text-black" />{' '}
                  {hasChanges ? 'Discard Changes' : 'Cancel'}
                </ButtonSm>
              )}
              <ButtonSm state="default" onClick={handleAddRawMaterialRow}>
                <Plus className="mr-2 h-4 w-4 text-white" />
                Add Raw Material
              </ButtonSm>
            </>
          )}
        </div>
      </section>

      <GenericTable
        data={editData}
        className="mx-3"
        dataCell={rawMaterialTableColumns}
        isLoading={isRawMaterialsLoading || isFetching}
        messageWhenNoData="No raw materials available."
        isSelectable
        selectedRowIndices={selectedRowIndices}
        onSelectionChange={handleSelectionChange}
        onDeleteSelected={handleDeleteSelected}
      />

      <AnimatePresence>
        {isDeleteDialogOpen && selectedRows.length > 0 && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteRawMaterialsDialog
              materials={selectedRows}
              onCancel={() => {
                setIsDeleteDialogOpen(false)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(
                  selectedRows.map((material) => material.id)
                )
                setEditData((prev) =>
                  prev.filter((item) => !idsToDelete.has(item.id))
                )
                setSelectedRows([])
                setIsDeleteDialogOpen(false)
              }}
            />
          </DialogBox>
        )}
      </AnimatePresence>
    </main>
  )
}

export default RawMaterialsPage

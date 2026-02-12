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
  useEditRawMaterial,
  useCreateRawMaterial,
} from '@/queries/rawMaterialsQueries'

import { DeleteRawMaterialsDialog } from './DeleteRawMaterialsDialog'
import { Edit3, Filter, Plus, SaveIcon, UploadCloud, X } from 'lucide-react'
import DropdownSelect from '@/components/common/DropDown'
import type { RawMaterial, RawMaterialPayload } from '@/types/rawMaterial'
import { useHandleCancelHook } from '@/hooks/useHandleCancelHook'
import { useHandleSaveHook } from '@/hooks/useHandleSaveHook'

const createEmptyRawMaterial = (id: number): RawMaterial => ({
  id,
  primaryName: '',
  secondaryName: '',
  purchaseUnit: '',
  purchaseQuantity: '',
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
        original.purchaseQuantity !== row.purchaseQuantity ||
        original.purchasePrice !== row.purchasePrice
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const isDraftRow = (row: RawMaterial) => row.id < 0

  const isRowEmpty = (row: RawMaterial) =>
    ['primaryName', 'secondaryName', 'purchaseUnit', 'purchaseQuantity'].every(
      (key) => (row[key as keyof RawMaterial]?.toString().trim() ?? '') === ''
    ) && Number(row.purchasePrice ?? 0) === 0

  const isDraftValid = (row: RawMaterial) => {
    const trimmed = {
      primaryName: row.primaryName?.trim() ?? '',
      purchaseUnit: row.purchaseUnit?.trim() ?? '',
      purchaseQuantity: row.purchaseQuantity?.trim() ?? '',
      purchasePrice: Number(row.purchasePrice ?? 0),
    }

    return (
      trimmed.primaryName &&
      trimmed.purchaseUnit &&
      trimmed.purchaseQuantity &&
      trimmed.purchasePrice > 0
    )
  }

  const draftRows = useMemo(
    () => editData.filter((item) => isDraftRow(item)),
    [editData]
  )

  const hasValidDraft = draftRows.some((draft) => isDraftValid(draft))

  const selectedRowIndices = useMemo(() => {
    return selectedRows
      .map((row) => editData.findIndex((item) => item.id === row.id))
      .filter((index) => index !== -1)
  }, [selectedRows, editData])

  const updateRowField = (
    rowId: number,
    field: keyof RawMaterial,
    value: string | number,
    opts: { isDraft?: boolean } = {}
  ) => {
    setEditData((prev) => {
      let blankRowIndex = -1

      const updated = prev.map((item, index) => {
        if (item.id !== rowId) return item

        const wasEmptyDraft = isDraftRow(item) && isRowEmpty(item)

        const normalizedValue =
          field === 'purchasePrice'
            ? typeof value === 'number'
              ? value
              : Number(value) || 0
            : value

        const nextItem = {
          ...item,
          [field]: normalizedValue,
        }

        if (wasEmptyDraft && !isRowEmpty(nextItem)) {
          blankRowIndex = index + 1
        }

        return nextItem
      })

      if (blankRowIndex !== -1) {
        const newTempId = Date.now() * -1
        const blankRow = createEmptyRawMaterial(newTempId)
        updated.splice(blankRowIndex, 0, blankRow)
      }

      return updated
    })

    if (opts.isDraft) {
      setFormState('add')
    }
  }

  const toRawMaterialPayload = (row: RawMaterial): RawMaterialPayload => ({
    primaryName: row.primaryName.trim(),
    secondaryName: row.secondaryName?.trim() ?? '',
    purchaseUnit: row.purchaseUnit,
    purchaseQuantity: row.purchaseQuantity,
    purchasePrice: Number(row.purchasePrice) || 0,
  })

  const handleSaveChanges = async () => {
    if (isAddMode) {
      if (!hasValidDraft || isCreateRawMaterialPending) {
        return
      }

      const draftsToSave = draftRows.filter((draft) => isDraftValid(draft))

      if (!draftsToSave.length) {
        return
      }

      try {
        await createRawMaterial(draftsToSave.map(toRawMaterialPayload))
        setEditData((prev) => prev.filter((item) => !isDraftRow(item)))
        setSelectedRows([])
        setFormState(null)
      } catch (error) {
        console.error(error)
      }
      return
    }

    if (!isEditMode) {
      setFormState('edit')
      return
    }

    if (!hasChanges || isEditRawMaterialsPending) {
      if (!hasChanges) {
        setFormState(null)
      }
      return
    }

    try {
      await editRawMaterial(changedRows)
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

  useHandleCancelHook(formState, handleDiscardChanges)
  useHandleSaveHook(formState, handleSaveChanges)

  const handleSelectionChange = (indices: number[], rows: RawMaterial[]) => {
    setSelectedRows(rows)
  }

  const handleAddRawMaterialRow = () => {
    const hasEmptyDraft = editData.some(
      (item) => isDraftRow(item) && isRowEmpty(item)
    )
    if (hasEmptyDraft) {
      setFormState('add')
      return
    }

    const newTempId = Date.now() * -1
    const blankRow = createEmptyRawMaterial(newTempId)

    setFormState('add')
    setEditData((prev) => {
      const lastDraftIndex = prev.reduce((acc, item, index) => {
        if (isDraftRow(item)) return index
        return acc
      }, -1)

      if (lastDraftIndex === -1) {
        return [blankRow, ...prev]
      }

      const next = [...prev]
      next.splice(lastDraftIndex + 1, 0, blankRow)
      return next
    })
  }

  const handleRemoveDraftRow = (rowId: number) => {
    setEditData((prev) => {
      const next = prev.filter((item) => item.id !== rowId)
      if (!next.some((item) => isDraftRow(item))) {
        setFormState(null)
      }
      return next
    })
  }

  // Data cells layout
  const rawMaterialTableColumns: DataCell[] = [
    {
      headingTitle: 'Primary Name',
      accessVar: 'primaryName',
      className: 'max-w-32',
      render: (value, row) => {
        const isDraft = isDraftRow(row)

        return (
          <div className="relative container">
            <TableInput
              isEditMode={canEditRow(row.id)}
              title=""
              inputValue={value ?? ''}
              onChange={(val) =>
                updateRowField(row.id, 'primaryName', String(val ?? ''), {
                  isDraft,
                })
              }
            />
            {isDraft && !isRowEmpty(row) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleRemoveDraftRow(row.id)
                }}
                className="absolute top-1/2 -left-2/3 min-w-max -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 active:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      },
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
      headingTitle: 'Purchase Quantity',
      accessVar: 'purchaseQuantity',
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
          // <TableDropDown
          //   isEditMode={canEditRow(row.id)}
          //   title=""
          //   options={units}
          //   selected={selectedOption}
          //   placeholder="Select Unit"
          //   onChange={(e) => {
          //     updateRowField(row.id, 'purchaseQuantity', e.label)
          //   }}
          // />
          <TableInput
            isEditMode={canEditRow(row.id)}
            title=""
            inputValue={value ?? ''}
            onChange={(val) =>
              updateRowField(row.id, 'purchaseQuantity', String(val ?? ''))
            }
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
          >
            <UploadCloud className="h-5 w-5 text-black" />
            Export Data
          </ButtonSm>
          <div className="divider min-h-full border border-[#F1F1F1]" />
          {isAddMode ? (
            <>
              <ButtonSm
                state="outline"
                onClick={handleDiscardChanges}
                disabled={isCreateRawMaterialPending}
              >
                <X className="h-4 w-4 text-black" /> Cancel Add
              </ButtonSm>
              <ButtonSm
                className={
                  !hasValidDraft ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!hasValidDraft || isCreateRawMaterialPending}
                isPending={isCreateRawMaterialPending}
              >
                <SaveIcon className="mr-2 h-4 w-4 text-white" /> Save Material
              </ButtonSm>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditRawMaterialsPending}
                >
                  <X className="h-4 w-4 text-black" />{' '}
                  {hasChanges ? 'Discard Changes' : 'Cancel'}
                </ButtonSm>
              )}
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
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddRawMaterialRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Add Raw Material
                </ButtonSm>
              )}
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
        isSelectable={formState !== 'add'}
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

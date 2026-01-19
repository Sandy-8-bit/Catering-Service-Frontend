import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import TableDropDown from '@/components/common/TableDropDown'
import { TableInput } from '@/components/common/TableInput'
import DropdownSelect from '@/components/common/DropDown'
import {
  useFetchAdditionalItems,
  useEditAdditionalItem,
  useCreateAdditionalItem,
} from '@/queries/additionalItemsQueries'
import type {
  AdditionalItem,
  AdditionalItemPayload,
} from '@/types/additionalItem'
import { useHandleCancelHook } from '@/hooks/useHandleCancelHook'
import { useHandleSaveHook } from '@/hooks/useHandleSaveHook'
import { Edit3, Filter, Plus, SaveIcon, UploadCloud, X } from 'lucide-react'

import { DeleteAdditionalItemsDialog } from './DeleteAdditionalItemsDialog'

const BOOLEAN_OPTIONS = [
  { id: 1, label: 'Yes' },
  { id: 0, label: 'No' },
]

const createEmptyAdditionalItem = (id: number): AdditionalItem => ({
  id,
  primaryName: '',
  secondaryName: '',
  description: '',
  trackStock: false,
  availableQty: 0,
  chargeable: false,
  pricePerUnit: 0,
  active: true,
  returnable: false,
})

const NUMBER_FIELDS: ReadonlyArray<keyof AdditionalItem> = [
  'availableQty',
  'pricePerUnit',
]

const BOOLEAN_FIELDS: ReadonlyArray<keyof AdditionalItem> = [
  'trackStock',
  'chargeable',
  'active',
  'returnable',
]

export const AdditionalItemsPage = () => {
  const {
    data: additionalItems = [],
    isLoading: isAdditionalItemsLoading,
    isFetching,
  } = useFetchAdditionalItems()
  const {
    mutateAsync: editAdditionalItem,
    isPending: isEditAdditionalItemsPending,
  } = useEditAdditionalItem()
  const {
    mutateAsync: createAdditionalItem,
    isPending: isCreateAdditionalItemsPending,
  } = useCreateAdditionalItem()

  const [editData, setEditData] = useState<AdditionalItem[]>([])
  const [selectedRows, setSelectedRows] = useState<AdditionalItem[]>([])
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
    setEditData(additionalItems.map((item) => ({ ...item })))
  }, [additionalItems])

  const originalMap = useMemo(() => {
    return new Map(additionalItems.map((item) => [item.id, item]))
  }, [additionalItems])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
      return (
        original.primaryName !== row.primaryName ||
        (original.secondaryName ?? '') !== (row.secondaryName ?? '') ||
        (original.description ?? '') !== (row.description ?? '') ||
        original.trackStock !== row.trackStock ||
        original.availableQty !== row.availableQty ||
        original.chargeable !== row.chargeable ||
        original.pricePerUnit !== row.pricePerUnit ||
        original.active !== row.active ||
        original.returnable !== row.returnable
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const isDraftRow = (row: AdditionalItem) => row.id < 0

  const isRowEmpty = (row: AdditionalItem) => {
    const textFields = ['primaryName', 'secondaryName', 'description'] as const
    const stringsEmpty = textFields.every(
      (key) => (row[key]?.toString().trim() ?? '') === ''
    )
    const numbersEmpty =
      Number(row.pricePerUnit ?? 0) === 0 && Number(row.availableQty ?? 0) === 0

    return stringsEmpty && numbersEmpty
  }

  const isDraftValid = (row: AdditionalItem) => {
    const trimmedName = row.primaryName?.trim() ?? ''
    const price = Number(row.pricePerUnit ?? 0)
    const qty = Number(row.availableQty ?? 0)

    if (!trimmedName || price <= 0) return false
    if (row.trackStock && qty < 0) return false
    return true
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
    field: keyof AdditionalItem,
    value: string | number | boolean,
    opts: { isDraft?: boolean } = {}
  ) => {
    setEditData((prev) => {
      let blankRowIndex = -1

      const updated = prev.map((item, index) => {
        if (item.id !== rowId) return item

        const wasEmptyDraft = isDraftRow(item) && isRowEmpty(item)

        const normalizedValue = BOOLEAN_FIELDS.includes(field)
          ? Boolean(value)
          : NUMBER_FIELDS.includes(field)
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
        const blankRow = createEmptyAdditionalItem(newTempId)
        updated.splice(blankRowIndex, 0, blankRow)
      }

      return updated
    })

    if (opts.isDraft) {
      setFormState('add')
    }
  }

  const toAdditionalItemPayload = (
    row: AdditionalItem
  ): AdditionalItemPayload => ({
    primaryName: row.primaryName.trim(),
    secondaryName: row.secondaryName?.trim() ?? '',
    description: row.description?.trim() ?? '',
    trackStock: Boolean(row.trackStock),
    availableQty: Number(row.availableQty) || 0,
    chargeable: Boolean(row.chargeable),
    pricePerUnit: Number(row.pricePerUnit) || 0,
    active: Boolean(row.active),
    returnable: Boolean(row.returnable),
  })

  const handleSaveChanges = async () => {
    if (isAddMode) {
      if (!hasValidDraft || isCreateAdditionalItemsPending) {
        return
      }

      const draftsToSave = draftRows.filter((draft) => isDraftValid(draft))

      if (!draftsToSave.length) {
        return
      }

      try {
        await createAdditionalItem(draftsToSave.map(toAdditionalItemPayload))
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

    if (!hasChanges || isEditAdditionalItemsPending) {
      if (!hasChanges) {
        setFormState(null)
      }
      return
    }

    try {
      await editAdditionalItem(changedRows)
      setFormState(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(additionalItems.map((item) => ({ ...item })))
    setSelectedRows([])
    setFormState(null)
  }

  useHandleCancelHook(formState, handleDiscardChanges)
  useHandleSaveHook(formState, handleSaveChanges)

  const handleSelectionChange = (indices: number[], rows: AdditionalItem[]) => {
    setSelectedRows(rows)
  }

  const handleAddAdditionalItemRow = () => {
    const hasEmptyDraft = editData.some(
      (item) => isDraftRow(item) && isRowEmpty(item)
    )
    if (hasEmptyDraft) {
      setFormState('add')
      return
    }

    const newTempId = Date.now() * -1
    const blankRow = createEmptyAdditionalItem(newTempId)

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

  const getBooleanOption = (value: boolean) =>
    value ? BOOLEAN_OPTIONS[0] : BOOLEAN_OPTIONS[1]

  const additionalItemTableColumns: DataCell[] = [
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
      headingTitle: 'Description',
      accessVar: 'description',
      className: 'w-52',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.id, 'description', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Track Stock',
      accessVar: 'trackStock',
      className: 'w-32',
      render: (_value, row) => (
        <TableDropDown
          isEditMode={canEditRow(row.id)}
          title=""
          options={BOOLEAN_OPTIONS}
          selected={getBooleanOption(row.trackStock)}
          placeholder="Select"
          onChange={(option) =>
            updateRowField(row.id, 'trackStock', option.id === 1)
          }
        />
      ),
    },
    {
      headingTitle: 'Available Qty',
      accessVar: 'availableQty',
      className: 'w-32',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? 0}
          type="num"
          onChange={(val) =>
            updateRowField(
              row.id,
              'availableQty',
              typeof val === 'number' ? val : Number(val) || 0
            )
          }
        />
      ),
    },
    {
      headingTitle: 'Chargeable',
      accessVar: 'chargeable',
      className: 'w-32',
      render: (_value, row) => (
        <TableDropDown
          isEditMode={canEditRow(row.id)}
          title=""
          options={BOOLEAN_OPTIONS}
          selected={getBooleanOption(row.chargeable)}
          placeholder="Select"
          onChange={(option) =>
            updateRowField(row.id, 'chargeable', option.id === 1)
          }
        />
      ),
    },
    {
      headingTitle: 'Price / Unit (₹)',
      accessVar: 'pricePerUnit',
      className: 'w-40',
      render: (value, row) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? 0}
          type="num"
          onChange={(val) =>
            updateRowField(
              row.id,
              'pricePerUnit',
              typeof val === 'number' ? val : Number(val) || 0
            )
          }
        />
      ),
    },
    {
      headingTitle: 'Active',
      accessVar: 'active',
      className: 'w-28',
      render: (_value, row) => (
        <TableDropDown
          isEditMode={canEditRow(row.id)}
          title=""
          options={BOOLEAN_OPTIONS}
          selected={getBooleanOption(row.active)}
          placeholder="Select"
          onChange={(option) =>
            updateRowField(row.id, 'active', option.id === 1)
          }
        />
      ),
    },
    {
      headingTitle: 'Returnable',
      accessVar: 'returnable',
      className: 'w-32',
      render: (_value, row) => (
        <TableDropDown
          isEditMode={canEditRow(row.id)}
          title=""
          options={BOOLEAN_OPTIONS}
          selected={getBooleanOption(row.returnable)}
          placeholder="Select"
          onChange={(option) =>
            updateRowField(row.id, 'returnable', option.id === 1)
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
          Additional Items
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />
      <section className="flex w-full flex-row justify-between gap-3 px-3 py-4">
        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditAdditionalItemsPending}
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
            disabled={isEditAdditionalItemsPending}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditAdditionalItemsPending}
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
                disabled={isCreateAdditionalItemsPending}
              >
                <X className="h-4 w-4 text-black" /> Cancel Add
              </ButtonSm>
              <ButtonSm
                className={
                  !hasValidDraft ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!hasValidDraft || isCreateAdditionalItemsPending}
                isPending={isCreateAdditionalItemsPending}
              >
                <SaveIcon className="mr-2 h-4 w-4 text-white" /> Save Item
              </ButtonSm>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditAdditionalItemsPending}
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
                  isEditAdditionalItemsPending || (isEditMode && !hasChanges)
                }
                isPending={isEditAdditionalItemsPending}
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
                  ? isEditAdditionalItemsPending
                    ? 'Saving…'
                    : 'Save Changes'
                  : 'Edit Table'}
              </ButtonSm>
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddAdditionalItemRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Add Additional Item
                </ButtonSm>
              )}
            </>
          )}
        </div>
      </section>

      <GenericTable
        data={editData}
        className="mx-3"
        dataCell={additionalItemTableColumns}
        isLoading={isAdditionalItemsLoading || isFetching}
        messageWhenNoData="No additional items available."
        isSelectable={formState !== 'add'}
        selectedRowIndices={selectedRowIndices}
        onSelectionChange={handleSelectionChange}
        onDeleteSelected={handleDeleteSelected}
      />

      <AnimatePresence>
        {isDeleteDialogOpen && selectedRows.length > 0 && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteAdditionalItemsDialog
              items={selectedRows}
              onCancel={() => {
                setIsDeleteDialogOpen(false)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(selectedRows.map((item) => item.id))
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

export default AdditionalItemsPage

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import DropdownSelect from '@/components/common/DropDown'
import { TableInput } from '@/components/common/TableInput'
import {
  useCreateCategory,
  useEditCategory,
  useFetchCategories,
} from '@/queries/CategoryQueries'
import type { Category, CategoryPayload } from '@/types/Category'
import { handleCancelHook } from '@/hooks/handleCancelHook'
import { Edit3, Filter, Plus, SaveIcon, UploadCloud, X } from 'lucide-react'

import { DeleteCategoriesDialog } from './DeleteCatergoriesDialog'

const createEmptyCategory = (id: number): Category => ({
  id,
  primaryName: '',
  secondaryName: '',
})

export const CategoriesPage = () => {
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isFetching,
  } = useFetchCategories()
  const { mutateAsync: editCategory, isPending: isEditCategoriesPending } =
    useEditCategory()
  const { mutateAsync: createCategory, isPending: isCreateCategoryPending } =
    useCreateCategory()

  const [editData, setEditData] = useState<Category[]>([])
  const [selectedRows, setSelectedRows] = useState<Category[]>([])
  const [formState, setFormState] = useState<'add' | 'edit' | 'delete' | null>(
    null
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditMode = formState === 'edit'
  const isAddMode = formState === 'add'
  const canEditRow = (rowId: number) => isEditMode || (isAddMode && rowId < 0)


  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(categories.map((item) => ({ ...item })))
  }, [categories])

  const originalMap = useMemo(() => {
    return new Map(categories.map((item) => [item.id, item]))
  }, [categories])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
      return (
        original.primaryName !== row.primaryName ||
        (original.secondaryName ?? '') !== (row.secondaryName ?? '')
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const isDraftRow = (row: Category) => row.id < 0

  const isRowEmpty = (row: Category) =>
    ['primaryName', 'secondaryName'].every(
      (key) => (row[key as keyof Category]?.toString().trim() ?? '') === ''
    )

  const isDraftValid = (row: Category) => {
    const primaryName = row.primaryName?.trim() ?? ''
    const secondaryName = row.secondaryName?.trim() ?? ''
    return primaryName.length > 0 && secondaryName.length > 0
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
    field: keyof Category,
    value: string,
    opts: { isDraft?: boolean } = {}
  ) => {
    setEditData((prev) => {
      let blankRowIndex = -1

      const updated = prev.map((item, index) => {
        if (item.id !== rowId) return item

        const wasEmptyDraft = isDraftRow(item) && isRowEmpty(item)
        const nextItem = {
          ...item,
          [field]: value,
        }

        if (wasEmptyDraft && !isRowEmpty(nextItem)) {
          blankRowIndex = index + 1
        }

        return nextItem
      })

      if (blankRowIndex !== -1) {
        const newTempId = Date.now() * -1
        const blankRow = createEmptyCategory(newTempId)
        updated.splice(blankRowIndex, 0, blankRow)
      }

      return updated
    })

    if (opts.isDraft) {
      setFormState('add')
    }
  }

  const handleSaveChanges = async () => {
    if (isAddMode) {
      if (!hasValidDraft || isCreateCategoryPending) {
        return
      }

      const draftsToSave = draftRows.filter((draft) => isDraftValid(draft))
      const savedDraftIds = new Set<number>()

      try {
        for (const draft of draftsToSave) {
          const payload: CategoryPayload = {
            primaryName: draft.primaryName.trim(),
            secondaryName: draft.secondaryName?.trim() ?? '',
          }
          // eslint-disable-next-line no-await-in-loop
          await createCategory(payload)
          savedDraftIds.add(draft.id)
        }

        let draftsRemaining = false
        setEditData((prev) => {
          const next = prev.filter((item) => {
            const keep = !savedDraftIds.has(item.id)
            if (keep && isDraftRow(item)) draftsRemaining = true
            return keep
          })
          return next
        })
        setSelectedRows([])
        setFormState(draftsRemaining ? 'add' : null)
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

    if (isEditCategoriesPending) return

    try {
      await Promise.all(changedRows.map((row) => editCategory(row)))
      setFormState(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(categories.map((item) => ({ ...item })))
    setSelectedRows([])
    setFormState(null)
  }

  handleCancelHook(formState, handleDiscardChanges)

  const handleSelectionChange = (indices: number[], rows: Category[]) => {
    setSelectedRows(rows)
  }

  const handleAddCategoryRow = () => {
    const hasEmptyDraft = editData.some(
      (item) => isDraftRow(item) && isRowEmpty(item)
    )
    if (hasEmptyDraft) {
      setFormState('add')
      return
    }

    const newTempId = Date.now() * -1
    const blankRow = createEmptyCategory(newTempId)

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

  const categoryTableColumns: DataCell[] = [
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
            updateRowField(row.id, 'secondaryName', String(val ?? ''), {
              isDraft: isDraftRow(row),
            })
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
          Categories
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />
      <section className="flex w-full flex-row justify-between gap-3 px-3 py-4">
        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditCategoriesPending}
            isPending={isEditCategoriesPending}
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
            disabled={isEditCategoriesPending}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditCategoriesPending}
            isPending={isEditCategoriesPending}
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
                disabled={isCreateCategoryPending}
                isPending={isCreateCategoryPending}
              >
                <X className="h-4 w-4 text-black" /> Cancel Add
              </ButtonSm>
              <ButtonSm
                className={
                  !hasValidDraft ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!hasValidDraft || isCreateCategoryPending}
                isPending={isCreateCategoryPending}
              >
                <SaveIcon className="mr-2 h-4 w-4 text-white" /> Save Category
              </ButtonSm>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditCategoriesPending}
                  isPending={isEditCategoriesPending}
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
                  isEditCategoriesPending || (isEditMode && !hasChanges)
                }
                isPending={isEditCategoriesPending}
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
                  ? isEditCategoriesPending
                    ? 'Saving'
                    : 'Save Changes'
                  : 'Edit Table'}
              </ButtonSm>
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddCategoryRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Add Category
                </ButtonSm>
              )}
            </>
          )}
        </div>
      </section>

      <GenericTable
        data={editData}
        className="mx-3"
        dataCell={categoryTableColumns}
        isLoading={isCategoriesLoading || isFetching}
        messageWhenNoData="No categories available."
        isSelectable={formState !== 'add'}
        selectedRowIndices={selectedRowIndices}
        onSelectionChange={handleSelectionChange}
        onDeleteSelected={handleDeleteSelected}
      />

      <AnimatePresence>
        {isDeleteDialogOpen && selectedRows.length > 0 && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteCategoriesDialog
              categories={selectedRows}
              onCancel={() => {
                setIsDeleteDialogOpen(false)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(
                  selectedRows.map((category) => category.id)
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

export default CategoriesPage

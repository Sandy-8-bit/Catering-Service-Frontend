import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import DropdownSelect from '@/components/common/DropDown'
import TableMultiSelectDropDown from '@/components/common/TableMultiSelectDropDown'
import { TableInput } from '@/components/common/TableInput'
import {
  useCreateCategory,
  useEditCategory,
  useFetchCategories,
  useFetchMasterCategoryOptions,
} from '@/queries/categoryQueries'
import type { Category, CategoryPayload } from '@/types/category'
import { useHandleCancelHook } from '@/hooks/useHandleCancelHook'
import {
  Edit3,
  Filter,
  Plus,
  SaveIcon,
  UploadCloud,
  X,
  Trash2,
} from 'lucide-react'

import { DeleteCategoriesDialog } from './DeleteCatergoriesDialog'
import { useHandleSaveHook } from '@/hooks/useHandleSaveHook'

export const CategoriesPage = () => {
  const { t } = useTranslation()

  const { data: masterCategoryOptions = [] } = useFetchMasterCategoryOptions()

  const createEmptyCategory = (id: number): Category => ({
    id,
    primaryName: '',
    secondaryName: '',
    masterCategoryIds: [],
  })
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
  const [rowToDelete, setRowToDelete] = useState<Category | null>(null)

  const isEditMode = formState === 'edit'
  const isAddMode = formState === 'add'
  const canEditRow = (rowId: number) => isEditMode || (isAddMode && rowId < 0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(categories.map((item) => ({
      ...item,
      // Convert masterCategories array to masterCategoryIds for multi-select
      masterCategoryIds: item.masterCategories?.map((mc) => mc.masterCategoryId) ?? [],
    })))
  }, [categories])

  const originalMap = useMemo(() => {
    return new Map(categories.map((item) => [
      item.id,
      {
        ...item,
        masterCategoryIds: item.masterCategories?.map((mc) => mc.masterCategoryId) ?? [],
      },
    ]))
  }, [categories])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
      const originalIds = (original.masterCategoryIds ?? []).sort((a, b) => a - b)
      const rowIds = (row.masterCategoryIds ?? []).sort((a, b) => a - b)
      return (
        original.primaryName !== row.primaryName ||
        (original.secondaryName ?? '') !== (row.secondaryName ?? '') ||
        JSON.stringify(originalIds) !== JSON.stringify(rowIds)
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
    value: string | number | number[],
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

      if (!draftsToSave.length) {
        return
      }

      const payloads: CategoryPayload[] = draftsToSave.map((draft) => ({
        primaryName: draft.primaryName.trim(),
        secondaryName: draft.secondaryName?.trim() ?? '',
        masterCategoryIds: draft.masterCategoryIds ?? [],
      }))

      try {
        await createCategory(payloads)
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

    if (!hasChanges || isEditCategoriesPending) {
      if (!hasChanges) {
        setFormState(null)
      }
      return
    }

    try {
      await editCategory(changedRows)
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

  useHandleCancelHook(formState, handleDiscardChanges)
  useHandleSaveHook(formState, handleSaveChanges)

  const handleSelectionChange = (_selectedIndices: number[], selectedRows: any[]) => {
    setSelectedRows(selectedRows as Category[])
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
      headingTitle: t('category_primary'),
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
      headingTitle: t('category_secondary'),
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
    {
      headingTitle: 'Master Categories',
      accessVar: 'masterCategories',
      className: 'w-64',
      render: (value, row) => {
        // In view mode, show all master category names
        if (!canEditRow(row.id)) {
          const masterCategories = (value ?? []) as Array<{ masterCategoryId: number; masterCategoryName: string }>
          
          if (!masterCategories.length) {
            return <span className="text-xs text-gray-400">None</span>
          }

          return (
            <div className="flex flex-wrap gap-1">
              {masterCategories.map((mc) => (
                <span
                  key={mc.masterCategoryId}
                  className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"
                >
                  {mc.masterCategoryName}
                </span>
              ))}
            </div>
          )
        }

        // In edit mode, show multi-select with masterCategoryIds
        const selectedIds = (row.masterCategoryIds ?? []) as number[]
        const selectedValues = selectedIds.map((id) => String(id))
        return (
          <TableMultiSelectDropDown
            isEditMode={canEditRow(row.id)}
            title=""
            options={masterCategoryOptions}
            selectedValues={selectedValues}
            placeholder="Select Master Categories"
            onChange={(values) => {
              const numericIds = values.map((v) => Number(v)).filter((v) => !isNaN(v))
              updateRowField(row.id, 'masterCategoryIds', numericIds, {
                isDraft: isDraftRow(row),
              })
            }}
          />
        )
      },
    },
    {
      headingTitle: 'Actions',
      accessVar: 'action',
      className: 'w-20',
      render: (_, row) => {
        const isDraft = isDraftRow(row)
        return !isDraft ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              setRowToDelete(row)
              setIsDeleteDialogOpen(true)
            }}
            className="flex items-center justify-center rounded-md p-2 transition-all duration-200 ease-in-out hover:bg-red-50 active:scale-95"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </button>
        ) : null
      },
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
          {t('categories')}
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
          >
            <Filter className="h-4 w-4 text-black" />
            {t('filter')}
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
          >
            <UploadCloud className="h-5 w-5 text-black" />
            {t('upload')}
          </ButtonSm>
          <div className="divider min-h-full border border-[#F1F1F1]" />
          {!isAddMode && selectedRows.length > 0 && (
            <>
              <ButtonSm
                className="font-medium"
                state="outline"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                {t('delete')}
              </ButtonSm>
              <div className="divider min-h-full border border-[#F1F1F1]" />
            </>
          )}
          {isAddMode ? (
            <>
              <ButtonSm
                state="outline"
                onClick={handleDiscardChanges}
                disabled={isCreateCategoryPending}
              >
                <X className="h-4 w-4 text-black" /> {t('cancel')}
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
                <SaveIcon className="mr-2 h-4 w-4 text-white" /> {t('save')}
              </ButtonSm>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditCategoriesPending}
                >
                  <X className="h-4 w-4 text-black" />{' '}
                  {hasChanges ? t('discard_changes') : t('cancel')}
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
                    : t('save_changes')
                  : t('edit')}
              </ButtonSm>
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddCategoryRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  {t('add_category')}
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
        messageWhenNoData={t('no_data')}
        isSelectable={formState !== 'add'}
        selectedRowIndices={selectedRowIndices}
        onSelectionChange={handleSelectionChange}
        onDeleteSelected={handleDeleteSelected}
      />

      <AnimatePresence>
        {isDeleteDialogOpen && (selectedRows.length > 0 || rowToDelete) && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteCategoriesDialog
              categories={rowToDelete ? [rowToDelete] : selectedRows}
              onCancel={() => {
                setIsDeleteDialogOpen(false)
                setRowToDelete(null)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(
                  (rowToDelete ? [rowToDelete] : selectedRows).map(
                    (category) => category.id
                  )
                )
                setEditData((prev) =>
                  prev.filter((item) => !idsToDelete.has(item.id))
                )
                setSelectedRows([])
                setIsDeleteDialogOpen(false)
                setRowToDelete(null)
              }}
            />
          </DialogBox>
        )}
      </AnimatePresence>
    </main>
  )
}

export default CategoriesPage

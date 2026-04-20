import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import DropdownSelect from '@/components/common/DropDown'
import { TableInput } from '@/components/common/TableInput'
import {
  useCreateMasterCategory,
  useEditMasterCategory,
  useFetchMasterCategories,
} from '@/queries/masterCategoryQueries'
import type { MasterCategory } from '@/types/masterCategory'
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

import { DeleteMasterCategoriesDialog } from './DeleteMasterCategoriesDialog'
import { useHandleSaveHook } from '@/hooks/useHandleSaveHook'

export const MasterCategoriesPage = () => {
  const { t } = useTranslation()

  const createEmptyMasterCategory = (id: number): MasterCategory => ({
    id,
    primaryName: '',
    secondaryName: '',
    description: '',
    active: true,
  })

  const {
    data: masterCategories = [],
    isLoading: isMasterCategoriesLoading,
    isFetching,
  } = useFetchMasterCategories()

  const { mutateAsync: editMasterCategory, isPending: isEditMasterCategoriesPending } =
    useEditMasterCategory()

  const { mutateAsync: createMasterCategory, isPending: isCreateMasterCategoryPending } =
    useCreateMasterCategory()

  const [editData, setEditData] = useState<MasterCategory[]>([])
  const [selectedRows, setSelectedRows] = useState<MasterCategory[]>([])
  const [formState, setFormState] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [rowToDelete, setRowToDelete] = useState<MasterCategory | null>(null)

  const isEditMode = formState === 'edit'
  const isAddMode = formState === 'add'
  const canEditRow = (rowId: number) => isEditMode || (isAddMode && rowId < 0)

  useEffect(() => {
    setEditData(masterCategories.map((item) => ({ ...item })))
  }, [masterCategories])

  const originalMap = useMemo(() => {
    return new Map(masterCategories.map((item) => [item.id, item]))
  }, [masterCategories])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
      return (
        original.primaryName !== row.primaryName ||
        (original.secondaryName ?? '') !== (row.secondaryName ?? '') ||
        (original.description ?? '') !== (row.description ?? '') ||
        original.active !== row.active
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const isDraftRow = (row: MasterCategory) => row.id < 0

  const isRowEmpty = (row: MasterCategory) =>
    ['primaryName', 'secondaryName', 'description'].every(
      (key) => (row[key as keyof MasterCategory]?.toString().trim() ?? '') === ''
    )

  const isDraftValid = (row: MasterCategory) => {
    const primaryName = row.primaryName?.trim() ?? ''
    const secondaryName = row.secondaryName?.trim() ?? ''
    const description = row.description?.trim() ?? ''
    return primaryName.length > 0 && secondaryName.length > 0 && description.length > 0
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
    field: keyof MasterCategory,
    value: string | boolean,
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
        const blankRow = createEmptyMasterCategory(newTempId)
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
      if (!hasValidDraft || isCreateMasterCategoryPending) {
        return
      }

      const draftsToSave = draftRows.filter((draft) => isDraftValid(draft))

      if (!draftsToSave.length) {
        return
      }

      try {
        await Promise.all(
          draftsToSave.map((draft) =>
            createMasterCategory({
              primaryName: draft.primaryName.trim(),
              secondaryName: draft.secondaryName?.trim() ?? '',
              description: draft.description?.trim() ?? '',
              active: draft.active,
            })
          )
        )
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

    if (!hasChanges || isEditMasterCategoriesPending) {
      if (!hasChanges) {
        setFormState(null)
      }
      return
    }

    try {
      await Promise.all(changedRows.map((row) => editMasterCategory(row)))
      setFormState(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(masterCategories.map((item) => ({ ...item })))
    setSelectedRows([])
    setFormState(null)
  }

  useHandleCancelHook(formState, handleDiscardChanges)
  useHandleSaveHook(formState, handleSaveChanges)

  const handleSelectionChange = (_selectedIndices: number[], selectedRowsData: any[]) => {
    setSelectedRows(selectedRowsData as MasterCategory[])
  }

  const handleAddMasterCategoryRow = () => {
    const hasEmptyDraft = editData.some(
      (item) => isDraftRow(item) && isRowEmpty(item)
    )
    if (hasEmptyDraft) {
      setFormState('add')
      return
    }

    const newTempId = Date.now() * -1
    const blankRow = createEmptyMasterCategory(newTempId)

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

  const masterCategoryTableColumns: DataCell[] = [
    {
      headingTitle: t('primary_name'),
      accessVar: 'primaryName',
      className: 'max-w-32',
      render: (value, row: MasterCategory) => {
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
      headingTitle: t('secondary_name'),
      accessVar: 'secondaryName',
      className: 'w-42',
      render: (value, row: MasterCategory) => (
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
      headingTitle: t('description'),
      accessVar: 'description',
      className: 'max-w-64',
      render: (value, row: MasterCategory) => (
        <TableInput
          isEditMode={canEditRow(row.id)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.id, 'description', String(val ?? ''), {
              isDraft: isDraftRow(row),
            })
          }
        />
      ),
    },
    {
      headingTitle: t('status'),
      accessVar: 'active',
      className: 'max-w-32',
      render: (value, row: MasterCategory) => {
        const isActive = Boolean(value)
        const isDraft = isDraftRow(row)
        
        if (canEditRow(row.id)) {
          return (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateRowField(row.id, 'active', true, { isDraft })}
                className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => updateRowField(row.id, 'active', false, { isDraft })}
                className={`rounded px-2 py-1 text-xs font-semibold transition-all ${
                  !isActive
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactive
              </button>
            </div>
          )
        }
        
        return (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {isActive ? t('active') : t('inactive')}
          </span>
        )
      },
    },
    {
      headingTitle: 'Actions',
      accessVar: 'action',
      className: 'w-20',
      render: (_, row: MasterCategory) => {
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
          {t('master_categories')}
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />
      <section className="flex w-full flex-row justify-between gap-3 px-3 py-4">
        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditMasterCategoriesPending}
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
            disabled={isEditMasterCategoriesPending}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditMasterCategoriesPending}
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
                disabled={isCreateMasterCategoryPending}
              >
                <X className="h-4 w-4 text-black" /> {t('cancel')}
              </ButtonSm>
              <ButtonSm
                className={
                  !hasValidDraft ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!hasValidDraft || isCreateMasterCategoryPending}
                isPending={isCreateMasterCategoryPending}
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
                  disabled={isEditMasterCategoriesPending}
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
                  isEditMasterCategoriesPending || (isEditMode && !hasChanges)
                }
                isPending={isEditMasterCategoriesPending}
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
                  ? isEditMasterCategoriesPending
                    ? 'Saving'
                    : t('save_changes')
                  : t('edit')}
              </ButtonSm>
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddMasterCategoryRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  {t('add_master_category')}
                </ButtonSm>
              )}
            </>
          )}
        </div>
      </section>

      <div className="flex-1 overflow-auto">
        <GenericTable
          data={editData}
          dataCell={masterCategoryTableColumns}
          isLoading={isMasterCategoriesLoading || isFetching}
          messageWhenNoData={t('no_data')}
          isSelectable={true}
          selectedRowIndices={selectedRowIndices}
          onSelectionChange={handleSelectionChange}
        />
      </div>

      <AnimatePresence mode="wait">
        {isDeleteDialogOpen && (
          <DeleteMasterCategoriesDialog
            rowToDelete={rowToDelete}
            isOpen={isDeleteDialogOpen}
            setIsOpen={setIsDeleteDialogOpen}
            selectedRowsToDelete={
              selectedRows.length > 0 ? selectedRows : rowToDelete ? [rowToDelete] : []
            }
          />
        )}
      </AnimatePresence>
    </main>
  )
}

export default MasterCategoriesPage

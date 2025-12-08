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
  useEditRawMaterial,
} from '@/queries/RawMaterialsQueries'

import { AddRawMaterialsDialog } from './AddRawMaterialsDialog'
import { DeleteRawMaterialsDialog } from './DeleteRawMaterialsDialog'
import { Edit3, Filter, Plus, UploadCloud, X } from 'lucide-react'
import DropdownSelect from '@/components/common/DropDown'

export const RawMaterialsPage = () => {
  // queries
  const {
    data: rawMaterials = [],
    isLoading: isRawMaterialsLoading,
    isFetching,
  } = useFetchRawMaterials()
  const editRawMaterial = useEditRawMaterial()

  // States
  const [editData, setEditData] = useState<RawMaterial[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedRowIndices, setSelectedRowIndices] = useState<number[]>([])
  const [selectedRows, setSelectedRows] = useState<RawMaterial[]>([])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargets, setDeleteTargets] = useState<RawMaterial[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  // useEffects
  useEffect(() => {
    setEditData(rawMaterials.map((item) => ({ ...item })))
  }, [rawMaterials])

  const originalMap = useMemo(() => {
    return new Map(rawMaterials.map((item) => [item.id, item]))
  }, [rawMaterials])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.id)
      if (!original) return false
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
    if (!isEditMode) {
      setIsEditMode(true)
      return
    }

    if (!hasChanges) {
      setIsEditMode(false)
      return
    }

    setIsSaving(true)
    try {
      for (const row of changedRows) {
        // eslint-disable-next-line no-await-in-loop
        await editRawMaterial.mutateAsync(row)
      }
      setIsEditMode(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(rawMaterials.map((item) => ({ ...item })))
    setSelectedRowIndices([])
    setSelectedRows([])
    setIsEditMode(false)
  }

  const handleSelectionChange = (indices: number[], rows: RawMaterial[]) => {
    setSelectedRowIndices(indices)
    setSelectedRows(rows)
  }

  // Data cells layout
  const rawMaterialTableColumns: DataCell[] = [
    {
      headingTitle: 'Primary Name',
      accessVar: 'primaryName',
      className: 'max-w-32',
      render: (value, row) => (
        <TableInput
          isEditMode={isEditMode}
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
          isEditMode={isEditMode}
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
            isEditMode={isEditMode}
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
            isEditMode={isEditMode}
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
          isEditMode={isEditMode}
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
    setDeleteTargets(selectedRows)
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
            disabled={isSaving}
            isPending={isSaving}
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
            disabled={isSaving}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isSaving}
            isPending={isSaving}
          >
            <UploadCloud className="h-5 w-5 text-black" />
            Export Data
          </ButtonSm>
          <div className="divider min-h-full border border-[#F1F1F1]" />
          <ButtonSm
            className={
              !hasChanges && isEditMode
                ? 'cursor-not-allowed! opacity-100!'
                : ''
            }
            state={isEditMode ? 'default' : 'outline'}
            onClick={() => void handleSaveChanges()}
            disabled={isSaving || (isEditMode && !hasChanges)}
            isPending={isSaving}
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
              ? isSaving
                ? 'Saving…'
                : 'Save Changes'
              : 'Edit Table'}
          </ButtonSm>
          {isEditMode && (
            <ButtonSm
              state="outline"
              onClick={() => {
                if (hasChanges) {
                  handleDiscardChanges()
                } else {
                  setIsEditMode(false)
                }
              }}
              disabled={isSaving}
              isPending={isSaving}
            >
              <X className="h-4 w-4 text-black" />{' '}
              {hasChanges ? 'Discard Changes' : 'Cancel'}
            </ButtonSm>
          )}
          <ButtonSm state="default" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4 text-white" />
            Add Raw Material
          </ButtonSm>
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
        {isAddDialogOpen && (
          <DialogBox setToggleDialogueBox={setIsAddDialogOpen}>
            <AddRawMaterialsDialog
              onCancel={() => setIsAddDialogOpen(false)}
              onCreated={(material) => {
                if (material) {
                  setEditData((prev) => [...prev, material])
                }
                setIsAddDialogOpen(false)
              }}
            />
          </DialogBox>
        )}

        {isDeleteDialogOpen && deleteTargets.length > 0 && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteRawMaterialsDialog
              materials={deleteTargets}
              onCancel={() => {
                setDeleteTargets([])
                setIsDeleteDialogOpen(false)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(
                  deleteTargets.map((material) => material.id)
                )
                setEditData((prev) =>
                  prev.filter((item) => !idsToDelete.has(item.id))
                )
                setSelectedRowIndices([])
                setSelectedRows([])
                setDeleteTargets([])
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

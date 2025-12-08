import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import PageHeader from '@/components/common/PageHeader'
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

  const handleSelectionChange = (indices: number[], rows: RawMaterial[]) => {
    setSelectedRowIndices(indices)
    setSelectedRows(rows)
  }

  // Data cells layout
  const rawMaterialTableColumns: DataCell[] = [
    {
      headingTitle: 'Primary Name',
      accessVar: 'primaryName',
      className: 'w-32',
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
      className: 'w-32',
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
              updateRowField(row.id, 'consumptionUnit', e.label)
            }}
          />
        )
      },
    },
    {
      headingTitle: 'Purchase Price (₹)',
      accessVar: 'purchasePrice',
      className: 'w-32',
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
    <main className="flex w-full flex-col gap-4">
      <section className="flex w-full flex-col gap-3 rounded-[12px] bg-white/80 px-3 py-1.5 shadow-sm">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <PageHeader className="mr-auto!" title="Raw Materials" />
        </header>
      </section>

      <section className="flex w-full flex-row justify-end gap-3 px-3 py-3">
        <ButtonSm
          className="font-medium"
          state="outline"
          onClick={() => setIsAddDialogOpen(true)}
        >
          Add Raw Material
        </ButtonSm>
        <ButtonSm
          className="font-medium"
          state="default"
          onClick={() => void handleSaveChanges()}
          disabled={isSaving}
          isPending={isSaving}
        >
          {isEditMode ? (isSaving ? 'Saving…' : 'Save Changes') : 'Edit Table'}
        </ButtonSm>
      </section>

      <GenericTable
        data={editData}
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

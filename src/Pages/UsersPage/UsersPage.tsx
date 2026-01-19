import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'

import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import DropdownSelect from '@/components/common/DropDown'
import GenericTable, { type DataCell } from '@/components/common/GenericTable'
import TableMultiSelectDropDown from '@/components/common/TableMultiSelectDropDown'
import { TableInput } from '@/components/common/TableInput'
import { ROLE_OPTIONS } from '@/constants/constants'
import { useHandleCancelHook } from '@/hooks/useHandleCancelHook'
import { useHandleSaveHook } from '@/hooks/useHandleSaveHook'
import {
  useCreateUser,
  useEditUser,
  useFetchUsers,
} from '@/queries/UsersQueries'
import type { User, UserPayload } from '@/types/User'
import { Edit3, Filter, Plus, SaveIcon, UploadCloud, X } from 'lucide-react'
import { DeleteUsersDialog } from './DeleteUsersDialog'

type EditableUser = User & { password?: string }

const createEmptyUser = (id: number): EditableUser => ({
  userId: id,
  name: '',
  email: '',
  phone: '',
  password: '',
  role: "",
})

const areRolesEqual = (left: string[], right: string[]) => {
  if (left.length !== right.length) return false
  const leftSet = new Set(left.map((role) => role.trim()))
  const rightSet = new Set(right.map((role) => role.trim()))
  if (leftSet.size !== rightSet.size) return false
  for (const value of leftSet) {
    if (!rightSet.has(value)) return false
  }
  return true
}

export const UsersPage = () => {
  const {
    data: users = [],
    isLoading: isUsersLoading,
    isFetching,
  } = useFetchUsers()
  const { mutateAsync: editUser, isPending: isEditUsersPending } = useEditUser()
  const { mutateAsync: createUser, isPending: isCreateUsersPending } =
    useCreateUser()

  const [editData, setEditData] = useState<EditableUser[]>([])
  const [selectedRows, setSelectedRows] = useState<EditableUser[]>([])
  const [formState, setFormState] = useState<'add' | 'edit' | 'delete' | null>(
    null
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const isEditMode = formState === 'edit'
  const isAddMode = formState === 'add'
  const canEditRow = (rowId: number) => isEditMode || (isAddMode && rowId < 0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditData(
      users.map((user) => ({ ...user, password: '', role: user.role ?? "" }))
    )
  }, [users])

  const roleLabelById = useMemo(() => {
    const map = new Map<string, string>()
    ROLE_OPTIONS.forEach((option) => {
      map.set(String(option.id), option.label)
    })
    return map
  }, [])

  const roleIdByLabel = useMemo(() => {
    const map = new Map<string, string>()
    ROLE_OPTIONS.forEach((option) => {
      map.set(option.label.trim().toLowerCase(), String(option.id))
    })
    return map
  }, [])

  const originalMap = useMemo(() => {
    return new Map(users.map((user) => [user.userId, user]))
  }, [users])

  const changedRows = useMemo(() => {
    return editData.filter((row) => {
      const original = originalMap.get(row.userId)
      if (!original) return false

      const passwordChanged = Boolean(row.password?.trim())

      return (
        original.name !== row.name ||
        original.email !== row.email ||
        original.phone !== row.phone ||
        original.role !== row.role ||
        passwordChanged
      )
    })
  }, [editData, originalMap])

  const hasChanges = changedRows.length > 0

  const isDraftRow = (row: EditableUser) => row.userId < 0

  const isRowEmpty = (row: EditableUser) => {
    const emptyFields = ['name', 'email', 'phone'] as const
    const stringsEmpty = emptyFields.every(
      (field) => (row[field]?.toString().trim() ?? '') === ''
    )
    const roleEmpty = (row.role?.trim() ?? '').length === 0
    const passwordEmpty = (row.password?.trim() ?? '').length === 0

    return stringsEmpty && roleEmpty && passwordEmpty
  }

  const isDraftValid = (row: EditableUser) => {
    const trimmedName = row.name?.trim() ?? ''
    const trimmedEmail = row.email?.trim() ?? ''
    const trimmedPhone = row.phone?.trim() ?? ''
    const passwordOk = (row.password?.trim() ?? '').length >= 6

    return (
      trimmedName &&
      trimmedEmail &&
      trimmedPhone &&
      passwordOk &&
      (row.role?.trim() ?? '').length > 0
    )
  }

  const draftRows = useMemo(
    () => editData.filter((row) => isDraftRow(row)),
    [editData]
  )

  const hasValidDraft = draftRows.some((draft) => isDraftValid(draft))

  const selectedRowIndices = useMemo(() => {
    return selectedRows
      .map((row) => editData.findIndex((item) => item.userId === row.userId))
      .filter((index) => index !== -1)
  }, [selectedRows, editData])

  const updateRowField = (
    rowId: number,
    field: keyof EditableUser,
    value: string | number | string[],
    opts: { isDraft?: boolean } = {}
  ) => {
    setEditData((prev) => {
      let blankRowIndex = -1

      const updated = prev.map((item, index) => {
        if (item.userId !== rowId) return item

        const wasEmptyDraft = isDraftRow(item) && isRowEmpty(item)

        let normalizedValue: EditableUser[typeof field]
        if (field === 'role') {
          normalizedValue = value as EditableUser[typeof field]
        } else {
          normalizedValue = value as EditableUser[typeof field]
        }

        const nextItem: EditableUser = {
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
        const blankRow = createEmptyUser(newTempId)
        updated.splice(blankRowIndex, 0, blankRow)
      }

      return updated
    })

    if (opts.isDraft) {
      setFormState('add')
    }
  }

  const toUserPayload = (row: EditableUser): UserPayload => {
    const payload: UserPayload = {
      name: row.name.trim(),
      email: row.email.trim(),
      phone: row.phone.trim(),
      role: row.role?.trim() ?? '',
    }

    const password = row.password?.trim()
    if (password) {
      payload.password = password
    }

    return payload
  }

  const handleSaveChanges = async () => {
    if (isAddMode) {
      if (!hasValidDraft || isCreateUsersPending) {
        return
      }

      const draftsToSave = draftRows.filter((draft) => isDraftValid(draft))
      const savedDraftIds = new Set<number>()

      try {
        for (const draft of draftsToSave) {
          // eslint-disable-next-line no-await-in-loop
          await createUser(toUserPayload(draft))
          savedDraftIds.add(draft.userId)
        }

        let draftsRemaining = false
        setEditData((prev) => {
          const next = prev.filter((row) => {
            const keep = !savedDraftIds.has(row.userId)
            if (keep && isDraftRow(row)) draftsRemaining = true
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

    if (isEditUsersPending) return

    try {
      await Promise.all(changedRows.map((row) => editUser(row)))
      setFormState(null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleDiscardChanges = () => {
    setEditData(
      users.map((user) => ({ ...user, password: '', role: user.role ?? '' }))
    )
    setSelectedRows([])
    setFormState(null)
  }

  useHandleCancelHook(formState, handleDiscardChanges)
  useHandleSaveHook(formState, handleSaveChanges)

  const handleSelectionChange = (indices: number[], rows: EditableUser[]) => {
    setSelectedRows(rows)
  }

  const handleAddUserRow = () => {
    const hasEmptyDraft = editData.some(
      (row) => isDraftRow(row) && isRowEmpty(row)
    )
    if (hasEmptyDraft) {
      setFormState('add')
      return
    }

    const newTempId = Date.now() * -1
    const blankRow = createEmptyUser(newTempId)

    setFormState('add')
    setEditData((prev) => {
      const lastDraftIndex = prev.reduce((acc, row, index) => {
        if (isDraftRow(row)) return index
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
      const next = prev.filter((row) => row.userId !== rowId)
      if (!next.some((row) => isDraftRow(row))) {
        setFormState(null)
      }
      return next
    })
  }

  const userTableColumns: DataCell[] = [
    {
      headingTitle: 'Name',
      accessVar: 'name',
      className: 'w-48',
      render: (value, row: EditableUser) => {
        const isDraft = isDraftRow(row)
        return (
          <div className="relative">
            <TableInput
              isEditMode={canEditRow(row.userId)}
              title=""
              inputValue={value ?? ''}
              onChange={(val) =>
                updateRowField(row.userId, 'name', String(val ?? ''), {
                  isDraft,
                })
              }
            />
            {isDraft && !isRowEmpty(row) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  handleRemoveDraftRow(row.userId)
                }}
                className="absolute top-1/2 -left-2/3 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 ease-in-out hover:scale-105 active:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      },
    },
    {
      headingTitle: 'Email',
      accessVar: 'email',
      className: 'w-52',
      render: (value, row: EditableUser) => (
        <TableInput
          isEditMode={canEditRow(row.userId)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.userId, 'email', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Phone',
      accessVar: 'phone',
      className: 'w-40',
      render: (value, row: EditableUser) => (
        <TableInput
          isEditMode={canEditRow(row.userId)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.userId, 'phone', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Password',
      accessVar: 'password',
      className: 'w-48',
      render: (value, row: EditableUser) => (
        <TableInput
          isEditMode={canEditRow(row.userId)}
          title=""
          inputValue={value ?? ''}
          onChange={(val) =>
            updateRowField(row.userId, 'password', String(val ?? ''))
          }
        />
      ),
    },
    {
      headingTitle: 'Roles',
      accessVar: 'roles',
      className: 'w-64',
      render: (_value, row: EditableUser) => (
        <TableMultiSelectDropDown
          isEditMode={canEditRow(row.userId)}
          title=""
          options={ROLE_OPTIONS}
          selectedValues={((row.role ?? "") as string).split(',').filter(Boolean).map(
            (role) => roleIdByLabel.get(role.trim().toLowerCase()) ?? role
          )}
          placeholder="Select Roles"
          onChange={(values) =>
            updateRowField(
              row.userId,
              'role',
              values.map((id) => roleLabelById.get(id) ?? id).join(',')
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
          Users
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />
      <section className="flex w-full flex-row justify-between gap-3 px-3 py-4">
        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditUsersPending}
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
            disabled={isEditUsersPending}
          />
        </div>

        <div className="flex w-max flex-row justify-end gap-3">
          <ButtonSm
            className="font-medium"
            state="outline"
            onClick={() => {}}
            disabled={isEditUsersPending}
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
                disabled={isCreateUsersPending}
              >
                <X className="h-4 w-4 text-black" /> Cancel Add
              </ButtonSm>
              <ButtonSm
                className={
                  !hasValidDraft ? 'cursor-not-allowed! opacity-100!' : ''
                }
                state="default"
                onClick={() => void handleSaveChanges()}
                disabled={!hasValidDraft || isCreateUsersPending}
                isPending={isCreateUsersPending}
              >
                <SaveIcon className="mr-2 h-4 w-4 text-white" /> Save User
              </ButtonSm>
            </>
          ) : (
            <>
              {isEditMode && (
                <ButtonSm
                  state="outline"
                  onClick={handleDiscardChanges}
                  disabled={isEditUsersPending}
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
                disabled={isEditUsersPending || (isEditMode && !hasChanges)}
                isPending={isEditUsersPending}
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
                  ? isEditUsersPending
                    ? 'Saving…'
                    : 'Save Changes'
                  : 'Edit Table'}
              </ButtonSm>
              {!isEditMode && (
                <ButtonSm state="default" onClick={handleAddUserRow}>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  Add User
                </ButtonSm>
              )}
            </>
          )}
        </div>
      </section>

      <GenericTable
        data={editData}
        className="mx-3"
        dataCell={userTableColumns}
        isLoading={isUsersLoading || isFetching}
        messageWhenNoData="No users found."
        isSelectable={formState !== 'add'}
        selectedRowIndices={selectedRowIndices}
        onSelectionChange={handleSelectionChange}
        onDeleteSelected={handleDeleteSelected}
      />

      <AnimatePresence>
        {isDeleteDialogOpen && selectedRows.length > 0 && (
          <DialogBox setToggleDialogueBox={setIsDeleteDialogOpen}>
            <DeleteUsersDialog
              users={selectedRows}
              onCancel={() => {
                setIsDeleteDialogOpen(false)
              }}
              onDeleted={() => {
                const idsToDelete = new Set(
                  selectedRows.map((user) => user.userId)
                )
                setEditData((prev) =>
                  prev.filter((user) => !idsToDelete.has(user.userId))
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

export default UsersPage

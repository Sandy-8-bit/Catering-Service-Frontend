import ButtonSm from '@/components/common/Buttons'
import DialogBox from '@/components/common/DialogBox'
import type { MasterCategory } from '@/types/masterCategory'
import { useDeleteMasterCategory } from '@/queries/masterCategoryQueries'

interface DeleteMasterCategoriesDialogProps {
  rowToDelete: MasterCategory | null
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  selectedRowsToDelete: MasterCategory[]
}

export const DeleteMasterCategoriesDialog = ({
  rowToDelete,
  isOpen,
  setIsOpen,
  selectedRowsToDelete,
}: DeleteMasterCategoriesDialogProps) => {
  const { mutateAsync: deleteCategory, isPending: isDeleting } = useDeleteMasterCategory()

  const categoriesToDelete = selectedRowsToDelete.length > 0 ? selectedRowsToDelete : rowToDelete ? [rowToDelete] : []
  const totalToDelete = categoriesToDelete.length
  const primaryCategory = categoriesToDelete[0]

  const handleDelete = async () => {
    if (totalToDelete === 0) return
    try {
      for (const category of categoriesToDelete) {
        // eslint-disable-next-line no-await-in-loop
        await deleteCategory(category.id)
      }
      setIsOpen(false)
    } catch (error) {
      console.error(error)
    }
  }

  if (!isOpen) return null

  const dialogContent = (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void handleDelete()
      }}
    >
      <header className="flex w-full items-center justify-between text-lg font-semibold text-zinc-800">
        <span>Delete Master Category</span>
        <img
          onClick={() => setIsOpen(false)}
          className="w-5 cursor-pointer"
          src="/icons/close-icon.svg"
          alt="close"
        />
      </header>

      {primaryCategory ? (
        <div className="space-y-3 text-sm">
          <div className="rounded-md bg-red-50 p-3">
            <p className="leading-relaxed text-zinc-700">
              You are about to delete{' '}
              <span className="font-semibold text-red-500">
                {totalToDelete === 1
                  ? primaryCategory?.primaryName
                  : `${totalToDelete} master categories`}
              </span>
              . This action cannot be undone.
            </p>
            {totalToDelete > 1 && (
              <ul className="list-disc space-y-1 pl-5 pt-2 text-xs text-red-600">
                {categoriesToDelete.slice(0, 3).map((category) => (
                  <li key={category.id}>{category.primaryName}</li>
                ))}
                {totalToDelete > 3 && <li>+ {totalToDelete - 3} more…</li>}
              </ul>
            )}
          </div>

          <section className="grid w-full grid-cols-2 gap-3">
            <ButtonSm
              state="outline"
              text="Cancel"
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            />
            <ButtonSm
              className="bg-red-500! text-white hover:bg-red-600!"
              state="default"
              type="submit"
              text={isDeleting ? 'Deleting...' : 'Delete'}
              disabled={isDeleting || !primaryCategory}
              isPending={isDeleting}
              autoFocus
            />
          </section>
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No master category selected.</p>
      )}
    </form>
  )

  return (
    <DialogBox setToggleDialogueBox={setIsOpen as unknown as React.Dispatch<React.SetStateAction<boolean>>} width="max-w-md">
      {dialogContent}
    </DialogBox>
  )
}

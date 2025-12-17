import ButtonSm from '@/components/common/Buttons'
import type { Category } from '@/types/Category'
import { useDeleteCategory } from '@/queries/CategoryQueries'

interface DeleteCategoriesDialogProps {
  categories: Category[]
  onCancel: () => void
  onDeleted: () => void
}

export const DeleteCategoriesDialog = ({
  categories,
  onCancel,
  onDeleted,
}: DeleteCategoriesDialogProps) => {
  const { mutateAsync, isPending } = useDeleteCategory()
  const totalToDelete = categories.length
  const primaryCategory = categories[0]

  const handleDelete = async () => {
    if (totalToDelete === 0) return
    try {
      for (const category of categories) {
        // eslint-disable-next-line no-await-in-loop
        await mutateAsync(category)
      }
      onDeleted()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void handleDelete()
      }}
    >
      <header className="flex w-full items-center justify-between text-lg font-semibold text-red-600">
        Delete Category
        <img
          onClick={onCancel}
          className="w-5 cursor-pointer"
          src="/icons/close-icon.svg"
          alt="close"
        />
      </header>

      {primaryCategory ? (
        <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
          <p>
            You are about to delete{' '}
            <span className="font-semibold text-red-500">
              {totalToDelete === 1
                ? primaryCategory.primaryName
                : `${totalToDelete} categories`}
            </span>
            . This action cannot be undone.
          </p>
          {totalToDelete > 1 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-500">
              {categories.slice(0, 3).map((category) => (
                <li key={category.id}>{category.primaryName}</li>
              ))}
              {totalToDelete > 3 && <li>+ {totalToDelete - 3} more…</li>}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No category selected.</p>
      )}

      <section className="mt-1 grid w-full grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <ButtonSm
          state="outline"
          text="Cancel"
          type="button"
          onClick={onCancel}
          disabled={isPending}
        />
        <ButtonSm
          className="items-center justify-center bg-red-500! text-white hover:bg-red-600!"
          state="default"
          type="submit"
          text={isPending ? 'Deleting...' : 'Delete'}
          disabled={isPending || !primaryCategory}
          isPending={isPending}
          autoFocus
        />
      </section>
    </form>
  )
}

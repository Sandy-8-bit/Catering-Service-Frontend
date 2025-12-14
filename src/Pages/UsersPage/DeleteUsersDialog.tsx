import ButtonSm from '@/components/common/Buttons'
import { useDeleteUser } from '@/queries/UsersQueries'
import type { User } from '@/types/User'

interface DeleteUsersDialogProps {
  users: User[]
  onCancel: () => void
  onDeleted: () => void
}

export const DeleteUsersDialog = ({
  users,
  onCancel,
  onDeleted,
}: DeleteUsersDialogProps) => {
  const { mutateAsync, isPending } = useDeleteUser()
  const totalToDelete = users.length
  const primaryUser = users[0]

  const handleDelete = async () => {
    if (totalToDelete === 0) return
    try {
      for (const user of users) {
        // eslint-disable-next-line no-await-in-loop
        await mutateAsync(user)
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
        Delete User
        <img
          onClick={onCancel}
          className="w-5 cursor-pointer"
          src="/icons/close-icon.svg"
          alt="close"
        />
      </header>

      {primaryUser ? (
        <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
          <p>
            You are about to delete{' '}
            <span className="font-semibold text-red-500">
              {totalToDelete === 1
                ? primaryUser.name
                : `${totalToDelete} users`}
            </span>
            . This action cannot be undone.
          </p>
          {totalToDelete > 1 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-500">
              {users.slice(0, 3).map((user) => (
                <li key={user.userId}>{user.name}</li>
              ))}
              {totalToDelete > 3 && <li>+ {totalToDelete - 3} more…</li>}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No user selected.</p>
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
          disabled={isPending || !primaryUser}
          isPending={isPending}
        />
      </section>
    </form>
  )
}

import ButtonSm from '@/components/common/Buttons'
import { useDeleteProduct } from '@/queries/productQueries'
import type { Product } from '@/types/product'

interface DeleteProductsDialogProps {
  products: Product[]
  onCancel: () => void
  onDeleted: () => void
}

export const DeleteProductsDialog = ({
  products,
  onCancel,
  onDeleted,
}: DeleteProductsDialogProps) => {
  const { mutateAsync, isPending } = useDeleteProduct()
  const totalToDelete = products.length
  const primaryProduct = products[0]

  const handleDelete = async () => {
    if (totalToDelete === 0) return
    try {
      for (const product of products) {
        // eslint-disable-next-line no-await-in-loop
        await mutateAsync(product)
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
        Delete Product
        <img
          onClick={onCancel}
          className="w-5 cursor-pointer"
          src="/icons/close-icon.svg"
          alt="close"
        />
      </header>

      {primaryProduct ? (
        <div className="space-y-2 text-sm leading-relaxed text-zinc-700">
          <p>
            You are about to delete{' '}
            <span className="font-semibold text-red-500">
              {totalToDelete === 1
                ? primaryProduct.primaryName
                : `${totalToDelete} products`}
            </span>
            . This action cannot be undone.
          </p>
          {totalToDelete > 1 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-500">
              {products.slice(0, 3).map((product) => (
                <li key={product.id}>{product.primaryName}</li>
              ))}
              {totalToDelete > 3 && <li>+ {totalToDelete - 3} more…</li>}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No product selected.</p>
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
          disabled={isPending || !primaryProduct}
          isPending={isPending}
          autoFocus
        />
      </section>
    </form>
  )
}

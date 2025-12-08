import GenericTable from '@/components/common/GenericTable'
import PageHeader from '@/components/common/PageHeader'
import { useFetchRawMaterials } from '@/queries/RawMaterialsQueries'
import { rawMaterialTableColumns } from './RawMaterialsPage/RawMaterialsPage.dataCells'

export const RawMaterialsPage = () => {
  // queries
  const {
    data: rawMaterials = [],
    isLoading: isRawMaterialsLoading,
    isFetching,
  } = useFetchRawMaterials()

  // States

  // useEffects
  return (
    <main className="flex w-full flex-col gap-4">
      <section className="flex w-full flex-col gap-3 rounded-[12px] bg-white/80 px-3 py-1.5">
        <header className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <PageHeader className="mr-auto!" title="Raw Materials" />
        </header>
      </section>

      <section className="w-full rounded-[12px] bg-white px-3 py-3 shadow-sm">
        <GenericTable
          data={rawMaterials}
          dataCell={rawMaterialTableColumns}
          isLoading={isRawMaterialsLoading || isFetching}
          messageWhenNoData="No raw materials available."
        />
      </section>
    </main>
  )
}

export default RawMaterialsPage

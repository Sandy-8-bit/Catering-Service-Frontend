import React, { useMemo } from 'react'
import ConfigCard, { type ConfigCardType } from '@/components/common/ConfigCard'
import { appRoutes } from '@/routes/appRoutes'

const MasterPage: React.FC = () => {
  const configCards = useMemo<ConfigCardType[]>(
    () => [
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: 'Raw Materials',
        desc: 'Manage sourcing, stock levels, and vendor details for every ingredient.',
        label: 'Inventory',
        labelColor: 'bg-blue-50 text-blue-700',
        btnText: 'Configure',
        navigateUrl: appRoutes.rawMaterials.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: 'Categories',
        desc: 'Group menu offerings for clearer planning and seamless reporting.',
        label: 'Catalog',
        labelColor: 'bg-purple-50 text-purple-700',
        btnText: 'Configure',
        navigateUrl: appRoutes.catergories.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: 'Products',
        desc: 'Define packaged offerings and pricing ready for order intake.',
        label: 'Catalog',
        labelColor: 'bg-amber-50 text-amber-700',
        btnText: 'Configure',
        navigateUrl: appRoutes.products.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: 'Additional Items',
        desc: 'Add complementary services or add-ons to enhance every order.',
        label: 'Upsell',
        labelColor: 'bg-emerald-50 text-emerald-700',
        btnText: 'Configure',
        navigateUrl: appRoutes.additionalItems.path,
      },
    ],
    []
  )

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row gap-4 p-4">
        <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
          Orders
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {configCards.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500">
            No configurations match your search.
          </p>
        ) : (
          configCards.map((card) => <ConfigCard key={card.title} {...card} />)
        )}
      </div>
    </main>
  )
}

export default MasterPage

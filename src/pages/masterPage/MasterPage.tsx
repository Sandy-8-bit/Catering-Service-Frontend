import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ConfigCard, { type ConfigCardType } from '@/components/common/ConfigCard'
import { appRoutes } from '@/routes/appRoutes'

const MasterPage: React.FC = () => {
  const { t } = useTranslation()
  
  const configCards = useMemo<ConfigCardType[]>(
    () => [
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('raw_materials'),
        desc: t('raw_materials_desc'),
        label: t('raw_materials_label'),
        labelColor: 'bg-blue-50 text-blue-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.rawMaterials.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('categories'),
        desc: t('categories_desc'),
        label: t('categories_label'),
        labelColor: 'bg-purple-50 text-purple-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.categories.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('products'),
        desc: t('products_desc'),
        label: t('products_label'),
        labelColor: 'bg-amber-50 text-amber-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.products.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('recipes'),
        desc: t('recipes_desc'),
        label: t('recipes_label'),
        labelColor: 'bg-orange-50 text-orange-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.recipes.path,
      },
      {
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('additional_items'),
        desc: t('additional_items_desc'),
        label: t('additional_items_label'),
        labelColor: 'bg-emerald-50 text-emerald-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.additionalItems.path,
      },
    ],
    [t]
  )

  return (
    <main className="layout-container flex min-h-[95vh] flex-col rounded-[12px] border-2 border-[#F1F1F1] bg-white">
      <header className="flex flex-row gap-4 p-4">
        <h1 className="w-max text-start text-xl font-semibold text-zinc-800">
          {t('master_configurations')}
        </h1>
      </header>
      <div className="divider min-w-full border border-[#F1F1F1]" />

      <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {configCards.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-sm font-medium text-slate-500">
            {t('no_configurations')}
          </p>
        ) : (
          configCards.map((card) => <ConfigCard key={card.title} {...card} />)
        )}
      </div>
    </main>
  )
}

export default MasterPage

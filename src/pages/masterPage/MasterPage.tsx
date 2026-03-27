import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ConfigCard, { type ConfigCardType } from '@/components/common/ConfigCard'
import DropdownSelect, {
  type DropdownOption,
} from '@/components/common/DropDown'
import { appRoutes } from '@/routes/appRoutes'

const LANGUAGE_OPTIONS: DropdownOption[] = [
  { id: 1, label: 'English' },
  { id: 2, label: 'Tamil' },
]

const LANGUAGE_CODE_LOOKUP: Record<number, string> = {
  1: 'en',
  2: 'ta',
}

const getLanguageOptionByCode = (code: string): DropdownOption => {
  const normalizedCode = code.split('-')[0]
  return (
    LANGUAGE_OPTIONS.find(
      (option) => LANGUAGE_CODE_LOOKUP[option.id] === normalizedCode
    ) || LANGUAGE_OPTIONS[0]
  )
}

const MasterPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<DropdownOption>(() =>
    getLanguageOptionByCode(i18n.language)
  )

  useEffect(() => {
    const option = getLanguageOptionByCode(i18n.language)
    if (option.id !== selectedLanguage.id) {
      setSelectedLanguage(option)
    }
  }, [i18n.language, selectedLanguage.id])

  const handleLanguageChange = (option: DropdownOption) => {
    setSelectedLanguage(option)
    const nextLanguage = LANGUAGE_CODE_LOOKUP[option.id]
    if (nextLanguage && nextLanguage !== i18n.language) {
      i18n.changeLanguage(nextLanguage)
    }
  }

  const role = localStorage.getItem('CATERING_ROLE')

  const configCards = useMemo<ConfigCardType[]>(() => {
    const cards: ConfigCardType[] = [
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
    ]

    // Only show Recipes if NOT staff
    if (role !== 'STAFF') {
      cards.push({
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('recipes'),
        desc: t('recipes_desc'),
        label: t('recipes_label'),
        labelColor: 'bg-orange-50 text-orange-700',
        btnText: t('configure'),
        navigateUrl: appRoutes.recipes.path,
      })

      cards.push({
        icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
        title: t('calculate_raw_materials'),
        desc: t('calculate_raw_materials_desc'),
        label: t('calculate_raw_materials_label'),
        labelColor: 'bg-rose-50 text-rose-700',
        btnText: t('open'),
        navigateUrl: appRoutes.calculateRawMaterials.path,
      })
    }

    cards.push({
      icon: '/icons/sideNavIcons/rawMaterials-icon.svg',
      title: t('additional_items'),
      desc: t('additional_items_desc'),
      label: t('additional_items_label'),
      labelColor: 'bg-emerald-50 text-emerald-700',
      btnText: t('configure'),
      navigateUrl: appRoutes.additionalItems.path,
    })

    return cards
  }, [t, role])

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

        <div className="flex h-full w-full flex-col justify-between rounded-xl border border-[#f1f1f1] bg-white px-4 py-5 text-left">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              {t('language_settings')}
            </h2>
            <span className="rounded-2xl bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
              {t('language_settings_label')}
            </span>
          </div>
          <p className="mb-4 text-sm font-medium text-slate-500">
            {t('language_settings_desc')}
          </p>
          <DropdownSelect
            title={t('choose_language')}
            options={LANGUAGE_OPTIONS}
            selected={selectedLanguage}
            onChange={handleLanguageChange}
            autoScroll={false}
            className="w-full"
          />
        </div>
      </div>
    </main>
  )
}

export default MasterPage

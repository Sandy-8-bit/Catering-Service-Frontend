import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Edit3,
  Plus,
  Trash2,
  X,
  Search,
  ChevronDown,
  AlertCircle,
  Check,
  Loader,
} from 'lucide-react'

import { useFetchCategoryOptions } from '@/queries/categoryQueries'
import {
  useCreateProduct,
  useEditProduct,
  useFetchProducts,
  useDeleteProduct,
} from '@/queries/productQueries'
import type { Product } from '@/types/product'

interface FormState {
  type: 'add' | 'edit' | null
  product: Product | null
}

interface ValidationErrors {
  primaryName?: string
  description?: string
  price?: string
  categoryIds?: string
}

interface TransformedProduct extends Product {
  categoryIds: number[]
}

export const ProductsPage = () => {
  const { t } = useTranslation()

  // Hooks
  const {
    data: productsData = [],
    isLoading: isProductsLoading,
    refetch,
  } = useFetchProducts()
  const { data: categoryOptionsData = [] } = useFetchCategoryOptions()
  const { mutateAsync: editProduct, isPending: isEditProductsPending } =
    useEditProduct()
  const { mutateAsync: createProduct, isPending: isCreateProductPending } =
    useCreateProduct()
  const { mutateAsync: deleteProduct, isPending: isDeleteProductsPending } =
    useDeleteProduct()

  // State
  const [formState, setFormState] = useState<FormState>({ type: null, product: null })
  const [allProducts, setAllProducts] = useState<TransformedProduct[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<TransformedProduct | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Safe category options
  const categoryOptions = Array.isArray(categoryOptionsData) ? categoryOptionsData : []

  // Transform API products to match Product type
  const transformProduct = useCallback((product: any): TransformedProduct => {
    try {
      // Extract category IDs from the categories array
      const categoryIds = Array.isArray(product.categories)
        ? product.categories.map((cat: any) => cat.categoryId || cat.id).filter(Boolean)
        : []

      const transformed: TransformedProduct = {
        id: product.id || 0,
        primaryName: product.primaryName || '',
        secondaryName: product.secondaryName || '',
        description: product.description || '',
        price: Number(product.price) || 0,
        categoryIds: categoryIds,
        available: product.available ?? true,
        isRecipe: product.isRecipe ?? false,
        productType: product.productTypeDisplay
          ? product.productTypeDisplay.toLowerCase().includes('veg')
            ? 'VEG'
            : 'NON_VEG'
          : 'VEG',
        subProducts: Array.isArray(product.subProducts) ? product.subProducts : [],
      }
      return transformed
    } catch (error) {
      console.error('Error transforming product:', product, error)
      return {
        id: product.id || 0,
        primaryName: product.primaryName || 'Unknown',
        secondaryName: '',
        description: '',
        price: 0,
        categoryIds: [],
        available: true,
        isRecipe: false,
        productType: 'VEG',
        subProducts: [],
      }
    }
  }, [])

useEffect(() => {
  try {
    const list = Array.isArray(productsData)
      ? productsData
      : productsData ?? []

    // 🔥 IMPORTANT FIX
    if (!list || list.length === 0) {
      console.log("Skipping empty response")
      return
    }

    const transformed = list.map(transformProduct)
    setAllProducts(transformed)
    console.log('Products loaded:', transformed.length)

  } catch (error) {
    console.error('Error transforming products:', error)
  }
}, [productsData, transformProduct])

  // Show notification
  const showNotification = useCallback(
    (type: 'success' | 'error', message: string) => {
      setNotification({ type, message })
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    },
    []
  )

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      const matchesSearch =
        product.primaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.secondaryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        !selectedCategory ||
        (Array.isArray(product.categoryIds) &&
          product.categoryIds.includes(selectedCategory))

      return matchesSearch && matchesCategory
    })
  }, [allProducts, searchQuery, selectedCategory])

  // Create empty product template
  const createEmptyProduct = useCallback((): TransformedProduct => {
    return {
      id: Date.now() * -1,
      primaryName: '',
      secondaryName: '',
      description: '',
      price: 0,
      categoryIds: [],
      available: true,
      isRecipe: false,
      productType: 'VEG',
      subProducts: [],
    }
  }, [])

  // Handle Add Click
  const handleAddClick = useCallback(() => {
    setFormState({ type: 'add', product: createEmptyProduct() })
  }, [createEmptyProduct])

  // Handle Edit Click
  const handleEditClick = useCallback((product: TransformedProduct) => {
    setFormState({ type: 'edit', product: { ...product } })
  }, [])

  // Handle Delete Click
  const handleDeleteClick = useCallback((product: TransformedProduct) => {
    setDeleteConfirm(product)
  }, [])

  // Confirm Delete
  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return

    try {
      setIsSubmitting(true)

      // Only delete if it's a real product (ID > 0)
      if (deleteConfirm.id > 0) {
        await deleteProduct(deleteConfirm)
      }

      setAllProducts((prev) => prev.filter((p) => p.id !== deleteConfirm.id))
      setDeleteConfirm(null)
      showNotification('success', `${deleteConfirm.primaryName} deleted successfully`)
      await refetch()
    } catch (error) {
      console.error('Delete error:', error)
      showNotification('error', 'Failed to delete product')
    } finally {
      setIsSubmitting(false)
    }
  }, [deleteConfirm, deleteProduct, refetch, showNotification])

  // Handle Form Submit
  const handleFormSubmit = useCallback(
    async (formProduct: TransformedProduct) => {
      if (!formState.product) return

      try {
        setIsSubmitting(true)

        const payload = {
          primaryName: formProduct.primaryName.trim(),
          secondaryName: formProduct.secondaryName?.trim() ?? '',
          description: formProduct.description.trim(),
          price: Number(formProduct.price) || 0,
          categoryIds:
            Array.isArray(formProduct.categoryIds) && formProduct.categoryIds.length > 0
              ? formProduct.categoryIds
              : [],
          available: Boolean(formProduct.available),
          isRecipe: formProduct.isRecipe ?? false,
          productType: formProduct.productType ?? 'VEG',
        }

        if (formState.type === 'add') {
          // Create new product
          await createProduct([
            {
            ...payload
            },
          ])
          showNotification('success', `${formProduct.primaryName} created successfully`)
        } else if (formState.type === 'edit') {
          // Edit existing product
          await editProduct([formProduct])
          setAllProducts((prev) =>
            prev.map((p) => (p.id === formProduct.id ? formProduct : p))
          )
          showNotification('success', `${formProduct.primaryName} updated successfully`)
        }

        setFormState({ type: null, product: null })
        await refetch()
      } catch (error) {
        console.error('Form submission error:', error)
        showNotification('error', 'Failed to save product')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formState, createProduct, editProduct, refetch, showNotification]
  )

  // Get category label by ID
  const getCategoryLabel = useCallback(
    (id: number) => {
      const found = categoryOptions.find((cat) => cat.id === id)
      return found ? found.label : ''
    },
    [categoryOptions]
  )

const isLoading = isProductsLoading || allProducts.length === 0
  const isPending = isCreateProductPending || isEditProductsPending || isDeleteProductsPending

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-orange-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto w-full px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-orange-900">
                {t('products') || 'Products'}
              </h1>
              <p className="mt-1 text-base font-semibold text-orange-600">
                {allProducts.length} {t('items') || 'Items'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddClick}
              disabled={isLoading || isPending}
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-orange-700 active:shadow-md disabled:opacity-50 sm:w-auto w-full"
            >
              <Plus className="h-5 w-5" />
              <span>{t('add_product') || 'Add Product'}</span>
            </motion.button>
          </div>

          {/* Search and Filter */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-orange-400" />
              <input
                type="text"
                placeholder={t('search_products') || 'Search products...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border-2 border-orange-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-orange-50"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={selectedCategory ?? ''}
                onChange={(e) =>
                  setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)
                }
                disabled={isLoading}
                className="w-full appearance-none rounded-lg border-2 border-orange-200 bg-white py-2.5 pl-4 pr-10 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:bg-orange-50"
              >
                <option value="">{t('all_categories') || 'All Categories'}</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          // Loading State - Skeleton
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl bg-white border border-orange-100 p-4 shadow-sm"
                >
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-orange-100 rounded w-3/4" />
                    <div className="h-3 bg-orange-100 rounded w-1/2" />
                    <div className="h-16 bg-orange-100 rounded" />
                    <div className="flex gap-2">
                      <div className="h-8 bg-orange-100 rounded flex-1" />
                      <div className="h-8 bg-orange-100 rounded flex-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : allProducts.length === 0 ? (
          // Empty State
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 py-16 text-center"
          >
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-12 w-12 text-orange-400" />
            </div>
            <p className="text-lg font-medium text-orange-900">
              {t('no_data') || 'No products available'}
            </p>
            <p className="mt-2 text-sm text-orange-600">
              {t('no_products_yet') || 'Start by adding your first product'}
            </p>
          </motion.div>
        ) : filteredProducts.length === 0 ? (
          // No Results from Filter
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl border-2 border-dashed border-orange-300 bg-orange-50 py-16 text-center"
          >
            <div className="mb-4 flex justify-center">
              <Search className="h-12 w-12 text-orange-400" />
            </div>
            <p className="text-lg font-medium text-orange-900">
              {t('no_data') || 'No products found'}
            </p>
            <p className="mt-2 text-sm text-orange-600">
              {t('try_adjusting_filters') || 'Try adjusting your search or filters'}
            </p>
          </motion.div>
        ) : (
          // Products Grid - 1 col mobile, 2 tablet, 3 desktop, 4 lg, 6 xl
          <motion.div
            className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.03, delayChildren: 0 },
              },
            }}
          >
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="group flex flex-col rounded-xl border border-orange-200 bg-white shadow-sm transition hover:shadow-md hover:border-orange-400"
              >
                {/* Product Header */}
                <div className="flex-1 p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-orange-900 truncate text-sm sm:text-base">
                        {product.primaryName}
                      </h3>
                      {product.secondaryName && (
                        <p className="text-xs text-orange-600 truncate">
                          {product.secondaryName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mb-3 line-clamp-2 text-xs sm:text-sm text-orange-700">
                    {product.description}
                  </p>

                  {/* Categories */}
                  {Array.isArray(product.categoryIds) && product.categoryIds.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {product.categoryIds.map((catId) => {
                        const label = getCategoryLabel(catId)
                        return label ? (
                          <span
                            key={catId}
                            className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700"
                          >
                            {label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* Availability Badge */}
                  <div className="mb-3 flex items-center gap-2">
                    {product.available ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                        <Check className="h-3 w-3" />
                        {t('available') || 'Available'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        {t('unavailable') || 'Unavailable'}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{product.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-orange-100 p-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEditClick(product)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-orange-50 py-2 font-semibold text-orange-600 transition hover:bg-orange-100 active:bg-orange-200 disabled:opacity-50 text-xs sm:text-sm"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('edit') || 'Edit'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteClick(product)}
                    disabled={isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 py-2 font-semibold text-red-600 transition hover:bg-red-100 active:bg-red-200 disabled:opacity-50 text-xs sm:text-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('delete') || 'Delete'}</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-lg sm:bottom-8 sm:right-8 ${
              notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {formState.type && formState.product && (
          <ProductFormModal
            product={formState.product}
            mode={formState.type}
            categoryOptions={categoryOptions}
            isSubmitting={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormState({ type: null, product: null })}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            product={deleteConfirm}
            isSubmitting={isSubmitting}
            onConfirm={confirmDelete}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Product Form Modal Component
interface ProductFormModalProps {
  product: TransformedProduct
  mode: 'add' | 'edit'
  categoryOptions: Array<{ id: number; label: string }>
  isSubmitting: boolean
  onSubmit: (product: TransformedProduct) => Promise<void>
  onCancel: () => void
}

function ProductFormModal({
  product,
  mode,
  categoryOptions,
  isSubmitting,
  onSubmit,
  onCancel,
}: ProductFormModalProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<TransformedProduct>(product)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.primaryName.trim()) {
      newErrors.primaryName = t('product_name_required') || 'Product name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = t('description_required') || 'Description is required'
    }

    if (formData.price <= 0) {
      newErrors.price = t('price_must_be_greater') || 'Price must be greater than 0'
    }

    if (!Array.isArray(formData.categoryIds) || formData.categoryIds.length === 0) {
      newErrors.categoryIds = t('select_category') || 'Select at least one category'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!validateForm()) return
      await onSubmit(formData)
    },
    [validateForm, formData, onSubmit]
  )

  const handleCategoryToggle = useCallback((categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds:
        Array.isArray(prev.categoryIds) && prev.categoryIds.includes(categoryId)
          ? prev.categoryIds.filter((id) => id !== categoryId)
          : [...(Array.isArray(prev.categoryIds) ? prev.categoryIds : []), categoryId],
    }))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center"
    >
      <motion.form
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between sticky -top-8 bg-white -mx-6 -mt-6 px-6 py-4 border-b border-orange-200 z-10">
          <h2 className="text-2xl font-bold text-orange-900">
            {mode === 'add'
              ? t('add_product') || 'Add New Product'
              : t('edit_product') || 'Edit Product'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg p-2 text-orange-600 hover:bg-orange-100 transition disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Primary Name */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              {t('product_name') || 'Product Name'} *
            </label>
            <input
              type="text"
              value={formData.primaryName}
              onChange={(e) =>
                setFormData({ ...formData, primaryName: e.target.value })
              }
              placeholder={t('enter_product_name') || 'Enter product name'}
              className={`w-full rounded-lg border-2 bg-white px-4 py-3 text-sm outline-none transition ${
                errors.primaryName
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              }`}
              disabled={isSubmitting}
            />
            {errors.primaryName && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.primaryName}
              </p>
            )}
          </div>

          {/* Secondary Name */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              {t('secondary_name') || 'Secondary Name'} ({t('optional') || 'Optional'})
            </label>
            <input
              type="text"
              value={formData.secondaryName || ''}
              onChange={(e) =>
                setFormData({ ...formData, secondaryName: e.target.value })
              }
              placeholder={t('e_g_italian_classic') || 'e.g., Italian Classic'}
              className="w-full rounded-lg border-2 border-orange-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              {t('description') || 'Description'} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t('describe_your_product') || 'Describe your product'}
              rows={3}
              className={`w-full rounded-lg border-2 bg-white px-4 py-3 text-sm outline-none transition resize-none ${
                errors.description
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              } disabled:opacity-50`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-2">
              {t('price') || 'Price'} (₹) *
            </label>
            <input
              type="number"
              value={formData.price || ''}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
              }
              placeholder="0"
              min="0"
              step="0.01"
              className={`w-full rounded-lg border-2 bg-white px-4 py-3 text-sm outline-none transition ${
                errors.price
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
              } disabled:opacity-50`}
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="mt-1.5 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.price}
              </p>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-3">
              {t('categories') || 'Categories'} *
            </label>
            {categoryOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {categoryOptions.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategoryToggle(category.id)}
                    disabled={isSubmitting}
                    className={`rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition ${
                      Array.isArray(formData.categoryIds) &&
                      formData.categoryIds.includes(category.id)
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300'
                    } disabled:opacity-50`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-orange-600">No categories available</p>
            )}
            {errors.categoryIds && (
              <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.categoryIds}
              </p>
            )}
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-3">
              {t('availability') || 'Availability'}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, available: true })}
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 font-semibold transition ${
                  formData.available
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300'
                } disabled:opacity-50`}
              >
                ✓ {t('available') || 'Available'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, available: false })}
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 font-semibold transition ${
                  !formData.available
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300'
                } disabled:opacity-50`}
              >
                ✕ {t('unavailable') || 'Unavailable'}
              </button>
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-3">
              {t('product_type') || 'Product Type'}
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, productType: 'VEG' })
                }
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 font-semibold transition ${
                  formData.productType === 'VEG'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300'
                } disabled:opacity-50`}
              >
                🥬 {t('vegetarian') || 'Vegetarian'}
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, productType: 'NON_VEG' })
                }
                disabled={isSubmitting}
                className={`flex-1 rounded-lg border-2 px-4 py-2.5 font-semibold transition ${
                  formData.productType === 'NON_VEG'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-orange-200 bg-white text-orange-700 hover:border-orange-300'
                } disabled:opacity-50`}
              >
                🍖 {t('non_vegetarian') || 'Non-Vegetarian'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-3 border-t border-orange-200 pt-6 sticky -bottom-8 bg-white -mx-6 -mb-6 px-6 py-4 z-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border-2 border-orange-200 py-2.5 font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50 text-sm sm:text-base"
          >
            {t('cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-orange-600 py-2.5 font-semibold text-white shadow-lg transition hover:bg-orange-700 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
            {isSubmitting
              ? t('saving') || 'Saving...'
              : mode === 'add'
              ? t('create') || 'Create'
              : t('update') || 'Update'}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  )
}

// Delete Confirmation Modal Component
interface DeleteConfirmModalProps {
  product: TransformedProduct
  isSubmitting: boolean
  onConfirm: () => Promise<void>
  onCancel: () => void
}

function DeleteConfirmModal({
  product,
  isSubmitting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation()

  const handleConfirm = useCallback(async () => {
    await onConfirm()
  }, [onConfirm])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-orange-900">
          {t('delete_product') || 'Delete Product?'}
        </h3>

        <p className="mb-6 text-sm sm:text-base text-orange-700">
          {t('delete_confirmation') || 'Are you sure you want to delete'}{' '}
          <span className="font-semibold">{product.primaryName}</span>?{' '}
          {t('this_action_cannot_be_undone') ||
            'This action cannot be undone.'}
        </p>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-lg border-2 border-orange-200 py-2.5 font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-50 text-sm sm:text-base"
          >
            {t('cancel') || 'Cancel'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
            {isSubmitting ? t('deleting') || 'Deleting...' : t('delete') || 'Delete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProductsPage
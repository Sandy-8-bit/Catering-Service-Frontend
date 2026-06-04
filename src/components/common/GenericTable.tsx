/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Edit2,
  EyeIcon,
  Trash2,
  Trash2Icon,
  X,
  ChevronDown,
  ChevronUp,
  Inbox,
} from 'lucide-react'

import SearchSm from './SearchSm'
import ButtonSm from './Buttons'
import DropdownSelect from './DropDown'
import PaginationControls from './Pagination'
import { CheckBox } from './Input'
import { useHandleCancelHook } from '@/hooks/useHandleCancelHook'
import { useHandleDeleteHook } from '@/hooks/useHandleDeleteHook'
import { t } from 'i18next'

// ============= TYPES =============

export type DataCell = {
  headingTitle?: string
  isFrozenColumn?: boolean
  headerRender?: () => React.ReactNode
  accessVar?: string | ((row: any) => any)
  className?: string
  sortable?: boolean
  searchable?: boolean
  isArray?: boolean
  isDate?: boolean
  render?: (value: any, row: any, index: number) => React.ReactNode
}

export interface GenericTableProps {
  data: any[] | { records: any[]; totalRecords?: number }
  dataCell: DataCell[]
  isLoading?: boolean
  isHeaderVisible?: boolean
  headerChildren?: React.ReactNode
  isMasterTable?: boolean
  itemsPerPageOptions?: number[]
  defaultItemsPerPage?: number
  newItemLink?: string
  actionWidth?: number | null
  onEdit?: (row: any) => void
  onDelete?: (row: any) => void
  onView?: (row: any) => void
  skeletonRows?: number
  tableTitle?: string
  className?: string
  rowKey?: (row: any, index: number) => string | number
  isSelectable?: boolean
  selectedRowIndices?: number[]
  onSelectionChange?: (selectedIndices: number[], selectedRows: any[]) => void
  onDeleteSelected?: () => void
  isADropDown?: boolean
  isMultipleDropDownAllowed?: boolean
  customActionButtons?: (row: any) => React.ReactNode
  messageWhenNoData?: string
}

// ============= SHIMMER =============

const shimmer = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.6, 0.3],
    transition: { duration: 1.2, repeat: Infinity },
  },
}

const ShimmerBox = ({ className }: { className?: string }) => (
  <motion.div
    className={`relative overflow-hidden rounded bg-gray-200 ${className ?? ''}`}
    variants={shimmer}
    initial="initial"
    animate="animate"
  >
    <motion.div
      className="absolute top-0 left-[-50%] h-full w-[200%] bg-gradient-to-r from-transparent via-white/40 to-transparent"
      animate={{ left: ['-50%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  </motion.div>
)

// ============= UTILITIES =============

function toRecords(input: any): { records: any[]; totalRecords?: number } {
  if (!input) return { records: [], totalRecords: 0 }
  if (Array.isArray(input))
    return { records: input, totalRecords: input.length }
  return {
    records: input.records || [],
    totalRecords: input.totalRecords ?? input.records?.length ?? 0,
  }
}

function getNestedValue(accessVar: string, obj: any) {
  if (!accessVar) return undefined
  const parts = accessVar.replace(/\]/g, '').split(/\.|\[/).filter(Boolean)
  let cur: any = obj
  for (const p of parts) {
    if (cur == null) return undefined
    const idx = Number(p)
    cur = isNaN(idx) ? cur[p] : cur[idx]
  }
  return cur
}

// ============= COLUMN WIDTH CONSTANT =============
// Single source of truth for cell width — used in both header and body so they always align.
const CELL_BASE_CLASS = 'min-w-[100px] w-[100px] max-w-[100px]'
const SERNO_WIDTH_DEFAULT = 56
const SERNO_WIDTH_SELECTABLE = 76

// ============= MAIN COMPONENT =============

export default function GenericTable({
  data,
  dataCell,
  isHeaderVisible = true,
  isMasterTable = false,
  isLoading = false,
  itemsPerPageOptions = [5, 10, 15, 20],
  defaultItemsPerPage = 10,
  newItemLink,
  actionWidth = null,
  onEdit,
  onDelete,
  onView,
  headerChildren,
  skeletonRows = 5,
  className = '',
  rowKey,
  isSelectable = false,
  selectedRowIndices = [],
  onSelectionChange,
  isADropDown = false,
  isMultipleDropDownAllowed = false,
  customActionButtons,
  onDeleteSelected = () => {},
  messageWhenNoData = 'No records found.',
}: GenericTableProps) {
  const nav = useNavigate()
  const { records } = toRecords(data)

  // ============= STATE =============
  const [searchValue, setSearchValue] = useState('')
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string | ((r: any) => any) | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  const [showFrozenShadow, setShowFrozenShadow] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // ============= REFS =============
  const actionBodyRefs = useRef<HTMLDivElement[]>([])
  const headerActionRef = useRef<HTMLDivElement>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const scrollbarRef = useRef<HTMLDivElement>(null)

  // ============= MEMOIZED VALUES =============

  const selectedIndicesSet = useMemo(
    () => new Set(selectedRowIndices),
    [selectedRowIndices]
  )

  const { regularColumns, dropdownColumn } = useMemo(() => {
    const regular = dataCell.filter((cell) => cell.headingTitle !== '#DropDown')
    const dropdown = dataCell.find((cell) => cell.headingTitle === '#DropDown')
    return { regularColumns: regular, dropdownColumn: dropdown }
  }, [dataCell])

  const { frozenColumns, scrollableColumns } = useMemo(() => {
    const frozen = regularColumns.filter((cell) => cell.isFrozenColumn)
    const scrollable = regularColumns.filter((cell) => !cell.isFrozenColumn)
    return { frozenColumns: frozen, scrollableColumns: scrollable }
  }, [regularColumns])

  const hasFrozenColumns = frozenColumns.length > 0
  const hasActions = Boolean(
    onEdit || onDelete || onView || isADropDown || customActionButtons
  )

  const serNoWidth = isSelectable ? SERNO_WIDTH_SELECTABLE : SERNO_WIDTH_DEFAULT

  const estimatedActionWidth = useMemo(() => {
    if (actionWidth !== null) return actionWidth
    let buttonCount = 0
    if (onView && !isMasterTable) buttonCount++
    if (onEdit) buttonCount++
    if (onDelete) buttonCount++
    if (isADropDown) buttonCount++
    if (customActionButtons) buttonCount++
    if (buttonCount === 0) return 0
    // 32px per button + 6px gap + 16px padding
    return buttonCount * 32 + (buttonCount - 1) * 6 + 16
  }, [
    onView,
    onEdit,
    onDelete,
    customActionButtons,
    isADropDown,
    actionWidth,
    isMasterTable,
  ])

  // ============= CELL VALUE RESOLUTION =============

  const resolveCellValue = useCallback((row: any, cell: DataCell): any => {
    let raw: any
    try {
      if (typeof cell.accessVar === 'function') raw = cell.accessVar(row)
      else if (cell.accessVar) raw = getNestedValue(String(cell.accessVar), row)
      else raw = undefined
    } catch {
      raw = undefined
    }
    if (cell.isArray && Array.isArray(raw)) return raw[1] ?? raw[0] ?? ''
    return raw
  }, [])

  const convertDateFormat = useCallback((dateStr: string): string => {
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-')
      return `${year}-${month}-${day}`
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month}-${day}`
    }
    return dateStr
  }, [])

  const isDateValue = useCallback(
    (value: any): boolean => {
      if (value instanceof Date) return true
      if (typeof value === 'string') {
        const datePatterns = [
          /^\d{4}-\d{2}-\d{2}/,
          /^\d{2}\/\d{2}\/\d{4}/,
          /^\d{2}-\d{2}-\d{4}/,
          /^\d{4}\/\d{2}\/\d{2}/,
          /^\d{1,2}\/\d{1,2}\/\d{4}/,
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
        ]
        if (datePatterns.some((pattern) => pattern.test(value))) {
          const convertedDate = convertDateFormat(value)
          return !isNaN(Date.parse(convertedDate))
        }
      }
      return false
    },
    [convertDateFormat]
  )

  const getStringValue = useCallback((raw: any): string => {
    if (raw === null || raw === undefined) return ''
    if (Array.isArray(raw)) return String(raw[1] ?? raw[0] ?? '')
    if (raw !== null && typeof raw === 'object') {
      if ('name' in raw) return String((raw as any).name)
      if ('label' in raw) return String((raw as any).label)
      try {
        return JSON.stringify(raw)
      } catch {
        return String(raw)
      }
    }
    return String(raw)
  }, [])

  const getSortableValue = useCallback(
    (raw: any): any => {
      if (raw === null || raw === undefined) return null
      if (Array.isArray(raw)) {
        const value = raw[1] ?? raw[0] ?? null
        if (isDateValue(value))
          return new Date(convertDateFormat(String(value)))
        return value
      }
      if (isDateValue(raw)) return new Date(convertDateFormat(String(raw)))
      if (raw !== null && typeof raw === 'object') {
        if ('name' in raw) return (raw as any).name
        if ('label' in raw) return (raw as any).label
        return raw
      }
      return raw
    },
    [isDateValue, convertDateFormat]
  )

  // ============= DROPDOWN =============

  const toggleRowExpansion = useCallback(
    (globalIndex: number) => {
      if (!isADropDown) return
      setExpandedRows((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(globalIndex)) {
          newSet.delete(globalIndex)
        } else {
          if (!isMultipleDropDownAllowed) newSet.clear()
          newSet.add(globalIndex)
        }
        return newSet
      })
    },
    [isADropDown, isMultipleDropDownAllowed]
  )

  const isRowExpanded = useCallback(
    (globalIndex: number) => expandedRows.has(globalIndex),
    [expandedRows]
  )

  // ============= SELECTION =============

  const isRowSelected = useCallback(
    (globalIndex: number) => {
      if (!isSelectable) return false
      return selectedIndicesSet.has(globalIndex)
    },
    [isSelectable, selectedIndicesSet]
  )

  const clearSelection = useCallback(() => {
    if (!isSelectable || !onSelectionChange) return
    onSelectionChange([], [])
  }, [isSelectable, onSelectionChange])

  // ============= DATA PROCESSING =============

  const searchableCells = regularColumns.filter(
    (c) => (c.searchable ?? true) === true
  )

  const filtered = useMemo(() => {
    if (!searchValue) return records
    const q = searchValue.toLowerCase().trim()
    return records.filter((row) => {
      for (const cell of searchableCells) {
        const v = resolveCellValue(row, cell)
        if (getStringValue(v).toLowerCase().includes(q)) return true
      }
      return false
    })
  }, [records, searchValue, searchableCells, resolveCellValue, getStringValue])

  const sorted = useMemo(() => {
    if (!sortConfig.key) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      let valA: any, valB: any
      if (typeof sortConfig.key === 'function') {
        valA = sortConfig.key(a)
        valB = sortConfig.key(b)
      } else {
        const col = regularColumns.find(
          (c) =>
            (typeof c.accessVar === 'string' &&
              c.accessVar === sortConfig.key) ||
            c.headingTitle === sortConfig.key
        )
        if (col) {
          valA = resolveCellValue(a, col)
          valB = resolveCellValue(b, col)
        } else {
          valA = getNestedValue(String(sortConfig.key), a)
          valB = getNestedValue(String(sortConfig.key), b)
        }
      }

      const sortA = getSortableValue(valA)
      const sortB = getSortableValue(valB)

      if (sortA === null && sortB === null) return 0
      if (sortA === null) return 1
      if (sortB === null) return -1

      if (sortA instanceof Date && sortB instanceof Date) {
        const diff = sortA.getTime() - sortB.getTime()
        return sortConfig.direction === 'asc' ? diff : -diff
      }

      const numA = Number(sortA)
      const numB = Number(sortB)
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA
      }

      const strA = getStringValue(sortA)
      const strB = getStringValue(sortB)
      return sortConfig.direction === 'asc'
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA)
    })
    return arr
  }, [
    filtered,
    sortConfig,
    regularColumns,
    getSortableValue,
    getStringValue,
    resolveCellValue,
  ])

  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sorted.slice(start, start + itemsPerPage)
  }, [sorted, currentPage, itemsPerPage])

  // ============= EFFECTS =============

  useEffect(() => {
    setCurrentPage(1)
  }, [records.length])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        setShowFrozenShadow(tableContainerRef.current.scrollLeft > 0)
        if (scrollbarRef.current && hasFrozenColumns) {
          scrollbarRef.current.scrollLeft = tableContainerRef.current.scrollLeft
        }
      }
    }
    const el = tableContainerRef.current
    if (el) {
      el.addEventListener('scroll', handleScroll)
      return () => el.removeEventListener('scroll', handleScroll)
    }
  }, [hasFrozenColumns])

  useEffect(() => {
    const handleScrollbarScroll = () => {
      if (
        scrollbarRef.current &&
        tableContainerRef.current &&
        hasFrozenColumns
      ) {
        tableContainerRef.current.scrollLeft = scrollbarRef.current.scrollLeft
      }
    }
    const el = scrollbarRef.current
    if (el && hasFrozenColumns) {
      el.addEventListener('scroll', handleScrollbarScroll)
      return () => el.removeEventListener('scroll', handleScrollbarScroll)
    }
  }, [hasFrozenColumns])

  // ============= HANDLERS =============

  const onSort = useCallback((cell: DataCell) => {
    if (cell.sortable === false) return
    const key = cell.accessVar ?? cell.headingTitle ?? `column_${Date.now()}`
    setSortConfig((prev) => {
      if (prev.key === key)
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      return { key, direction: 'asc' }
    })
  }, [])

  const toggleRowSelection = useCallback(
    (globalIndex: number) => {
      if (!isSelectable || !onSelectionChange) return
      const newSelectedIndices = [...selectedRowIndices]
      if (selectedIndicesSet.has(globalIndex)) {
        const i = newSelectedIndices.indexOf(globalIndex)
        if (i > -1) newSelectedIndices.splice(i, 1)
      } else {
        newSelectedIndices.push(globalIndex)
      }
      const selectedRows = newSelectedIndices
        .map((i) => sorted[i])
        .filter(Boolean)
      onSelectionChange(newSelectedIndices, selectedRows)
    },
    [
      isSelectable,
      onSelectionChange,
      selectedRowIndices,
      selectedIndicesSet,
      sorted,
    ]
  )

  const getCurrentPageGlobalIndices = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return Array.from({ length: paginated.length }, (_, i) => startIndex + i)
  }, [currentPage, itemsPerPage, paginated.length])

  const isAllCurrentPageSelected = useCallback(() => {
    if (!isSelectable || paginated.length === 0) return false
    return getCurrentPageGlobalIndices().every((i) => selectedIndicesSet.has(i))
  }, [
    isSelectable,
    selectedIndicesSet,
    getCurrentPageGlobalIndices,
    paginated.length,
  ])

  const toggleAllCurrentPageSelection = useCallback(() => {
    if (!isSelectable || !onSelectionChange) return
    const currentPageIndices = getCurrentPageGlobalIndices()
    let newSelectedIndices = [...selectedRowIndices]
    if (isAllCurrentPageSelected()) {
      newSelectedIndices = newSelectedIndices.filter(
        (i) => !currentPageIndices.includes(i)
      )
    } else {
      const toAdd = currentPageIndices.filter((i) => !selectedIndicesSet.has(i))
      newSelectedIndices.push(...toAdd)
    }
    const selectedRows = newSelectedIndices
      .map((i) => sorted[i])
      .filter(Boolean)
    onSelectionChange(newSelectedIndices, selectedRows)
  }, [
    isSelectable,
    onSelectionChange,
    getCurrentPageGlobalIndices,
    selectedRowIndices,
    isAllCurrentPageSelected,
    selectedIndicesSet,
    sorted,
  ])

  // ============= COLUMN CLASS — single source of truth =============
  // If the cell has a custom className we use it, otherwise fall back to CELL_BASE_CLASS.
  // This ensures header and body cells always get the EXACT same class string.
  const getColumnClassName = useCallback((cell: DataCell) => {
    const base = cell.className ?? CELL_BASE_CLASS
    return `flex-none shrink-0 ${base}`
  }, [])

  const defaultRowKey = useCallback(
    (r: any, i: number) => (rowKey ? rowKey(r, i) : (r.id ?? r.code ?? i)),
    [rowKey]
  )

  // ============= RENDER HELPERS =============

  const renderSortIndicator = useCallback(
    (cell: DataCell, idx: number) => {
      if (cell.sortable === false) return null
      const key = cell.accessVar ?? cell.headingTitle ?? `column_${idx}`
      const isSorted = sortConfig.key === key
      const isAsc = sortConfig.direction === 'asc'
      return (
        <motion.div
          animate={{ alignItems: isSorted ? 'flex-start' : 'center' }}
          className="ml-1.5 flex w-4 flex-col gap-[2px]"
        >
          {[
            isSorted ? (isAsc ? 5 : 12) : 12,
            9,
            isSorted ? (isAsc ? 12 : 6) : 6,
          ].map((w, i) => (
            <motion.div
              key={i}
              style={{
                height: 2,
                backgroundColor: isSorted ? '#30394a' : '#a2b4bf',
                borderRadius: 12,
              }}
              animate={{ width: w }}
              transition={{
                type: 'spring',
                stiffness: 250,
                damping: 12,
                mass: 0.5,
              }}
            />
          ))}
        </motion.div>
      )
    },
    [sortConfig]
  )

  const renderHeaderCell = useCallback(
    (cell: DataCell, idx: number) => (
      <div
        key={(cell.headingTitle ?? `column_${idx}`) + idx}
        className={`flex items-center! justify-center! px-2! ${getColumnClassName(cell)}`}
        onClick={() => onSort(cell)}
        role={cell.sortable === false ? undefined : 'button'}
      >
        <div className="my-auto flex cursor-pointer items-center select-none">
          <span className="truncate text-sm font-medium text-[#1F1F21]">
            {cell.headerRender ? cell.headerRender() : cell.headingTitle}
          </span>
          {renderSortIndicator(cell, idx)}
        </div>
      </div>
    ),
    [getColumnClassName, onSort, renderSortIndicator]
  )

  const renderCellValue = useCallback(
    (value: any, cell: DataCell, row: any, idx: number) => {
      if (cell.render) return cell.render(value, row, idx)
      if (Array.isArray(value))
        return <span>{value[1] ?? value[0] ?? '-'}</span>
      return <span>{value == null ? '-' : String(value)}</span>
    },
    []
  )

  useHandleCancelHook(selectedRowIndices.length >= 1, clearSelection)
  useHandleDeleteHook(selectedRowIndices.length >= 1, onDeleteSelected)

  const skeletonCount = isLoading ? itemsPerPage || skeletonRows : 0

  // ============= JSX =============

  return (
    <div
      className={`flex min-h-full flex-col justify-between rounded-[12px] border-2 border-[#F1F1F1] bg-white py-3 ${className}`}
    >
      {/* Frozen column styles */}
      {hasFrozenColumns && (
        <style>{`
          .frozen-column-shadow::after {
            content: '';
            position: absolute;
            top: 0; right: 0; bottom: 0;
            width: 4px;
            opacity: 0;
            background: linear-gradient(to right, rgba(0,0,5,0.07), transparent);
            pointer-events: none;
            z-index: 15;
            transition: opacity 0.3s ease;
          }
          .frozen-column-shadow.show-shadow::after { opacity: 1; }
          .frozen-serial-column {
            position: sticky !important;
            left: 0 !important;
            z-index: 12;
            background: inherit !important;
          }
          .frozen-data-column {
            position: sticky !important;
            z-index: 11;
            background: inherit !important;
          }
          .group:hover .frozen-column-hover-bg {
            background-color: rgb(248 250 252) !important;
          }
        `}</style>
      )}

      <div className="body-container flex flex-col gap-0">
        {/* ─── HEADER CONTROLS ─── */}
        {isHeaderVisible && (
          <header className="mb-3 flex w-full flex-col gap-2 px-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: search + entries */}
            <section className="flex flex-wrap items-center gap-2">
              <SearchSm
                containerClassName="flex-1 min-w-[160px] max-w-[260px]"
                placeholder="Search"
                onChange={(e: any) => {
                  setSearchValue(e.target.value)
                  setCurrentPage(1)
                }}
                inputValue={searchValue}
                onSearch={() => {}}
                onClear={() => {
                  setSearchValue('')
                  setCurrentPage(1)
                }}
              />

              <DropdownSelect
                className="min-w-[110px]!"
                allowClear={false}
                title=""
                direction="down"
                options={itemsPerPageOptions.map((item) => ({
                  id: item,
                  label: `${item} / page`,
                }))}
                selected={{ id: itemsPerPage, label: `${itemsPerPage} / page` }}
                onChange={(e: any) => {
                  setItemsPerPage(e.id)
                  setCurrentPage(1)
                }}
              />
            </section>

            {/* Right: actions + pagination */}
            <section className="flex flex-wrap items-center justify-end gap-2">
              {newItemLink && (
                <ButtonSm
                  className="py-2 text-white"
                  state="default"
                  text="New"
                  onClick={() => nav(newItemLink)}
                />
              )}

              {isSelectable && selectedRowIndices.length > 0 && (
                <>
                  <div className="flex flex-row items-center gap-1.5 rounded-md bg-[#f3f3f3] px-2.5 py-2 text-sm font-medium">
                    <span className="text-slate-900">
                      Selected: <strong>{selectedRowIndices.length}</strong>
                    </span>
                    <button
                      onClick={clearSelection}
                      className="cursor-pointer border-0 bg-transparent p-0 transition-transform hover:scale-110"
                    >
                      <X size={14} className="text-slate-900" />
                    </button>
                  </div>
                  <button
                    onClick={onDeleteSelected}
                    className="flex cursor-pointer flex-row items-center gap-1.5 rounded-md border-0 bg-red-600 px-2.5 py-2 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95"
                  >
                    Delete All
                    <Trash2Icon size={13} />
                  </button>
                </>
              )}

              {headerChildren}

              <PaginationControls
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </section>
          </header>
        )}

        {/* ─── TABLE ─── */}
        <div
          ref={tableContainerRef}
          className="tables relative flex min-h-[300px] w-full flex-col overflow-x-auto bg-white"
        >
          {/* ── TABLE HEADER ROW ── */}
          {/*
            IMPORTANT: every cell here uses EXACTLY the same class as the body cell below.
            The header and each body row are independent flex rows — they align only because
            every cell in both rows gets the same fixed width class from getColumnClassName().
          */}
          <div
            className={`header flex min-w-max flex-row items-stretch border-y-2 border-y-[#F1F1F1] bg-[#FAFAFA] px-3 shadow-sm ${hasFrozenColumns ? 'has-frozen relative' : ''}`}
          >
            {/* S.No */}
            <div
              className={`frozen-serial-column flex shrink-0 items-center gap-2 bg-[#FAFAFA] px-1.5 py-4`}
              style={{ width: serNoWidth, minWidth: serNoWidth }}
            >
              {isSelectable && (
                <CheckBox
                  className="h-5! w-5! origin-center scale-[0.80]"
                  label=""
                  checked={isAllCurrentPageSelected()}
                  onChange={toggleAllCurrentPageSelection}
                />
              )}
              <p className="text-left text-sm font-medium text-[#1F1F21] select-none">
                {t('s.no')}
              </p>
            </div>

            {/* Frozen columns */}
            {frozenColumns.map((cell, idx) => (
              <div
                key={(cell.headingTitle || '') + idx}
                className={`${getColumnClassName(cell)} frozen-data-column bg-[#FAFAFA] px-2 py-4 ${
                  idx === frozenColumns.length - 1
                    ? `frozen-column-shadow relative ${showFrozenShadow ? 'show-shadow' : ''}`
                    : ''
                }`}
                style={{ left: `${serNoWidth + idx * 100}px` }}
                onClick={() => onSort(cell)}
                role={cell.sortable === false ? undefined : 'button'}
              >
                <div className="flex cursor-pointer items-center select-none">
                  <span className="truncate text-sm font-medium text-[#1F1F21]">
                    {cell.headerRender
                      ? cell.headerRender()
                      : (cell.headingTitle ?? 'Column')}
                  </span>
                  {renderSortIndicator(cell, idx)}
                </div>
              </div>
            ))}

            {/* Scrollable columns */}
            {scrollableColumns.map((cell, idx) => renderHeaderCell(cell, idx))}

            {/* Action header */}
            {hasActions && (
              <div
                ref={headerActionRef}
                className="flex shrink-0 items-center px-2"
                style={{
                  width: estimatedActionWidth,
                  minWidth: estimatedActionWidth,
                }}
              >
                <p className="text-sm font-medium text-[#1F1F21]">Action</p>
              </div>
            )}
          </div>

          {/* ── SKELETON ── */}
          {isLoading && (
            <div>
              {Array.from({ length: skeletonCount }).map((_, rIdx) => (
                <div
                  key={rIdx}
                  className="flex min-w-max flex-row items-center border-b border-[#F1F1F1] px-3 py-0"
                >
                  <div
                    className={`flex shrink-0 items-center py-4 pl-1.5 ${hasFrozenColumns ? 'frozen-serial-column' : ''}`}
                    style={{ width: serNoWidth, minWidth: serNoWidth }}
                  >
                    <ShimmerBox className="h-4 w-8" />
                  </div>

                  {frozenColumns.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`px-2 py-4 ${getColumnClassName(cell)} ${hasFrozenColumns ? 'frozen-data-column bg-white' : ''}`}
                      style={{
                        left: hasFrozenColumns
                          ? `${serNoWidth + cIdx * 100}px`
                          : undefined,
                      }}
                    >
                      <ShimmerBox className="h-4 w-full max-w-24" />
                    </div>
                  ))}

                  {scrollableColumns.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className={`px-2 py-4 ${getColumnClassName(cell)}`}
                    >
                      <ShimmerBox className="h-4 w-full max-w-24" />
                    </div>
                  ))}

                  {hasActions && (
                    <div
                      className="flex shrink-0 items-center gap-1.5 px-2"
                      style={{
                        width: estimatedActionWidth,
                        minWidth: estimatedActionWidth,
                      }}
                    >
                      {onView && !isMasterTable && (
                        <ShimmerBox className="h-7 w-7 rounded" />
                      )}
                      {onEdit && <ShimmerBox className="h-7 w-7 rounded" />}
                      {onDelete && <ShimmerBox className="h-7 w-7 rounded" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── NO DATA ── */}
          {!isLoading && paginated.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="my-auto flex max-h-[400px] max-w-[600px] flex-col items-center justify-center self-center rounded-2xl border-2 border-dashed border-[#F1F1F1] bg-[#F8F9FB] p-10 text-slate-600 shadow-sm"
            >
              <div className="mb-4 rounded-full bg-slate-200 p-4 shadow-sm">
                <Inbox size={36} className="text-slate-500" />
              </div>
              <p className="text-center text-lg font-medium text-slate-600">
                {messageWhenNoData}
              </p>
              <span className="mt-2 text-center text-sm font-medium text-slate-400">
                Try adjusting your search or filter to find what you're looking
                for.
              </span>
            </motion.div>
          )}

          {/* ── DATA ROWS ── */}
          {!isLoading &&
            paginated.map((row, idx) => {
              const globalIndex = (currentPage - 1) * itemsPerPage + idx
              const isExpanded = isRowExpanded(globalIndex)
              const isRowChecked = isRowSelected(globalIndex)

              return (
                <React.Fragment key={defaultRowKey(row, idx)}>
                  <div
                    style={{
                      cursor: isMasterTable ? 'pointer' : 'auto',
                      boxShadow: isRowChecked
                        ? 'inset 3px 0 0 #f97316'
                        : undefined,
                    }}
                    onClick={() => {
                      if (isMasterTable && onView) onView(row)
                    }}
                    className={`group flex min-w-max flex-row items-stretch border-b border-[#F1F1F1] px-3 text-sm text-[#1F1F21] transition-colors ${
                      isRowChecked
                        ? 'bg-orange-50'
                        : 'bg-white hover:bg-slate-50/70'
                    } ${hasFrozenColumns ? 'has-frozen' : ''}`}
                  >
                    {/* S.No */}
                    <div
                      className={`frozen-serial-column frozen-column-hover-bg flex shrink-0 flex-row items-center gap-2 px-1.5 py-3.5 ${
                        isRowChecked ? 'bg-orange-50' : 'bg-white'
                      }`}
                      style={{ width: serNoWidth, minWidth: serNoWidth }}
                    >
                      {isSelectable && (
                        <CheckBox
                          className="h-5! w-5! origin-center scale-[0.80]"
                          label=""
                          checked={isRowSelected(globalIndex)}
                          onChange={() => toggleRowSelection(globalIndex)}
                        />
                      )}
                      <p className="font-medium tabular-nums">
                        {globalIndex + 1}
                      </p>
                    </div>

                    {/* Frozen columns */}
                    {frozenColumns.map((cell, cIdx) => {
                      const value = resolveCellValue(row, cell)
                      return (
                        <div
                          key={(cell.headingTitle || '') + cIdx}
                          className={`px-2 py-3.5 ${getColumnClassName(cell)} frozen-data-column frozen-column-hover-bg ${
                            cIdx === frozenColumns.length - 1
                              ? `frozen-column-shadow relative ${showFrozenShadow ? 'show-shadow' : ''}`
                              : ''
                          } ${isRowChecked ? 'bg-orange-50' : 'bg-white'}`}
                          style={{ left: `${serNoWidth + cIdx * 100}px` }}
                        >
                          <div className="text-left text-sm leading-snug font-medium break-words whitespace-normal">
                            {renderCellValue(value, cell, row, idx)}
                          </div>
                        </div>
                      )
                    })}

                    {/* Scrollable columns */}
                    {scrollableColumns.map((cell, cIdx) => {
                      const value = resolveCellValue(row, cell)
                      return (
                        <div
                          key={(cell.headingTitle || '') + cIdx}
                          className={`px-2 py-3.5 ${getColumnClassName(cell)}`}
                        >
                          <div className="text-left text-sm leading-snug font-medium break-words whitespace-normal">
                            {renderCellValue(value, cell, row, idx)}
                          </div>
                        </div>
                      )
                    })}

                    {/* Action buttons */}
                    {hasActions && (
                      <div
                        className="flex shrink-0 flex-row items-center gap-1.5 px-2 py-3.5"
                        style={{
                          width: estimatedActionWidth,
                          minWidth: estimatedActionWidth,
                        }}
                        ref={(el) => {
                          if (el) actionBodyRefs.current.push(el)
                        }}
                      >
                        {onView && !isMasterTable && (
                          <ButtonSm
                            className="h-8 w-8 shrink-0 bg-white p-0 outline-1 outline-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              onView(row)
                            }}
                            state="outline"
                          >
                            <EyeIcon className="min-w-4" size={18} />
                          </ButtonSm>
                        )}
                        {onEdit && (
                          <ButtonSm
                            className="h-8 w-8 shrink-0 bg-white p-0 outline-1 outline-white"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit(row)
                            }}
                            state="outline"
                          >
                            <Edit2 className="min-w-4" size={13} />
                          </ButtonSm>
                        )}
                        {customActionButtons && customActionButtons(row)}
                        {onDelete && (
                          <ButtonSm
                            onClick={(e) => {
                              e.stopPropagation()
                              onDelete(row)
                            }}
                            className="h-8 w-8 shrink-0 bg-white p-0 shadow-sm outline-1 outline-white hover:bg-red-50 active:bg-red-100"
                            state="default"
                          >
                            <Trash2
                              className="min-w-4 text-red-500"
                              size={13}
                            />
                          </ButtonSm>
                        )}
                        {isADropDown && dropdownColumn && (
                          <ButtonSm
                            className="h-8 w-8 shrink-0 items-center justify-center bg-white p-0 outline-1 outline-white"
                            title="Show Dropdown"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRowExpansion(globalIndex)
                            }}
                            state="outline"
                          >
                            {isExpanded ? (
                              <ChevronUp
                                size={14}
                                className="text-orange-500"
                              />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </ButtonSm>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dropdown row */}
                  {isADropDown && dropdownColumn && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-b border-[#F1F1F1] bg-slate-50 px-3"
                    >
                      <div className="py-4">
                        {dropdownColumn.render
                          ? dropdownColumn.render(null, row, idx)
                          : 'No dropdown content defined'}
                      </div>
                    </motion.div>
                  )}
                </React.Fragment>
              )
            })}
        </div>
      </div>

      {/* Scrollbar styles */}
      <style>{`
        .tables::-webkit-scrollbar { height: 6px; }
        .tables::-webkit-scrollbar-track { background: #f8fafc; border-radius: 6px; margin: 0 4px; }
        .tables::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%);
          border-radius: 6px;
          border: 2px solid #f8fafc;
        }
        .tables::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
        }
        .tables { scrollbar-width: thin; scrollbar-color: #9ca3af #f8fafc; }
      `}</style>

      {/* Footer */}
      <footer className="mt-3 flex min-w-full flex-row items-center gap-2 px-4 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
        <p className="text-sm text-zinc-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}–
          {Math.min(currentPage * itemsPerPage, sorted.length)} of{' '}
          {sorted.length}
        </p>
      </footer>
    </div>
  )
}

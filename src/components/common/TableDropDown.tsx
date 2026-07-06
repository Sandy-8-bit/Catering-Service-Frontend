import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'

import type { DropdownOption } from './DropDown'

interface TableDropdownProps {
  title?: string
  options: DropdownOption[]
  selected?: DropdownOption | null
  placeholder?: string
  isEditMode?: boolean
  disabled?: boolean
  required?: boolean
  className?: string
  dropdownClassName?: string
  onChange: (option: DropdownOption) => void
}

/**
 * Lightweight dropdown built for inline table edits. Mirrors the larger dropdown
 * component's API but keeps rendering local to the cell and locks interactions
 * when the row is not in edit mode.
 */
const TableDropDown: React.FC<TableDropdownProps> = ({
  title,
  options,
  selected,
  placeholder = 'Select option',
  isEditMode = false,
  disabled = false,
  required = false,
  className = '',
  dropdownClassName = '',
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightIndex, setHighlightIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInteractive = isEditMode && !disabled
  const inputRef = useRef<HTMLInputElement | null>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // ── Portal positioning ─────────────────────────────────────────────────
  const [position, setPosition] = useState<{
    top: number
    left: number
    width: number
  }>({ top: 0, left: 0, width: 0 })

  const updatePosition = () => {
    if (!containerRef.current) return
    const r = containerRef.current.getBoundingClientRect()
    setPosition({
      top: r.bottom + window.scrollY + 4,
      left: r.left + window.scrollX,
      width: r.width,
    })
  }

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    const handleReposition = () => updatePosition()
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)
    return () => {
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [isOpen])

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.secondaryLabel ?? '').toLowerCase().includes(q)
    )
  }, [options, searchQuery])

  const displayOption = useMemo<DropdownOption>(() => {
    if (selected) return selected
    return { id: 0, label: '' }
  }, [selected])

  useEffect(() => {
    if (!isOpen || !isInteractive) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !(event.target as HTMLElement).closest(
          '[data-table-dropdown-portal="true"]'
        )
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isInteractive])

  // clear refs when options change
  useEffect(() => {
    optionRefs.current = []
  }, [filteredOptions])

  useEffect(() => {
    if (!isInteractive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false)
      setSearchQuery('')
    }
  }, [isInteractive])

  const openDropdown = () => {
    setIsOpen(true)
    setHighlightIndex(filteredOptions.length ? 0 : -1)
    updatePosition()
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 0)
  }

  const toggleOpen = () => {
    if (isOpen) {
      setIsOpen(false)
      setSearchQuery('')
      setHighlightIndex(-1)
      return
    }
    openDropdown()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        openDropdown()
        e.preventDefault()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      setHighlightIndex((prev) =>
        filteredOptions.length ? (prev + 1) % filteredOptions.length : 0
      )
      e.preventDefault()
    } else if (e.key === 'ArrowUp') {
      setHighlightIndex((prev) =>
        filteredOptions.length
          ? prev <= 0
            ? filteredOptions.length - 1
            : prev - 1
          : 0
      )
      e.preventDefault()
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && filteredOptions[highlightIndex]) {
        handleSelect(filteredOptions[highlightIndex])
      } else if (filteredOptions[0]) {
        handleSelect(filteredOptions[0])
      }
      e.preventDefault()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
      setHighlightIndex(-1)
    }
  }

  const handleSelect = (option: DropdownOption) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery('')
    setHighlightIndex(-1)
  }

  const displayLabel =
    displayOption.id === 0 && displayOption.label.length === 0
      ? placeholder
      : displayOption.label

  return (
    <motion.div
      initial={{ y: -8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      ref={containerRef}
      className={`relative w-full min-w-20 ${className}`}
    >
      {title && (
        <h3 className="mb-0.5 text-xs font-semibold text-slate-600">
          {title}
          {required && <span className="text-red-500"> *</span>}
        </h3>
      )}

      <input
        id={`table-dropdown-${title ?? 'field'}`}
        type="text"
        className="hidden"
        required={required}
        value={displayOption.id === 0 ? '' : displayOption.id}
        onChange={() => {}}
      />

      {isInteractive ? (
        <div
          className={`flex w-full items-center justify-between rounded-sm border border-slate-200 bg-white px-2 py-1 text-sm ${className}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setHighlightIndex(0)
            }}
            onFocus={() => openDropdown()}
            onKeyDown={handleKeyDown}
            placeholder={displayLabel}
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
          {isEditMode && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={!isInteractive}
          onClick={toggleOpen}
          className={`flex w-full items-center justify-between bg-transparent py-2 text-left text-sm font-medium transition-colors ${
            isInteractive
              ? 'cursor-pointer border-b border-gray-300 bg-white px-2 text-[#1F1F21] hover:border-gray-400 focus:border-orange-500'
              : 'cursor-default border-transparent bg-transparent text-[#1F1F21]'
          }`}
        >
          <span className={displayOption.id === 0 ? 'text-slate-400' : ''}>
            {displayLabel}
          </span>
          {isEditMode && (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}

      {isInteractive &&
        isOpen &&
        createPortal(
          <motion.ul
            data-table-dropdown-portal="true"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              width: position.width,
              zIndex: 9999,
            }}
            className={`max-h-48 overflow-y-auto rounded-sm border border-zinc-100 bg-white text-sm shadow-lg ${dropdownClassName}`}
          >
            {filteredOptions.length === 0 && (
              <li className="px-3 py-2 text-slate-500">
                {searchQuery.trim().length > 0
                  ? 'No results found'
                  : 'No options available'}
              </li>
            )}
            {filteredOptions.map((option, idx) => {
              const isActive = option.id === displayOption.id
              const isHighlighted = idx === highlightIndex
              return (
                <button
                  key={option.id}
                  ref={(el) => {
                    optionRefs.current[idx] = el
                  }}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors ${
                    isHighlighted
                      ? 'bg-slate-100'
                      : isActive
                        ? 'bg-orange-500/5 text-orange-700'
                        : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {(isActive || isHighlighted) && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </motion.ul>,
          document.body
        )}
    </motion.div>
  )
}

export default TableDropDown
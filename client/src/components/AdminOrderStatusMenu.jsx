import { useEffect, useId, useRef, useState } from 'react'
import {
  ADMIN_STATUS_SELECT_OPTIONS,
  getAdminOrderStatusKey,
  getAdminOrderStatusLabel,
  getAdminOrderStatusTone,
  messageFromApi,
  updateOrderStatus,
} from '../lib/orders.js'

/**
 * @param {{
 *   order: object,
 *   disabled?: boolean,
 *   onUpdated?: () => void,
 * }} props
 */
export default function AdminOrderStatusMenu({ order, disabled = false, onUpdated }) {
  const menuId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const currentKey = getAdminOrderStatusKey(order)
  const currentLabel = getAdminOrderStatusLabel(order)
  const tone = getAdminOrderStatusTone(order)

  useEffect(() => {
    if (!open) return undefined

    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function onSelect(stageId) {
    if (disabled || busy || stageId === currentKey) {
      setOpen(false)
      return
    }

    const label = ADMIN_STATUS_SELECT_OPTIONS.find((o) => o.id === stageId)?.label ?? stageId
    if (!window.confirm(`주문 상태를 "${label}"(으)로 변경할까요?`)) {
      setOpen(false)
      return
    }

    setBusy(true)
    const { ok, data } = await updateOrderStatus(String(order._id), { stage: stageId })
    setBusy(false)
    setOpen(false)

    if (!ok) {
      window.alert(messageFromApi(data, '상태 변경에 실패했습니다.'))
      return
    }

    onUpdated?.()
  }

  return (
    <div ref={rootRef} className="admin-orders-status-menu">
      <button
        type="button"
        className={`admin-orders-status-trigger admin-orders-status-trigger--${tone}`}
        disabled={disabled || busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{busy ? '변경 중…' : currentLabel}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul id={menuId} className="admin-orders-status-dropdown" role="listbox" aria-label="주문 상태 변경">
          {ADMIN_STATUS_SELECT_OPTIONS.map((option) => {
            const isActive = option.id === currentKey
            return (
              <li key={option.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  className={`admin-orders-status-option${isActive ? ' admin-orders-status-option--active' : ''}`}
                  onClick={() => onSelect(option.id)}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}


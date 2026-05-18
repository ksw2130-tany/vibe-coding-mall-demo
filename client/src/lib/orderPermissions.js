import { authRequest } from './api/http.js'
import { API_BASE_URL } from './auth.js'

const PERMISSIONS_URL = `${API_BASE_URL}/api/orders/admin/permissions`

/** @typedef {{ canPrepare: boolean, canShip: boolean, canDeliver: boolean, canCancel: boolean, allowedNextStatuses: string[] }} AdminOrderActions */

/**
 * GET /api/orders/admin/permissions
 */
export async function fetchAdminOrderPermissions() {
  return authRequest({ method: 'GET', url: PERMISSIONS_URL })
}

/**
 * @param {Record<string, AdminOrderActions> | null | undefined} actionsByStatus
 * @param {string} status
 * @returns {AdminOrderActions}
 */
export function getAdminActionsForStatus(actionsByStatus, status) {
  const fallback = {
    canPrepare: false,
    canShip: false,
    canDeliver: false,
    canCancel: false,
    allowedNextStatuses: [],
  }
  if (!actionsByStatus || !status) return fallback
  return actionsByStatus[status] ?? fallback
}

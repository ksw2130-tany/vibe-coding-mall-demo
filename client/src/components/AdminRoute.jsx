import { Link, Navigate } from 'react-router-dom'
import { useAdminGate } from '../lib/adminAuth.js'
import AdminTopbar from './AdminTopbar.jsx'

/**
 * 관리자 전용 라우트 — 비로그인·일반 사용자 차단
 * @param {{ children: import('react').ReactNode, from?: string, dashboardLink?: boolean }} props
 */
export default function AdminRoute({ children, from = '/admin', dashboardLink = true }) {
  const { authGate } = useAdminGate(from)

  if (authGate === 'checking') {
    return (
      <div className="admin">
        {dashboardLink ? <AdminTopbar dashboardLink /> : null}
        <p className="admin-route-status">권한 확인 중…</p>
      </div>
    )
  }

  if (authGate === 'denied') {
    return <Navigate to="/login" replace state={{ from }} />
  }

  if (authGate === 'forbidden') {
    return (
      <div className="admin">
        {dashboardLink ? <AdminTopbar dashboardLink /> : null}
        <div className="admin-shell admin-route-forbidden">
          <h1 className="admin-route-forbidden-title">접근 권한이 없습니다</h1>
          <p>관리자 계정으로 로그인한 경우에만 이용할 수 있습니다.</p>
          <Link to="/" className="admin-store-link">
            쇼핑몰 홈으로
          </Link>
        </div>
      </div>
    )
  }

  return children
}

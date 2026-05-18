import { Link } from 'react-router-dom'

export default function AdminTopbar({ dashboardLink = false }) {
  return (
    <header className="admin-topbar">
      <div className="admin-shell admin-topbar-inner">
        <div className="admin-brand">
          <Link to="/admin" className="admin-logo-link">
            <span className="admin-logo">경안 슈퍼</span>
          </Link>
          <span className="admin-badge">ADMIN</span>
        </div>
        <div className="admin-topbar-actions">
          {dashboardLink ? (
            <Link to="/admin" className="admin-store-link">
              대시보드
            </Link>
          ) : null}
          <Link to="/" className="admin-store-link">
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </div>
    </header>
  )
}

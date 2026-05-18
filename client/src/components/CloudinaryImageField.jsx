import { useState } from 'react'
import {
  CLOUDINARY_ENV,
  getCloudinarySetupMessage,
  isCloudinaryConfigured,
  openCloudinaryUpload,
} from '../lib/cloudinary.js'

function parseUrls(text) {
  return String(text || '')
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * @param {{
 *   label: string
 *   name: string
 *   value: string
 *   onChange: (e: { target: { name: string, value: string } }) => void
 *   multiple?: boolean
 *   required?: boolean
 *   idPrefix?: string
 * }} props
 */
export default function CloudinaryImageField({
  label,
  name,
  value,
  onChange,
  multiple = false,
  required = false,
  idPrefix = 'img',
}) {
  const [uploading, setUploading] = useState(false)
  const [widgetError, setWidgetError] = useState('')
  const configured = isCloudinaryConfigured()
  const urls = multiple ? parseUrls(value) : value ? [value] : []

  function emit(nextValue) {
    onChange({ target: { name, value: nextValue } })
  }

  function removeUrl(url) {
    if (multiple) {
      emit(urls.filter((u) => u !== url).join('\n'))
    } else {
      emit('')
    }
  }

  async function handleUpload() {
    setWidgetError('')
    setUploading(true)
    try {
      await openCloudinaryUpload({
        multiple,
        onSuccess: (url) => {
          if (multiple) {
            const next = [...urls, url]
            emit(next.join('\n'))
          } else {
            emit(url)
          }
        },
      })
    } catch (err) {
      setWidgetError(err.message || '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-products-field admin-products-field--full admin-cloudinary-field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>

      {!configured ? (
        <div className="admin-cloudinary-warn" role="alert">
          <p>Cloudinary 미설정 — 아래 URL 입력란을 사용하거나 환경 변수를 설정하세요.</p>
          <ul className="admin-cloudinary-env-list">
            <li>
              <code>{CLOUDINARY_ENV.CLOUD_NAME}</code> — Cloudinary Cloud name
            </li>
            <li>
              <code>{CLOUDINARY_ENV.UPLOAD_PRESET}</code> — Unsigned upload preset 이름
            </li>
            <li>
              <code>{CLOUDINARY_ENV.FOLDER}</code> — (선택) 업로드 폴더
            </li>
          </ul>
          <p className="admin-cloudinary-env-hint">{getCloudinarySetupMessage()}</p>
        </div>
      ) : null}

      <div className="admin-cloudinary-actions">
        <button
          type="button"
          className="admin-cloudinary-upload-btn"
          onClick={handleUpload}
          disabled={uploading || !configured}
        >
          {uploading ? '업로드 중…' : multiple ? 'Cloudinary에서 이미지 추가' : 'Cloudinary에서 업로드'}
        </button>
      </div>

      {widgetError ? (
        <p className="admin-products-alert admin-products-alert--error" role="alert">
          {widgetError}
        </p>
      ) : null}

      {urls.length > 0 ? (
        <ul className={`admin-cloudinary-previews${multiple ? ' admin-cloudinary-previews--grid' : ''}`}>
          {urls.map((url) => (
            <li key={url} className="admin-cloudinary-preview-item">
              <img src={url} alt="" className="admin-cloudinary-preview-img" />
              <button
                type="button"
                className="admin-cloudinary-remove"
                onClick={() => removeUrl(url)}
                aria-label="이미지 제거"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-cloudinary-empty">등록된 이미지가 없습니다.</p>
      )}

      <input
        id={`${idPrefix}-${name}`}
        name={name}
        type="text"
        className="admin-cloudinary-url-input"
        value={value}
        onChange={onChange}
        placeholder={multiple ? 'URL 직접 입력 (한 줄에 하나)' : '또는 이미지 URL 직접 입력'}
      />
    </div>
  )
}

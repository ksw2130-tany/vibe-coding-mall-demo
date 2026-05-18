/**
 * Cloudinary Upload Widget (Unsigned) — 클라이언트 환경 변수
 *
 * client/.env 에 설정 (Vite는 VITE_ 접두사 필수):
 *
 * | 변수 | 필수 | 설명 |
 * |------|------|------|
 * | VITE_CLOUDINARY_CLOUD_NAME | ✅ | Cloudinary 대시보드 → Product environment credentials → Cloud name |
 * | VITE_CLOUDINARY_UPLOAD_PRESET | ✅ | Settings → Upload → Upload presets → Unsigned preset 이름 |
 * | VITE_CLOUDINARY_FOLDER | ❌ | 업로드 폴더 경로 (예: shoping-mall/products) |
 *
 * ⚠️ API Secret / API Key는 브라우저에 넣지 마세요. Unsigned preset만 사용합니다.
 */

const WIDGET_SCRIPT = 'https://upload-widget.cloudinary.com/global/all.js'

/** @readonly */
export const CLOUDINARY_ENV = {
  CLOUD_NAME: 'VITE_CLOUDINARY_CLOUD_NAME',
  UPLOAD_PRESET: 'VITE_CLOUDINARY_UPLOAD_PRESET',
  FOLDER: 'VITE_CLOUDINARY_FOLDER',
}

let scriptPromise = null

function readEnv(key) {
  const raw = import.meta.env[key]
  if (raw === undefined || raw === null) return ''
  return String(raw).trim()
}

/**
 * @returns {{ cloudName: string, uploadPreset: string, folder?: string } | null}
 */
export function getCloudinaryConfig() {
  const cloudName = readEnv(CLOUDINARY_ENV.CLOUD_NAME)
  const uploadPreset = readEnv(CLOUDINARY_ENV.UPLOAD_PRESET)
  const folder = readEnv(CLOUDINARY_ENV.FOLDER)

  if (!cloudName || !uploadPreset) return null

  const config = { cloudName, uploadPreset }
  if (folder) config.folder = folder
  return config
}

/** @returns {string[]} */
export function getMissingCloudinaryEnvKeys() {
  const missing = []
  if (!readEnv(CLOUDINARY_ENV.CLOUD_NAME)) missing.push(CLOUDINARY_ENV.CLOUD_NAME)
  if (!readEnv(CLOUDINARY_ENV.UPLOAD_PRESET)) missing.push(CLOUDINARY_ENV.UPLOAD_PRESET)
  return missing
}

export function isCloudinaryConfigured() {
  return getCloudinaryConfig() !== null
}

export function getCloudinarySetupMessage() {
  const missing = getMissingCloudinaryEnvKeys()
  if (missing.length === 0) return ''
  return `client/.env 파일에 다음 값을 설정하세요: ${missing.join(', ')} (설정 후 dev 서버 재시작)`
}

export function loadCloudinaryWidget() {
  if (typeof window !== 'undefined' && window.cloudinary?.createUploadWidget) {
    return Promise.resolve()
  }
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${WIDGET_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Cloudinary 위젯 로드 실패')))
      return
    }
    const script = document.createElement('script')
    script.src = WIDGET_SCRIPT
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Cloudinary 위젯 로드 실패'))
    document.body.appendChild(script)
  })

  return scriptPromise
}

/**
 * @param {{ multiple?: boolean, onSuccess: (url: string) => void }} options
 */
export async function openCloudinaryUpload({ multiple = false, onSuccess }) {
  const config = getCloudinaryConfig()
  if (!config) {
    throw new Error(getCloudinarySetupMessage() || 'Cloudinary 환경 변수가 없습니다.')
  }

  await loadCloudinaryWidget()

  /** @type {Record<string, unknown>} */
  const widgetOptions = {
    cloudName: config.cloudName,
    uploadPreset: config.uploadPreset,
    sources: ['local', 'url', 'camera'],
    multiple,
    maxFiles: multiple ? 8 : 1,
    clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
    maxFileSize: 5_000_000,
    cropping: false,
  }

  if (config.folder) {
    widgetOptions.folder = config.folder
  }

  return new Promise((resolve) => {
    const widget = window.cloudinary.createUploadWidget(widgetOptions, (error, result) => {
      if (error) {
        console.error('[Cloudinary]', error)
        return
      }
      if (result.event === 'success' && result.info?.secure_url) {
        onSuccess(result.info.secure_url)
      }
      if (result.event === 'close') {
        resolve()
      }
    })
    widget.open()
  })
}

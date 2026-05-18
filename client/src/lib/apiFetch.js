/**
 * API 호출 시 브라우저 캐시(304 Not Modified)로 본문이 비는 문제 방지
 */
export function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    cache: 'no-store',
  })
}

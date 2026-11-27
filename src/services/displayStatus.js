// 혼잡도 표시 규칙 (마커 색·뱃지 글자) — 담당: 공통
// 지도 마커, 카페 시트, 상세 화면이 모두 이 함수 하나로 같은 규칙을 써요.
//
//   import { getDisplayStatus } from '../../services/displayStatus.js'
//   const s = getDisplayStatus(cafe)
//   s.color → 마커/뱃지 색,  s.label → '여유' 같은 글자,  s.updatedText → '30분 지난 평가입니다'
//
// 규칙 (위에서부터 먼저 걸리는 것):
//   1) visibility가 'paused'               → paused  '홍보 중단'  회색
//   2) isPartner가 아님(미가입 카페)        → none    '정보 없음'  회색
//   3) 사장님이 한 번도 상태를 안 올림       → unknown '정보 없음'  회색
//   4) 그 외                               → 사장님이 설정한 level (free 여유 / normal 보통 / busy 혼잡)
//
// 회의 결정 (보충 1·2번):
//   - 혼잡도는 사장님만 설정해요. 고객 혼잡도 평가는 없어요.
//   - 시간이 지나도 혼잡도를 지우지 않고 그대로 보여 주되, 얼마나 지난 평가인지 함께 표시해요.
//     15분 미만 '방금 업데이트한 평가입니다'
//     15분~ '15분 지난 평가입니다' · 30분~ '30분 …' · 1시간~ '1시간 …' · 2시간~ '2시간 …'
//     3시간~ '3시간 지난 평가입니다' (3시간이 넘어도 이 문구 그대로)

/** 사장님이 고를 수 있는 혼잡도 3단계 */
export const LEVELS = ['free', 'normal', 'busy']

export const STATUS_COLORS = {
  free: '#2E9E5B',
  normal: '#E8A317',
  busy: '#D64545',
  paused: '#9AA0A6',
  none: '#9AA0A6',
  unknown: '#9AA0A6',
}

export const STATUS_LABELS = {
  free: '여유',
  normal: '보통',
  busy: '혼잡',
  paused: '홍보 중단',
  none: '정보 없음',
  unknown: '정보 없음',
}

/** 경과 시간 단계 (분, 글자). 큰 것부터 보고 처음 걸리는 단계를 써요. */
export const AGE_STEPS = [
  [180, '3시간'],
  [120, '2시간'],
  [60, '1시간'],
  [30, '30분'],
  [15, '15분'],
]

/** Date / Firestore Timestamp / 숫자 → Date */
function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  return null
}

/**
 * 몇 분 전인지 사람이 읽기 좋은 글자로. 예: '방금', '12분 전', '3시간 전', '2일 전'
 * (리뷰 작성 시각 같은 곳에 써요. 혼잡도 문구는 formatStatusAge를 써요.)
 * @param {Date|object|number} value
 * @param {Date} [now]
 */
export function formatTimeAgo(value, now = new Date()) {
  const date = toDate(value)
  if (!date) return ''
  const minutes = Math.floor((now - date) / 60000)
  if (minutes < 1) return '방금'
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

/**
 * 혼잡도가 얼마나 지난 평가인지 단계별 문구로. 예: 40분 → '30분 지난 평가입니다'
 * @param {number|null} minutesAgo
 */
export function formatStatusAge(minutesAgo) {
  if (minutesAgo === null || minutesAgo === undefined) return ''
  const step = AGE_STEPS.find(([min]) => minutesAgo >= min)
  return step ? `${step[1]} 지난 평가입니다` : '방금 업데이트한 평가입니다'
}

/**
 * 카페의 지금 표시 상태를 계산해요.
 * @param {object} cafe services/cafes.js가 주는 카페 객체
 * @param {Date} [now] 테스트용 (보통 생략)
 * @returns {{
 *   key: 'free'|'normal'|'busy'|'paused'|'none'|'unknown',
 *   label: string, color: string,
 *   minutesAgo: number|null,  // 사장님 마지막 업데이트로부터 몇 분 (모르면 null)
 *   updatedText: string,      // '30분 지난 평가입니다' (없으면 '')
 *   canAlert: boolean,        // 여유 알림 대상이 될 수 있는 상태인지
 * }}
 */
export function getDisplayStatus(cafe, now = new Date()) {
  const updatedAt = toDate(cafe?.status?.updatedAt)
  const minutesAgo = updatedAt ? Math.max(0, Math.floor((now - updatedAt) / 60000)) : null

  const result = (key, extra = {}) => ({
    key,
    label: STATUS_LABELS[key],
    color: STATUS_COLORS[key],
    minutesAgo,
    updatedText: formatStatusAge(minutesAgo),
    canAlert: false,
    ...extra,
  })

  if (!cafe) return result('none')
  if (cafe.visibility === 'paused') return result('paused')
  if (cafe.isPartner !== true) return result('none', { minutesAgo: null, updatedText: '' })

  const level = cafe.status?.level
  if (!LEVELS.includes(level) || minutesAgo === null) return result('unknown')

  return result(level, { canAlert: level === 'free' })
}

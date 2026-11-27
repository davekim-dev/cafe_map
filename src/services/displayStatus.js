// 혼잡도 표시 규칙 (마커 색·뱃지 글자) — 담당: 공통
// 지도 마커, 카페 시트, 상세 화면이 모두 이 함수 하나로 같은 규칙을 써요.
//
//   import { getDisplayStatus } from '../../services/displayStatus.js'
//   const s = getDisplayStatus(cafe)            // 고객 평가 없이
//   const s = getDisplayStatus(cafe, summary)   // votes.js의 최근 30분 평가 요약을 같이 넘기면 보조 문구도
//   s.color  → 마커/뱃지 색,  s.label → '여유' 같은 글자,  s.updatedText → '12분 전 업데이트'
//
// 규칙 (위에서부터 먼저 걸리는 것):
//   1) visibility가 'paused'          → paused  '홍보 중단'  회색
//   2) isPartner가 아님(미가입 카페)   → none    '정보 없음'  회색
//   3) 마지막 업데이트가 2시간 넘음     → unknown '정보 없음'  회색
//   4) 그 외                          → 사장님이 설정한 level (free 여유 / normal 보통 / busy 혼잡)
// ※ 2시간(STALE_MINUTES)은 팀 논의 2번에서 바뀔 수 있어요. 바뀌면 이 숫자만 고치면 돼요.

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

/** 이 시간(분)이 지나도록 사장님이 업데이트 안 하면 "정보 없음" */
export const STALE_MINUTES = 120

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
 * 카페의 지금 표시 상태를 계산해요.
 * @param {object} cafe services/cafes.js가 주는 카페 객체
 * @param {{ free?: number, normal?: number, busy?: number, top?: string }} [recentVotes]
 *        votes.js의 getRecentVoteSummary 결과 (없으면 생략)
 * @param {Date} [now] 테스트용 (보통 생략)
 * @returns {{
 *   key: 'free'|'normal'|'busy'|'paused'|'none'|'unknown',
 *   label: string, color: string,
 *   minutesAgo: number|null,  // 사장님 마지막 업데이트로부터 몇 분 (모르면 null)
 *   updatedText: string,      // '12분 전 업데이트' (없으면 '')
 *   voteText: string,         // 고객 평가 보조 문구 (없으면 '')
 *   canAlert: boolean,        // 여유 알림 대상이 될 수 있는 상태인지
 * }}
 */
export function getDisplayStatus(cafe, recentVotes, now = new Date()) {
  const updatedAt = toDate(cafe?.status?.updatedAt)
  const minutesAgo = updatedAt ? Math.max(0, Math.floor((now - updatedAt) / 60000)) : null
  const updatedText = updatedAt ? `${formatTimeAgo(updatedAt, now)} 업데이트` : ''

  const result = (key, extra = {}) => ({
    key,
    label: STATUS_LABELS[key],
    color: STATUS_COLORS[key],
    minutesAgo,
    updatedText,
    voteText: '',
    canAlert: false,
    ...extra,
  })

  if (!cafe) return result('none')
  if (cafe.visibility === 'paused') return result('paused')
  if (cafe.isPartner !== true) return result('none', { minutesAgo: null, updatedText: '' })

  const level = cafe.status?.level
  if (!LEVELS.includes(level) || minutesAgo === null || minutesAgo > STALE_MINUTES) {
    return result('unknown')
  }

  return result(level, {
    voteText: makeVoteText(level, recentVotes),
    canAlert: level === 'free',
  })
}

/** 최근 30분 고객 평가 보조 문구 (팀 논의 1번 기본안: 사장 상태를 크게, 고객 평가는 보조로) */
function makeVoteText(ownerLevel, votes) {
  if (!votes) return ''
  const total = (votes.free || 0) + (votes.normal || 0) + (votes.busy || 0)
  if (total === 0 || !votes.top) return ''
  const topLabel = STATUS_LABELS[votes.top]
  const topCount = votes[votes.top] || 0
  const batchim = hasBatchim(topLabel)
  if (votes.top === ownerLevel) return `최근 손님 ${topCount}명도 '${topLabel}'${batchim ? '이라고' : '라고'} 했어요`
  return `최근 30분 손님 평가는 '${topLabel}'${batchim ? '이' : '가'} 많아요 (${total}명 중 ${topCount}명)`
}

/** 마지막 글자에 받침이 있는지 (여유 → 없음, 보통·혼잡 → 있음) */
function hasBatchim(word) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

// 파워 키워드 = 지도 필터 목록 (회의 결정 보충 5·6번) — 담당: 공통
// 손님이 리뷰를 쓸 때 이 키워드 중에서 고르고, 고른 횟수가 cafes.keywordCounts에 쌓여요.
// 지도 필터도 같은 목록을 써요. (예: '카공' 필터 → 손님이 '카공'을 한 번 이상 고른 카페만)
// 목록을 바꾸려면 이 파일만 고치면 리뷰 쓰기·필터·키워드 요약에 모두 반영돼요.
//
//   import { KEYWORD_GROUPS, KEYWORDS, hasKeyword, topKeywords } from '../../constants/keywords.js'

/** 필터 분류 3개와 그 안의 키워드 */
export const KEYWORD_GROUPS = [
  { id: 'food', label: '음식', keywords: ['커피', '디저트', '다양성'] },
  { id: 'mood', label: '분위기', keywords: ['카공', '얘기', '조용', '데이트'] },
  { id: 'comfort', label: '편의성', keywords: ['화장실', '콘센트 유무', '편한 의자'] },
]

/** 키워드 10개 전체 (리뷰 쓰기 칩 순서) */
export const KEYWORDS = KEYWORD_GROUPS.flatMap((g) => g.keywords)

/** 필터: 이 카페에 손님이 그 키워드를 한 번 이상 골랐는지 */
export function hasKeyword(cafe, keyword) {
  return (cafe?.keywordCounts?.[keyword] ?? 0) > 0
}

/** 파워 키워드: 많이 고른 순서로 n개 → [{ keyword, count }] */
export function topKeywords(cafe, n = 3) {
  return Object.entries(cafe?.keywordCounts ?? {})
    .filter(([keyword, count]) => KEYWORDS.includes(keyword) && count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([keyword, count]) => ({ keyword, count }))
}

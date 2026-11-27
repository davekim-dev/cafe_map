// 카페 목록 데이터 — 담당: 공통
// 화면(pages·components)은 Firestore를 직접 부르지 말고 이 파일의 함수만 써요.
//
// ─ 쓰는 법 ───────────────────────────────────────────────
//   // 1) React 화면에서 (가장 쉬움)
//   import { useCafes } from '../../services/cafes.js'
//   const { cafes, loading, error } = useCafes()
//
//   // 2) 함수로 직접 구독
//   import { watchCafes } from '../../services/cafes.js'
//   const stop = watchCafes((cafes) => console.log(cafes.length))
//   stop() // 그만 받기
//
//   // 3) 카페 하나
//   import { getCafe } from '../../services/cafes.js'
//   const cafe = await getCafe('demo_ongi')   // 없으면 null
//
// ─ 돌려주는 카페 모양 ─────────────────────────────────────
//   { id, name, lat, lng, address, category, isPartner, visibility, keywordCounts,
//     status: { level: 'free'|'normal'|'busy', updatedAt: Date },
//     seats:  { available, total, updatedAt: Date }, intro, filters, hours, ownerUid, ... }
//   ※ Firestore의 시간 값(Timestamp)은 보통 JavaScript Date로 바꿔서 줘요.
//
// ─ 읽기 비용 아끼기 ───────────────────────────────────────
//   Firestore는 문서를 읽을 때마다 무료 한도(하루 5만 회)가 줄어요. 카페 목록 구독을 처음 시작할 때 카페 수(약 220)만큼 읽어요.
//   그래서 여러 화면이 동시에 watchCafes / useCafes 를 불러도 Firestore 구독은 앱 전체에서 딱 1개만 열고 함께 나눠 써요.
//   이후에는 바뀐 카페만 다시 읽어요(사장님이 상태를 바꾸면 1회).
import { useEffect, useState } from 'react'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase.js'

// ── 시간 값 변환 ──────────────────────────────────────────

/** Firestore Timestamp / Date / 숫자 → Date (없으면 null) */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value === 'number') return new Date(value)
  return null
}

/** Firestore 문서 → 화면에서 쓰기 좋은 카페 객체 */
function toCafe(snap) {
  const data = snap.data()
  return {
    id: snap.id,
    ...data,
    status: data.status ? { ...data.status, updatedAt: toDate(data.status.updatedAt) } : null,
    seats: data.seats ? { ...data.seats, updatedAt: toDate(data.seats.updatedAt) } : null,
  }
}

// ── 앱 전체가 함께 쓰는 구독 1개 ───────────────────────────

const shared = {
  cafes: null, // 마지막으로 받은 목록 (아직 없으면 null)
  error: null,
  listeners: new Set(),
  unsubscribe: null,
}

function startSharedSubscription() {
  shared.unsubscribe = onSnapshot(
    collection(db, 'cafes'),
    (snapshot) => {
      shared.cafes = snapshot.docs.map(toCafe)
      shared.error = null
      shared.listeners.forEach((l) => l.onData(shared.cafes))
    },
    (err) => {
      shared.error = err
      console.error('[cafes.js] 카페 목록을 못 받았어요:', err)
      shared.listeners.forEach((l) => l.onError?.(err))
    },
  )
}

/**
 * 카페 목록을 실시간으로 받아요. 바뀔 때마다 callback(전체 목록)이 불려요.
 * @param {(cafes: object[]) => void} callback
 * @param {(error: Error) => void} [onError]
 * @returns {() => void} 구독 해제 함수 (화면이 사라질 때 꼭 부르기)
 */
export function watchCafes(callback, onError) {
  const listener = { onData: callback, onError }
  shared.listeners.add(listener)

  if (!shared.unsubscribe) {
    startSharedSubscription()
  } else if (shared.cafes) {
    // 이미 받아 둔 목록이 있으면 기다리지 않고 바로 전달 (추가 읽기 없음)
    queueMicrotask(() => shared.listeners.has(listener) && callback(shared.cafes))
  }

  return () => {
    shared.listeners.delete(listener)
    // 아무도 안 보고 있으면 구독을 닫아요. (다음에 다시 열면 그때 다시 읽음)
    if (shared.listeners.size === 0 && shared.unsubscribe) {
      shared.unsubscribe()
      shared.unsubscribe = null
      shared.cafes = null
    }
  }
}

/**
 * React 훅: 카페 목록 실시간
 * @returns {{ cafes: object[], loading: boolean, error: Error|null }}
 */
export function useCafes() {
  const [state, setState] = useState(() => ({
    cafes: shared.cafes ?? [],
    loading: !shared.cafes,
    error: null,
  }))

  useEffect(
    () =>
      watchCafes(
        (cafes) => setState({ cafes, loading: false, error: null }),
        (error) => setState((s) => ({ ...s, loading: false, error })),
      ),
    [],
  )

  return state
}

/**
 * 카페 하나 읽기. 실시간 목록을 이미 받고 있으면 그걸 써서 추가 읽기가 없어요.
 * @param {string} id 카페 문서 ID (예: 'demo_ongi', 'sbiz_MA0101...')
 * @returns {Promise<object|null>} 없으면 null
 */
export async function getCafe(id) {
  const cached = shared.cafes?.find((c) => c.id === id)
  if (cached) return cached
  const snap = await getDoc(doc(db, 'cafes', id))
  return snap.exists() ? toCafe(snap) : null
}

// 개발용 지도 테스트 페이지 `/dev/map` — 담당: 공통
// 공통 서비스 함수가 잘 동작하는지 눈으로 확인하는 페이지예요. 실제 지도 화면은 프런트 A의 MapPage에서 만들어요.
//   - useCafes()         : Firestore 카페 목록 실시간 → 사장님이 상태를 바꾸면 새로고침 없이 점 색이 바뀜
//   - getDisplayStatus() : 점 색·상태 글자
//   - getPlaceInfo()     : 미가입 카페를 누르면 카카오에서 전화번호·카카오맵 링크
// 프런트 A가 지도 화면을 만들 때 이 파일을 참고 예시로 봐도 좋아요.
import { useEffect, useRef, useState } from 'react'
import { loadKakaoMap, CAU_CENTER } from '../services/kakaoLoader.js'
import { useCafes } from '../services/cafes.js'
import { getDisplayStatus } from '../services/displayStatus.js'
import { getPlaceInfo } from '../services/kakaoPlaces.js'
import { topKeywords } from '../constants/keywords.js'

/** 점을 눌렀을 때 아래에 뜨는 카페 정보 카드 (개발 확인용) */
function CafeInfoCard({ cafe, onClose }) {
  const status = getDisplayStatus(cafe)
  const [place, setPlace] = useState(undefined) // undefined = 찾는 중, null = 못 찾음

  // 미가입 카페면 카카오 장소 검색으로 전화번호·링크 가져오기
  useEffect(() => {
    if (cafe.isPartner) return
    let cancelled = false
    getPlaceInfo(cafe)
      .then((info) => !cancelled && setPlace(info))
      .catch(() => !cancelled && setPlace(null))
    return () => {
      cancelled = true
    }
  }, [cafe])

  return (
    <div
      id="cafe-info"
      style={{
        position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 20,
        padding: '14px 16px', borderRadius: 14, background: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,.18)', fontSize: 13, lineHeight: 1.6,
      }}
    >
      <button
        onClick={onClose}
        aria-label="닫기"
        style={{ position: 'absolute', top: 8, right: 10, border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#6E655E' }}
      >
        ✕
      </button>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1F1A17', paddingRight: 24 }}>{cafe.name}</div>

      {cafe.isPartner ? (
        <>
          <div style={{ fontWeight: 700, color: status.color }}>
            ● {status.label} · 남은 좌석 {cafe.seats?.available ?? '-'}/{cafe.seats?.total ?? '-'}
            <span style={{ fontWeight: 400, color: '#6E655E' }}> · {status.updatedText}</span>
          </div>
          <div style={{ color: '#6E655E' }}>{cafe.address}</div>
          {cafe.hours && <div style={{ color: '#6E655E' }}>영업시간 {cafe.hours}</div>}
          <div>파워 키워드 {topKeywords(cafe).map((k) => `#${k.keyword}(${k.count})`).join(' ') || '없음'}</div>
          {cafe.intro?.description && <div style={{ marginTop: 4 }}>{cafe.intro.description}</div>}
        </>
      ) : (
        <>
          <div style={{ color: '#6E655E' }}>사장님이 아직 가입하지 않은 카페예요</div>
          <div style={{ color: '#6E655E' }}>{cafe.address}</div>
          <div id="place-info" style={{ marginTop: 4 }}>
            {place === undefined && '카카오에서 정보 찾는 중…'}
            {place === null && '카카오맵에서 이 가게를 찾지 못했어요'}
            {place && (
              <>
                {place.phone ? `☎ ${place.phone}` : '전화번호 없음'} ·{' '}
                <a href={place.placeUrl} target="_blank" rel="noreferrer" style={{ color: '#5B3A29', fontWeight: 700 }}>
                  카카오맵에서 보기
                </a>
              </>
            )}
          </div>
        </>
      )}
      <div style={{ marginTop: 4, fontSize: 11, color: '#9AA0A6' }}>문서 ID: {cafe.id}</div>
    </div>
  )
}

export default function DevMapTest() {
  const mapDivRef = useRef(null)
  const kakaoRef = useRef(null)
  const mapRef = useRef(null)
  const overlaysRef = useRef([])
  const [mapStatus, setMapStatus] = useState('지도 불러오는 중…')
  const [selectedId, setSelectedId] = useState(null)
  const { cafes, loading, error } = useCafes() // ← 실시간 카페 목록

  // 1) 지도 만들기 (한 번만)
  useEffect(() => {
    let cancelled = false
    loadKakaoMap()
      .then((kakao) => {
        if (cancelled || !mapDivRef.current) return
        kakaoRef.current = kakao
        mapRef.current = new kakao.maps.Map(mapDivRef.current, {
          center: new kakao.maps.LatLng(CAU_CENTER.lat, CAU_CENTER.lng),
          level: 5,
        })
        setMapStatus('지도: OK')
      })
      .catch((err) => !cancelled && setMapStatus(`지도: 실패 — ${err.message}`))
    return () => {
      cancelled = true
    }
  }, [])

  // 2) 카페 목록이 바뀔 때마다 점 다시 그리기
  useEffect(() => {
    const kakao = kakaoRef.current
    const map = mapRef.current
    if (!kakao || !map) return

    overlaysRef.current.forEach((o) => o.setMap(null))
    overlaysRef.current = []

    for (const cafe of cafes) {
      const status = getDisplayStatus(cafe)
      const big = cafe.isPartner === true
      const size = big ? 30 : 12
      const position = new kakao.maps.LatLng(cafe.lat, cafe.lng)

      // 미가입 카페 = 작은 회색 원, 가입 카페 = 혼잡도 색 동그라미 안에 ☕ 이모지 (회의 결정 보충 8번)
      const dot = document.createElement('div')
      dot.className = 'dev-cafe-dot'
      dot.dataset.cafeId = cafe.id
      dot.dataset.statusKey = status.key
      dot.title = cafe.name
      if (big) dot.textContent = '☕'
      dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${status.color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;`
      dot.addEventListener('click', () => setSelectedId(cafe.id))
      overlaysRef.current.push(
        new kakao.maps.CustomOverlay({ map, position, content: dot, zIndex: big ? 10 : 1, clickable: true }),
      )

      if (big) {
        const label = document.createElement('div')
        label.textContent = `${cafe.name} · ${status.label} · ${cafe.seats?.available ?? '-'}/${cafe.seats?.total ?? '-'}석`
        label.style.cssText =
          'padding:3px 8px;border-radius:999px;background:#fff;color:#1F1A17;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.25);white-space:nowrap;cursor:pointer;'
        label.addEventListener('click', () => setSelectedId(cafe.id))
        overlaysRef.current.push(
          new kakao.maps.CustomOverlay({ map, position, content: label, yAnchor: -1.1, zIndex: 11, clickable: true }),
        )
      }
    }
  }, [cafes, mapStatus])

  const selected = cafes.find((c) => c.id === selectedId) // 실시간 목록에서 찾아서, 카드도 바로 갱신됨
  const partners = cafes.filter((c) => c.isPartner).length
  const dataStatus = error
    ? `카페 데이터: 실패 — ${error.message}`
    : loading
      ? '카페 데이터 불러오는 중…'
      : `카페 데이터: OK · 실시간 (전체 ${cafes.length}곳 · 가입 카페 ${partners}곳)`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ padding: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong>공통 서비스 테스트</strong>
        <div id="map-status">{mapStatus}</div>
        <div id="data-status">{dataStatus}</div>
        <div style={{ color: '#6E655E', fontSize: 12 }}>
          회색 점 = 미가입 카페 · ☕ = 가입 카페(동그라미 색은 혼잡도) · <b>점을 누르면 정보가 떠요</b>
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 300 }}>
        <div ref={mapDivRef} style={{ position: 'absolute', inset: 0 }} />
        {selected && <CafeInfoCard key={selected.id} cafe={selected} onClose={() => setSelectedId(null)} />}
      </div>
    </div>
  )
}

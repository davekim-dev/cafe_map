// 개발용 지도 테스트 페이지 `/dev/map` — 담당: 공통
// 카카오 키·도메인 설정과 Firestore에 넣은 카페 데이터를 눈으로 확인하는 페이지예요.
// 실제 지도 화면은 프런트 A의 MapPage에서 만들어요.
// 확인할 것: ① 지도가 뜨는지 ② 카페 점(회색)과 카페 온기(빨강)가 보이는지 ③ "장소 검색: OK"가 나오는지
//
// ※ 개발 확인용이라 Firestore를 직접 한 번 읽어요(getDocs). 실제 화면은 services/cafes.js 함수를 써야 해요.
import { useEffect, useRef, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.js'
import { loadKakaoMap, CAU_CENTER } from '../services/kakaoLoader.js'

// 임시 색·이름 (displayStatus.js가 생기면 그걸 써요)
const LEVEL_COLOR = { free: '#2E9E5B', normal: '#E8A317', busy: '#D64545' }
const LEVEL_LABEL = { free: '여유', normal: '보통', busy: '혼잡' }
const NONE_COLOR = '#9AA0A6'

/** 점을 눌렀을 때 아래에 뜨는 카페 정보 카드 (개발 확인용) */
function CafeInfoCard({ cafe, onClose }) {
  const isPartner = cafe.isPartner === true
  const level = cafe.status?.level
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
      {isPartner ? (
        <div style={{ fontWeight: 700, color: LEVEL_COLOR[level] || NONE_COLOR }}>
          ● {LEVEL_LABEL[level] || '정보 없음'} · 남은 좌석 {cafe.seats?.available ?? '-'}/{cafe.seats?.total ?? '-'}
          {cafe.visibility === 'paused' && ' · 홍보 중단'}
        </div>
      ) : (
        <div style={{ color: '#6E655E' }}>사장님이 아직 가입하지 않은 카페예요 (혼잡도 정보 없음)</div>
      )}
      <div style={{ color: '#6E655E' }}>{cafe.category} · {cafe.address || '주소 없음'}</div>
      {cafe.hours && <div style={{ color: '#6E655E' }}>영업시간 {cafe.hours}</div>}
      {cafe.intro?.description && <div style={{ marginTop: 4 }}>{cafe.intro.description}</div>}
      <div style={{ marginTop: 4, fontSize: 11, color: '#9AA0A6' }}>문서 ID: {cafe.id}</div>
    </div>
  )
}

export default function DevMapTest() {
  const mapRef = useRef(null)
  const [mapStatus, setMapStatus] = useState('지도 불러오는 중…')
  const [dataStatus, setDataStatus] = useState('카페 데이터 대기 중…')
  const [searchStatus, setSearchStatus] = useState('장소 검색 대기 중…')
  const [selected, setSelected] = useState(null) // 누른 카페

  useEffect(() => {
    let cancelled = false

    loadKakaoMap()
      .then(async (kakao) => {
        if (cancelled || !mapRef.current) return
        const center = new kakao.maps.LatLng(CAU_CENTER.lat, CAU_CENTER.lng)
        const map = new kakao.maps.Map(mapRef.current, { center, level: 5 })
        setMapStatus('지도: OK')

        // 1) Firestore에 넣은 카페를 점으로 표시
        try {
          const snap = await getDocs(collection(db, 'cafes'))
          if (cancelled) return
          let partners = 0
          snap.forEach((doc) => {
            const cafe = { id: doc.id, ...doc.data() }
            const isPartner = cafe.isPartner === true
            if (isPartner) partners += 1
            const color = isPartner ? LEVEL_COLOR[cafe.status?.level] || NONE_COLOR : NONE_COLOR
            const size = isPartner ? 18 : 12

            const dot = document.createElement('div')
            dot.className = 'dev-cafe-dot'
            dot.dataset.cafeId = cafe.id
            dot.title = cafe.name
            dot.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);cursor:pointer;`
            // 점을 누르면 아래에 정보 카드 (폰 터치에서도 동작)
            dot.addEventListener('click', () => setSelected(cafe))
            new kakao.maps.CustomOverlay({
              map,
              position: new kakao.maps.LatLng(cafe.lat, cafe.lng),
              content: dot,
              zIndex: isPartner ? 10 : 1,
              clickable: true, // 점 위의 클릭을 지도가 가로채지 않게
            })

            // 가입 카페(카페 온기)는 이름표도
            if (isPartner) {
              const label = document.createElement('div')
              label.textContent = `${cafe.name} · ${cafe.seats?.available ?? '-'}/${cafe.seats?.total ?? '-'}석`
              label.style.cssText =
                'padding:3px 8px;border-radius:999px;background:#fff;color:#1F1A17;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,.25);white-space:nowrap;cursor:pointer;'
              label.addEventListener('click', () => setSelected(cafe))
              new kakao.maps.CustomOverlay({
                map,
                position: new kakao.maps.LatLng(cafe.lat, cafe.lng),
                content: label,
                yAnchor: -0.8, // 점 바로 아래에 (점을 가리지 않게)
                zIndex: 11,
                clickable: true,
              })
            }
          })
          setDataStatus(`카페 데이터: OK (전체 ${snap.size}곳 · 가입 카페 ${partners}곳)`)
        } catch (err) {
          if (!cancelled) setDataStatus(`카페 데이터: 실패 — ${err.message}`)
        }

        // 2) 장소 검색(미가입 카페 정보에 쓸 기능)도 되는지 확인
        const places = new kakao.maps.services.Places()
        places.keywordSearch(
          '카페',
          (result, status) => {
            if (cancelled) return
            if (status === kakao.maps.services.Status.OK) {
              setSearchStatus(`장소 검색: OK (근처 카페 ${result.length}곳, 예: ${result[0].place_name})`)
            } else {
              setSearchStatus(`장소 검색: 실패 (${status})`)
            }
          },
          { location: center, radius: 1000 },
        )
      })
      .catch((err) => {
        if (!cancelled) setMapStatus(`지도: 실패 — ${err.message}`)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ padding: 12, fontSize: 13, lineHeight: 1.6 }}>
        <strong>카카오맵 · 카페 데이터 테스트</strong>
        <div id="map-status">{mapStatus}</div>
        <div id="data-status">{dataStatus}</div>
        <div id="search-status">{searchStatus}</div>
        <div style={{ color: '#6E655E', fontSize: 12 }}>
          회색 점 = 미가입 카페 · 큰 색 점 = 가입 카페(색은 혼잡도) · <b>점을 누르면 정보가 떠요</b>
        </div>
      </div>
      <div style={{ position: 'relative', flex: 1, minHeight: 300 }}>
        <div ref={mapRef} style={{ position: 'absolute', inset: 0 }} />
        {selected && <CafeInfoCard cafe={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

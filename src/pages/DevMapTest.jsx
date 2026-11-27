// 개발용 지도 테스트 페이지 `/dev/map` — 담당: 공통
// "카카오 키·도메인 설정이 제대로 됐나?"만 확인하는 페이지예요. 실제 지도 화면은 프런트 A의 MapPage에서 만들어요.
// 확인할 것: ① 지도가 뜨는지 ② 중앙대 정문에 마커가 있는지 ③ "장소 검색: OK"가 나오는지
import { useEffect, useRef, useState } from 'react'
import { loadKakaoMap, CAU_CENTER } from '../services/kakaoLoader.js'

export default function DevMapTest() {
  const mapRef = useRef(null)
  const [mapStatus, setMapStatus] = useState('지도 불러오는 중…')
  const [searchStatus, setSearchStatus] = useState('장소 검색 대기 중…')

  useEffect(() => {
    let cancelled = false

    loadKakaoMap()
      .then((kakao) => {
        if (cancelled || !mapRef.current) return
        const center = new kakao.maps.LatLng(CAU_CENTER.lat, CAU_CENTER.lng)
        const map = new kakao.maps.Map(mapRef.current, { center, level: 4 })
        new kakao.maps.Marker({ map, position: center })
        setMapStatus('지도: OK')

        // 장소 검색(미가입 카페 정보에 쓸 기능)도 되는지 확인
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
        <strong>카카오맵 연결 테스트</strong>
        <div id="map-status">{mapStatus}</div>
        <div id="search-status">{searchStatus}</div>
      </div>
      <div ref={mapRef} style={{ flex: 1, minHeight: 300 }} />
    </div>
  )
}

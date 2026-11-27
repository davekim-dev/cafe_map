// 카카오맵 SDK 불러오기 — 담당: 공통
// 지도가 필요한 화면에서 이렇게 써요:
//
//   import { loadKakaoMap } from '../../services/kakaoLoader.js'
//   const kakao = await loadKakaoMap()
//   new kakao.maps.Map(divElement, { center: new kakao.maps.LatLng(37.5051, 126.9571), level: 4 })
//
// - 여러 화면에서 불러도 SDK는 딱 한 번만 내려받아요.
// - libraries=services 를 넣어서 장소 검색(kakao.maps.services.Places)도 같이 쓸 수 있어요.
// - 키는 .env의 VITE_KAKAO_JS_KEY 에서 읽어요.

/** 중앙대 정문 근처 좌표 (지도 시작 위치) */
export const CAU_CENTER = { lat: 37.5051, lng: 126.9571 }

let loadingPromise = null

/**
 * 카카오맵 SDK를 불러와서 준비가 끝나면 window.kakao 를 돌려줘요.
 * @returns {Promise<any>} kakao 객체
 */
export function loadKakaoMap() {
  // 이미 불러왔으면 바로 돌려주기
  if (window.kakao?.maps?.LatLng) return Promise.resolve(window.kakao)
  // 불러오는 중이면 같은 약속(Promise)을 같이 기다리기
  if (loadingPromise) return loadingPromise

  const appKey = import.meta.env.VITE_KAKAO_JS_KEY
  if (!appKey) {
    return Promise.reject(
      new Error('.env에 VITE_KAKAO_JS_KEY가 없어요. 팀 채팅방의 값을 넣고 npm run dev를 다시 실행하세요.'),
    )
  }

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    // autoload=false: 스크립트를 받은 뒤 kakao.maps.load()로 직접 준비시킴 (React에서 안전한 방식)
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
    script.async = true
    script.onload = () => {
      if (!window.kakao?.maps) {
        loadingPromise = null
        reject(new Error('카카오맵 SDK를 받았지만 준비되지 않았어요. 카카오 콘솔에서 카카오맵 사용 설정을 확인하세요.'))
        return
      }
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () => {
      loadingPromise = null
      script.remove()
      reject(
        new Error(
          '카카오맵 SDK를 불러오지 못했어요. ① JavaScript 키가 맞는지 ② 카카오 콘솔 [플랫폼 → Web]에 지금 주소(예: http://localhost:5173)가 등록됐는지 ③ 카카오맵 사용 설정이 켜졌는지 확인하세요.',
        ),
      )
    }
    document.head.appendChild(script)
  })

  return loadingPromise
}

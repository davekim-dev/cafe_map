// 미가입 카페 정보를 카카오 장소 검색으로 가져오기 — 담당: 공통
// 공공데이터에는 이름·주소·좌표뿐이라, 전화번호와 "카카오맵에서 보기" 링크를 카카오에서 가져와요.
//
//   import { getPlaceInfo } from '../../services/kakaoPlaces.js'
//   const info = await getPlaceInfo(cafe)
//   // → { placeName, phone, address, category, placeUrl, placeId } 또는 못 찾으면 null
//
// - 결과는 DB에 저장하지 않고 화면에만 써요(카카오 이용 정책). 같은 카페를 다시 누르면 메모리에 기억해 둔 값을 써요.
// - 영업시간·메뉴·후기는 카카오 API가 주지 않아요 → placeUrl(카카오맵 링크)로 넘기기.
// - REST 키 없이 카카오맵 JS SDK(libraries=services)로 검색해요.
import { loadKakaoMap } from './kakaoLoader.js'

const cache = new Map() // cafe.id → 결과(또는 null)

/** 이름 비교용: 띄어쓰기·특수문자 빼고 소문자로 */
function normalize(text = '') {
  return text.replace(/[\s()[\]{}·.,'"&;:_-]/g, '').toLowerCase()
}

/** 검색 결과 중 우리 카페와 가장 잘 맞는 것 고르기 */
function pickBest(results, cafe) {
  if (!results.length) return null
  if (cafe.kakaoPlaceId) {
    const exact = results.find((r) => r.id === String(cafe.kakaoPlaceId))
    if (exact) return exact
  }
  const target = normalize(cafe.name)
  const score = (r) => {
    const name = normalize(r.place_name)
    let s = 0
    if (name === target) s += 100
    else if (name.includes(target) || target.includes(name)) s += 50
    if (/카페|커피|디저트|제과|베이커리/.test(r.category_name)) s += 20
    s -= Number(r.distance || 0) / 10 // 가까울수록 유리 (10m당 1점)
    return s
  }
  const best = [...results].sort((a, b) => score(b) - score(a))[0]
  // 이름이 전혀 안 맞고 150m보다 멀면 다른 가게로 보고 버림
  const name = normalize(best.place_name)
  const nameMatches = name.includes(target) || target.includes(name)
  if (!nameMatches && Number(best.distance || 0) > 150) return null
  return best
}

/**
 * 카페 이름으로 카카오 장소를 찾아 정보를 돌려줘요.
 * @param {{ id: string, name: string, lat: number, lng: number, kakaoPlaceId?: string }} cafe
 * @returns {Promise<{ placeName: string, phone: string, address: string, category: string, placeUrl: string, placeId: string } | null>}
 */
export async function getPlaceInfo(cafe) {
  if (!cafe?.name) return null
  if (cache.has(cafe.id)) return cache.get(cafe.id)

  const kakao = await loadKakaoMap()
  const places = new kakao.maps.services.Places()
  const options = {
    location: new kakao.maps.LatLng(cafe.lat, cafe.lng),
    radius: 300, // 카페 좌표 300m 안에서
    sort: kakao.maps.services.SortBy.DISTANCE,
  }

  const results = await new Promise((resolve) => {
    places.keywordSearch(
      cafe.name,
      (data, status) => {
        if (status === kakao.maps.services.Status.OK) resolve(data)
        else {
          if (status === kakao.maps.services.Status.ERROR) console.warn('[kakaoPlaces] 카카오 검색 오류:', cafe.name)
          resolve([])
        }
      },
      options,
    )
  })

  const best = pickBest(results, cafe)
  const info = best
    ? {
        placeName: best.place_name,
        phone: best.phone || '',
        address: best.road_address_name || best.address_name || '',
        category: best.category_name || '',
        placeUrl: best.place_url,
        placeId: best.id,
      }
    : null

  cache.set(cafe.id, info)
  return info
}

// 지도 홈 `/map` — 담당: 프런트 A (Figma C1, C1-F)
// 만들 내용: 카카오 지도 + 혼잡도 색 마커 + 필터 칩 + 범례, 마커를 누르면 1페이지 시트
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link } from 'react-router-dom'

export default function MapPage() {
  return (
    <div className="placeholder">
      <h1>지도 홈</h1>
      <p className="meta">/map · 준비 중</p>
      {/* 임시 이동 링크: 화면 확인용. 실제 화면을 만들 때 지워도 돼요 */}
      <nav>
        <Link to="/">시작</Link>
        <Link to="/map">지도</Link>
        <Link to="/cafe/demo">카페 상세</Link>
        <Link to="/owner">사장 홈</Link>
      </nav>
    </div>
  )
}

// 사장 홈 `/owner` — 담당: 프런트 B (Figma O1~O3)
// 만들 내용: 여유/보통/혼잡 버튼, 좌석 +/−, 홍보 노출 스위치, 구독 손님 수, 메뉴
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link } from 'react-router-dom'

export default function OwnerHomePage() {
  return (
    <div className="placeholder">
      <h1>사장 홈</h1>
      <p className="meta">/owner · 준비 중</p>
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

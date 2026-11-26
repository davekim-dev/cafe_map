// 손님 화면 미리보기 `/owner/preview` — 담당: 프런트 B (Figma O6)
// 만들 내용: 프런트 A의 지도를 재사용하고 내 카페 강조 (여유 있으면)
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link } from 'react-router-dom'

export default function OwnerPreviewPage() {
  return (
    <div className="placeholder">
      <h1>손님 화면 미리보기</h1>
      <p className="meta">/owner/preview · 준비 중</p>
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

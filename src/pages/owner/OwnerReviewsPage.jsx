// 리뷰 관리 `/owner/reviews` — 담당: 프런트 B (Figma O5)
// 만들 내용: 키워드 요약 + 리뷰 목록 + 답글
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link } from 'react-router-dom'

export default function OwnerReviewsPage() {
  return (
    <div className="placeholder">
      <h1>리뷰 관리</h1>
      <p className="meta">/owner/reviews · 준비 중</p>
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

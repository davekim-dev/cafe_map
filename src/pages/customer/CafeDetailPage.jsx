// 카페 상세 (2페이지) `/cafe/:id` — 담당: 프런트 A (Figma C3, C3-B, C6)
// 만들 내용: 혼잡도·좌석, 여유 알림 받기, 사장님 안내, 키워드, 리뷰 목록
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link, useParams } from 'react-router-dom'

export default function CafeDetailPage() {
  const { id } = useParams() // 주소의 :id 부분 (카페 ID)

  return (
    <div className="placeholder">
      <h1>카페 상세 (2페이지)</h1>
      <p className="meta">/cafe/:id · 준비 중</p>
      <p className="meta">카페 ID: {id}</p>
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

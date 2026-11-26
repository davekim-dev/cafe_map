// 리뷰 쓰기 `/cafe/:id/review` — 담당: 프런트 A (Figma C4)
// 만들 내용: 키워드 칩 선택 + 글 입력 → postReview()
// 지금은 "준비 중" 임시 화면이에요. 담당자가 이 파일을 실제 화면으로 바꿔 주세요.
import { Link, useParams } from 'react-router-dom'

export default function ReviewWritePage() {
  const { id } = useParams() // 주소의 :id 부분 (카페 ID)

  return (
    <div className="placeholder">
      <h1>리뷰 쓰기</h1>
      <p className="meta">/cafe/:id/review · 준비 중</p>
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

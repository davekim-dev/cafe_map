// 화면 이동(라우터) — 담당: 프런트 B
// 주소별로 어떤 화면을 보여줄지 정하는 곳이에요.
// TODO(프런트 B): useAuth()의 role을 보고 로그인 안 했으면 /, 고객이 /owner에 오면 /map, 사장이 /에 오면 /owner로 보내기
import { Routes, Route, Navigate } from 'react-router-dom'

import StartPage from './pages/StartPage.jsx'
import MapPage from './pages/customer/MapPage.jsx'
import CafeDetailPage from './pages/customer/CafeDetailPage.jsx'
import ReviewWritePage from './pages/customer/ReviewWritePage.jsx'
import OwnerHomePage from './pages/owner/OwnerHomePage.jsx'
import OwnerEditPage from './pages/owner/OwnerEditPage.jsx'
import OwnerReviewsPage from './pages/owner/OwnerReviewsPage.jsx'
import OwnerPreviewPage from './pages/owner/OwnerPreviewPage.jsx'
import DevMapTest from './pages/DevMapTest.jsx'

export default function App() {
  return (
    // app-shell: 모든 화면을 폰 폭(최대 430px)으로 가운데에 보여주는 틀 (index.css)
    <div className="app-shell">
      <Routes>
        {/* 시작 */}
        <Route path="/" element={<StartPage />} />

        {/* 고객 화면 (프런트 A) */}
        <Route path="/map" element={<MapPage />} />
        <Route path="/cafe/:id" element={<CafeDetailPage />} />
        <Route path="/cafe/:id/review" element={<ReviewWritePage />} />

        {/* 사장 화면 (프런트 B) */}
        <Route path="/owner" element={<OwnerHomePage />} />
        <Route path="/owner/edit" element={<OwnerEditPage />} />
        <Route path="/owner/reviews" element={<OwnerReviewsPage />} />
        <Route path="/owner/preview" element={<OwnerPreviewPage />} />

        {/* 개발용 테스트 (공통): 카카오 키·도메인 설정 확인 */}
        <Route path="/dev/map" element={<DevMapTest />} />

        {/* 없는 주소로 들어오면 시작 화면으로 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

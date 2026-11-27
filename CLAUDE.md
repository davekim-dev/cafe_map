# 프로젝트: 카페 여유지도 (학교 과제, 비개발자 팀의 바이브 코딩)

- 동작구·관악구 대학가 카페 지도. 사장님이 "여유/보통/혼잡"과 남은 좌석을 올리면 고객 지도에 실시간으로 보인다.
- 한 줄 정의: 고객은 니즈에 맞는 카페를 더 쾌적하게 이용하고, 사장님은 카페 수익률을 높인다. 돈은 사장님이 내는 B2B 모델이지만, 고객 풀이 넓어야 효과가 있어 고객도 앱 사용자에 포함된다.
- 페르소나: 중앙대 반경 2km 안에서 생활하며 카페 문화를 즐기는 젊은 층(카공족, 친구·연인, 혼카족, 취준생, 디지털 노마드, 대학생). 페르소나만 2km이고 카페 데이터는 1.5km다.
- 기술: React + Vite 모바일 퍼스트 웹앱(PWA), Firebase(Auth, Firestore, Hosting), 카카오맵 JavaScript SDK. 별도 서버 없음.
- 계정: 회원가입 없음. 데모 계정 2개를 시작 화면 버튼으로 바로 로그인. 사장 `mock_owner@demo.com`(비밀번호 `.env`의 `VITE_DEMO_OWNER_PASSWORD`), 고객 `mock_customer@demo.com`(`VITE_DEMO_CUSTOMER_PASSWORD`). 계정·users 문서는 `scripts/reset_demo.py`가 만든다.
- 데모 카페: "카페 온기" = `cafes/demo_ongi` (가상 카페, 중앙대 310관 8층, isPartner=true, mock_owner 소유). 시연 전 `reset_demo.py`로 혼잡·좌석 2/30·샘플 리뷰 3개 상태로 초기화.
- 혼잡도: **사장님만 설정**(고객 혼잡도 평가 없음, `crowdVotes`·`votes.js` 없음). 시간이 지나도 혼잡도를 지우지 않고 "n분(m시간) 지난 평가입니다"를 붙인다: 15분 미만 "방금 업데이트한 평가입니다" → 15분 → 30분 → 1시간 → 2시간 → 3시간, 3시간 초과도 "3시간 지난 평가입니다". 규칙은 `src/services/displayStatus.js`의 `getDisplayStatus()` 하나로만 계산한다.
- 파워 키워드 = 필터 목록(`src/constants/keywords.js`): 음식(커피, 디저트, 다양성) · 분위기(카공, 얘기, 조용, 데이트) · 편의성(화장실, 콘센트 유무, 편한 의자). 고객이 리뷰에서 고르면 `keywordCounts`에 쌓이고, 지도 필터는 그 키워드를 한 번 이상 받은 카페만 보여준다. 별도 `filters` 필드는 없다.
- 지도 마커: 미가입 카페는 작은 회색 원, 가입 카페(지금은 카페 온기 하나)는 혼잡도 색 동그라미 안에 ☕(커피잔) 이모지. 다른 이모지는 쓰지 않는다.
- 리뷰: 로그인한 고객은 같은 카페에 24시간에 리뷰 1개만(`reviewLocks`).
- 알림: 푸시 없음. 구독한 카페가 "여유"가 되면 고객 화면 안에 배너를 띄우고, 닫아 둔 사이 바뀐 건 다음 접속 때 "못 본 알림"으로 보여준다.
- Firestore 컬렉션: users{role, nickname, ownedCafeId}, cafes{name, lat, lng, address, category, kakaoPlaceId, hours, ownerUid, isPartner, intro{beans, machine, description}, status{level, updatedAt}, seats{available, total, updatedAt}, visibility, keywordCounts, premium}, cafes/{id}/reviews, reviewLocks, subscribers{createdAt, lastSeenAt}
- 폴더: 화면은 src/pages·src/components, 데이터 함수는 src/services. 화면은 Firestore를 직접 부르지 말고 services 함수만 쓴다.
- 카페 데이터: Firestore `cafes`에 공공데이터 카페 218곳(중앙대 반경 1.5km, 문서 ID `sbiz_...`, 모두 isPartner=false). 지도를 열 때마다 카페 수만큼 읽기가 쓰이므로(무료 하루 5만 회) 불필요한 중복 구독·반복 조회를 만들지 않는다.
- 배포: Firebase Hosting **https://cafe-map-ffd8d.web.app** (QR: `docs/qr.png`). main 기준으로 PM만 `npm run build` → `firebase deploy --only hosting`. 팀원·AI는 배포 명령을 실행하지 않는다. 카카오 JS SDK 도메인에는 `http://localhost:5173`, `https://cafe-map-ffd8d.web.app`, `https://cafe-map-ffd8d.firebaseapp.com`만 등록되어 있다.
- 레이아웃: 모바일 퍼스트. 모든 화면은 App.jsx의 `.app-shell`(최대 폭 430px, 가운데 정렬) 안에 그린다.

## 폴더별 담당 (다른 사람 폴더는 고치기 전에 그 사람에게 먼저 말하기)

| 경로 | 담당 |
| --- | --- |
| `index.html`, `src/main.jsx`, `src/index.css`, `src/firebase.js`, `scripts/`, 설정 파일(`package.json`, `vite.config.js` 등) | PM·백엔드 공통 (김성훈) |
| `src/services/cafes.js`, `kakaoLoader.js`, `kakaoPlaces.js`, `displayStatus.js`, `src/constants/` | PM·백엔드 공통 (김성훈) |
| `src/services/auth.js`, `owner.js`, `reviews.js`, `alerts.js`, `firestore.rules` | 백엔드 계정 (김유경) |
| `src/pages/customer/`, `src/components/customer/`, `src/mocks/` | 프런트 A — 고객 화면 (이수민) |
| `src/pages/owner/`, `src/pages/StartPage.jsx`, `src/components/common/`, `src/App.jsx`, `public/manifest.json` | 프런트 B — 사장 화면 + 공통 UI (김민우) |

## 경로

`/` 시작 · `/map` 지도 홈 · `/cafe/:id` 카페 상세 · `/cafe/:id/review` 리뷰 쓰기 · `/owner` 사장 홈 · `/owner/edit` 안내 수정 · `/owner/reviews` 리뷰 관리 · `/owner/preview` 손님 화면 미리보기

## Git 작업 규칙 (각자 브랜치 + 하루 한 번 합치기)

- `main`은 팀 공용 원본. **`main`에서 직접 커밋하거나 `git push origin main` 하지 않는다.**
- 브랜치: 프런트 A `front-a` · 프런트 B `front-b` · 백엔드 계정 `back-account` · PM·백엔드 공통 `back-common`
- 작업 시작 전: 내 브랜치인지 확인(`git branch`) → `git pull origin main`으로 main 최신 내용 가져오기
- 작업 후: 내 브랜치에 commit → `git push` → 하루 작업이 끝나면 GitHub에서 `main`으로 PR 생성. 합치는 건 PM.
- 충돌(CONFLICT)이 나면 임의로 다른 사람 코드를 지우지 말고, 어느 파일의 어느 부분이 왜 충돌했는지 먼저 설명해줘.

## 비밀 정보

- Firebase·카카오 키는 `.env`에만 넣는다. `.env`는 절대 커밋하지 않는다(`.env.example`만 커밋).
- 코드에서는 `import.meta.env.VITE_...`로 읽는다.

# AI에게 부탁

1. 코드를 쓰기 전에 만들거나 고칠 파일 목록과 계획을 먼저 짧게 말해줘.
2. 내가 말한 폴더 밖의 파일은 고치지 마. 꼭 필요하면 이유를 말하고 물어봐줘.
3. 코드에 한국어 주석을 달고, 비개발자도 이해할 수 있게 설명해줘.
4. 끝나면 실행·확인 방법을 단계별로 알려줘.
5. 새 라이브러리를 설치해야 하면 먼저 물어봐줘.
6. 커밋 메시지는 "사장 홈: 상태 버튼 추가"처럼 한국어로 써줘.
7. 커밋·push 전에 지금 브랜치가 `main`이 아닌지 확인하고, `main`이면 멈추고 알려줘.

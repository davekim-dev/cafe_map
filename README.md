# ☕ 카페 여유지도

대학가 카페 사장님이 한가한 시간대에 "지금 자리 여유 있어요"를 직접 알려, 근처 학생 손님을 끌어오는 카페 전용 지도 (모바일 웹앱).

- 기술: React + Vite, Firebase(Auth·Firestore·Hosting), 카카오맵 JavaScript SDK
- 팀 규칙·폴더 담당·AI에게 줄 공통 머리말: [CLAUDE.md](CLAUDE.md)

## 🌐 배포 주소 (폰으로 바로 열기)

| | |
| --- | --- |
| <img src="docs/qr.png" alt="카페 여유지도 QR" width="180"> | **https://cafe-map-ffd8d.web.app**<br><br>- 지도·카페 데이터 확인: https://cafe-map-ffd8d.web.app/dev/map<br>- main에 합쳐진 코드를 PM이 배포한 버전이에요. 최신 PR이 아직 안 보이면 다음 배포를 기다려 주세요.<br>- 데이터(Firestore)는 개발 중인 `localhost`와 **같은 것**을 봐요. 시연 전에는 PM이 `scripts/reset_demo.py`로 초기화해요. |

## 데모 계정

시작 화면의 "손님으로 시작 / 사장님으로 시작" 버튼이 아래 계정으로 바로 로그인해요. (비밀번호는 `.env`에 있음)

| 역할 | 이메일 | 연결된 카페 |
| --- | --- | --- |
| 사장 | `mock_owner@demo.com` | 카페 온기 (`cafes/demo_ongi`, 중앙대 310관 8층) |
| 고객 | `mock_customer@demo.com` | — |

## 처음 한 번만 (내 컴퓨터에 받아오기)

Git·Node.js 설치가 먼저 필요해요. (팀 공유 문서 "작업 환경 설정" 참고)

```bash
git clone https://github.com/davekim-dev/cafe_map.git
cd cafe_map
npm install
```

그다음 `.env.example`을 복사해서 같은 폴더에 `.env` 파일을 만들고, 팀 채팅방에서 받은 값을 채워요.

## 작업 방식: 각자 브랜치 + 하루 한 번 합치기

`main`은 팀 공용 원본이에요. **아무도 `main`에서 직접 작업하지 않아요.**
각자 자기 브랜치에서 작업하고, 하루 작업이 끝나면 Pull Request(PR)를 만들면 PM이 `main`에 합쳐요.

| 역할 | 내 브랜치 |
| --- | --- |
| 프런트 A (고객 화면) | `front-a` |
| 프런트 B (사장 화면 + 공통 UI) | `front-b` |
| 백엔드 계정 | `back-account` |
| PM·백엔드 공통 | `back-common` |

아래 예시는 `front-a` 기준이에요. **내 브랜치 이름으로 바꿔서** 쓰세요.

**① 처음 한 번만 — 내 브랜치 만들기**

```bash
git switch -c front-a          # front-a 브랜치를 만들고 그리로 이동
git push -u origin front-a     # GitHub에도 내 브랜치 올리기
```

**② 매일 작업 시작 전 — main 최신 내용 가져오기**

```bash
git switch front-a             # 내 브랜치로 이동 (이미 있으면 그대로)
git pull origin main           # PM이 합친 main 최신 내용을 내 브랜치로 가져오기
npm install                    # 누가 라이브러리를 추가했을 수 있으니 한 번
npm run dev                    # 화면 띄우기 → http://localhost:5173 열기
```

- 브라우저 개발자 도구(F12)의 **모바일 보기**(폰 모양 아이콘)로 폰 크기에서 확인해요.
- 끄려면 터미널에서 `Ctrl + C`.

**③ 작업 중간·끝 — 저장하고 올리기**

```bash
git add .
git commit -m "사장 홈: 상태 버튼 추가"   # 무엇을 했는지 한국어로
git push                                  # 내 브랜치(GitHub)에 올리기
```

**④ 하루 작업 끝 — PR 만들기 (GitHub 웹사이트)**

1. 저장소 페이지의 노란 띠 **Compare & pull request** 버튼을 눌러요.
   (안 보이면 **Pull requests** 탭 → **New pull request** → `compare:`에서 내 브랜치 선택)
2. `base: main` ← `compare: 내 브랜치`인지 확인하고, 제목에 오늘 한 일을 한 줄로 쓴 뒤 **Create pull request**.
3. 합치는 건 PM이 해요.

> ⚠️ `git push origin main` 금지. 작업 전에 VS Code 왼쪽 아래(또는 `git branch`)에서 지금 내 브랜치가 맞는지 확인하기.
> `git pull origin main`에서 **CONFLICT(충돌)**가 나면 혼자 해결하려 하지 말고 메시지 전체를 AI나 팀 채팅방에 공유하기.

## 명령어 모음

| 명령어 | 하는 일 |
| --- | --- |
| `npm install` | 필요한 라이브러리 설치 (처음 한 번, 또는 `package.json`이 바뀌었을 때) |
| `npm run dev` | 개발용 화면 띄우기 |
| `npm run build` | 배포용 파일 만들기 (`dist/` 폴더) |
| `npm run lint` | 코드 문법 검사 |

## 배포 (PM만)

`.env`와 Firebase 로그인이 필요해서 PM 컴퓨터에서만 해요. 항상 **main 최신 코드**로 배포해요.

```bash
git switch main
git pull origin main
npm install
npm run build                    # dist 폴더(완성본) 만들기
firebase deploy --only hosting   # dist를 https://cafe-map-ffd8d.web.app 에 올리기
git switch back-common
```

- 화면·코드가 바뀌면 다시 배포해야 반영돼요. 데이터(혼잡도·좌석·리뷰)는 배포 없이 바로 반영돼요.
- 새 배포 주소를 쓰게 되면 카카오 콘솔 JavaScript SDK 도메인에도 등록해야 지도가 떠요.

# ☕ 카페 여유지도

대학가 카페 사장님이 한가한 시간대에 "지금 자리 여유 있어요"를 직접 알려, 근처 학생 손님을 끌어오는 카페 전용 지도 (모바일 웹앱).

- 기술: React + Vite, Firebase(Auth·Firestore·Hosting), 카카오맵 JavaScript SDK
- 팀 규칙·폴더 담당·AI에게 줄 공통 머리말: [CLAUDE.md](CLAUDE.md)

## 처음 한 번만 (내 컴퓨터에 받아오기)

Git·Node.js 설치가 먼저 필요해요. (팀 공유 문서 "작업 환경 설정" 참고)

```bash
git clone https://github.com/davekim-dev/cafe_map.git
cd cafe_map
npm install
```

그다음 `.env.example`을 복사해서 같은 폴더에 `.env` 파일을 만들고, 팀 채팅방에서 받은 값을 채워요.

## 매번 작업할 때

```bash
git pull          # 1. 작업 전: 팀원들이 올린 최신 코드 받기
npm run dev       # 2. 화면 띄우기 → 터미널에 나온 http://localhost:5173 열기
```

- 브라우저 개발자 도구(F12)의 **모바일 보기**(폰 모양 아이콘)로 폰 크기에서 확인해요.
- 끄려면 터미널에서 `Ctrl + C`.

```bash
git add .
git commit -m "사장 홈: 상태 버튼 추가"   # 3. 작업 끝: 무엇을 했는지 한국어로
git push                                  # 4. GitHub에 올리기
```

## 명령어 모음

| 명령어 | 하는 일 |
| --- | --- |
| `npm install` | 필요한 라이브러리 설치 (처음 한 번, 또는 `package.json`이 바뀌었을 때) |
| `npm run dev` | 개발용 화면 띄우기 |
| `npm run build` | 배포용 파일 만들기 (`dist/` 폴더) |
| `npm run lint` | 코드 문법 검사 |

# scripts/ — 담당: 공통 (PM)

Python 관리 스크립트를 두는 곳이에요. 웹앱과는 따로, **PM 컴퓨터에서만** 실행해요.

| 파일 | 하는 일 | 상태 |
| --- | --- | --- |
| `seed_cafes.py` | 공공데이터 CSV에서 동작구·관악구 카페만 골라 Firestore `cafes`에 넣기 | 준비됨 |
| `reset_demo.py` | 데모 계정 2개·데모 카페(카페 온기)를 시연 시작 상태로 되돌리기 | 예정 |

## 처음 한 번만 (Python 환경 만들기)

`cafe_map` 폴더에서:

```bash
python -m venv scripts/.venv
scripts/.venv/Scripts/python -m pip install -r scripts/requirements.txt
```

(맥이라면 `scripts/.venv/bin/python`)

## 준비물 (GitHub에 올리지 않음)

- `scripts/data/` 에 공공데이터 "소상공인시장진흥공단_상가(상권)정보" **서울** CSV
- `scripts/` 에 Firebase 서비스 계정 키 json (Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성)
  ⚠️ 데이터베이스 관리자 권한이 있는 비밀 파일. 채팅·GitHub에 절대 올리지 않기.

## 카페 데이터 넣기

```bash
scripts/.venv/Scripts/python scripts/seed_cafes.py --inspect   # 1) CSV 컬럼 확인
scripts/.venv/Scripts/python scripts/seed_cafes.py             # 2) 넣을 카페 미리 보기
scripts/.venv/Scripts/python scripts/seed_cafes.py --write     # 3) Firestore에 저장
```

다시 실행해도 중복으로 쌓이지 않고, 사장님이 바꾼 값(상태·좌석·안내 등)은 그대로 둬요.

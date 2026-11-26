# scripts/ — 담당: 공통 (PM)

Python 관리 스크립트를 두는 곳이에요. 웹앱과는 따로 실행해요.

| 파일 | 하는 일 | 상태 |
| --- | --- | --- |
| `seed_cafes.py` | 공공데이터 CSV에서 동작구·관악구 카페만 골라 Firestore `cafes`에 넣기 | 예정 |
| `reset_demo.py` | 데모 계정 2개·데모 카페(카페 온기)를 시연 시작 상태로 되돌리기 | 예정 |

- Firebase 서비스 계정 키(json)와 원본 CSV(`scripts/data/`)는 GitHub에 올리지 않아요(`.gitignore`).

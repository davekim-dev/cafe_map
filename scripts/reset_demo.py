"""
데모 계정 + 데모 카페 "카페 온기"를 시연 시작 상태로 되돌리는 스크립트 — 담당: 공통(PM)

시연 전에 한 번 실행하면 항상 같은 출발점에서 시작할 수 있어요.

사용법 (cafe_map 폴더에서):
  scripts/.venv/Scripts/python scripts/reset_demo.py

하는 일:
  1) Firebase Auth에 데모 계정 2개가 없으면 만들고, 비밀번호를 .env 값으로 맞춤
       mock_owner@demo.com    (사장)  ← .env의 VITE_DEMO_OWNER_PASSWORD
       mock_customer@demo.com (고객)  ← .env의 VITE_DEMO_CUSTOMER_PASSWORD
  2) users/{uid} 문서의 role(owner/customer)·닉네임·ownedCafeId 를 맞춤
  3) 가상 카페 "카페 온기"(cafes/demo_ongi, 중앙대 310관 8층)를
     혼잡 · 좌석 2/30 · 기본 안내로 되돌림 (없으면 만듦)
  4) 카페 온기의 reviews · reviewLocks · crowdVotes · subscribers 를 비우고 샘플 리뷰 3개를 넣음

※ 공공데이터 카페(sbiz_...)와 다른 데이터는 건드리지 않아요.
"""

import glob
import os
import sys
from datetime import datetime, timedelta, timezone

for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPTS_DIR)

DEMO_CAFE_ID = "demo_ongi"
OWNER_EMAIL = "mock_owner@demo.com"
CUSTOMER_EMAIL = "mock_customer@demo.com"

# 카페 온기 위치: 중앙대학교 310관 (카카오 장소 검색 좌표)
ONGI_LAT, ONGI_LNG = 37.5038217213134, 126.955870181663

# 샘플 리뷰 (키워드 목록은 팀 논의 6번에서 확정 예정 → 확정되면 여기도 맞추기)
SAMPLE_REVIEWS = [
    {
        "uid": "sample_user_1",
        "nickname": "경영학과 23",
        "keywords": ["분좋카", "공부하기 좋아요"],
        "text": "310관 8층이라 수업 끝나고 바로 오기 좋아요. 창가 자리 뷰가 최고!",
        "hours_ago": 26,
    },
    {
        "uid": "sample_user_2",
        "nickname": "시험기간 생존자",
        "keywords": ["콘센트 많아요", "공부하기 좋아요"],
        "text": "자리마다 콘센트가 있어서 노트북 들고 오래 있기 편해요.",
        "hours_ago": 50,
    },
    {
        "uid": "sample_user_3",
        "nickname": "라떼 러버",
        "keywords": ["커피가 맛있어요", "분좋카"],
        "text": "라떼가 고소하고 사장님이 친절하세요. 점심 직후엔 자리가 꽉 차요.",
        "hours_ago": 74,
    },
]


def read_env():
    """cafe_map/.env 를 읽어서 dict로 (간단한 KEY=VALUE 형식만)."""
    path = os.path.join(ROOT_DIR, ".env")
    if not os.path.exists(path):
        sys.exit(".env 파일이 없어요. cafe_map 폴더에 .env를 만들어 주세요(.env.example 참고).")
    env = {}
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def find_key():
    keys = glob.glob(os.path.join(SCRIPTS_DIR, "*firebase-adminsdk*.json")) + glob.glob(
        os.path.join(SCRIPTS_DIR, "*serviceAccount*.json")
    )
    if not keys:
        sys.exit("서비스 계정 키(json)를 scripts/ 폴더에 넣어주세요. (Firebase 콘솔 → 프로젝트 설정 → 서비스 계정)")
    return keys[0]


def ensure_user(auth, email, password, display_name):
    """계정이 없으면 만들고, 있으면 비밀번호를 .env 값으로 맞춤. uid를 돌려줌."""
    try:
        user = auth.get_user_by_email(email)
        auth.update_user(user.uid, password=password, display_name=display_name, disabled=False)
        print(f"  계정 확인: {email} (비밀번호 재설정)")
    except auth.UserNotFoundError:
        user = auth.create_user(email=email, password=password, display_name=display_name)
        print(f"  계정 생성: {email}")
    return user.uid


def clear_collection(col_ref):
    count = 0
    while True:
        docs = list(col_ref.limit(300).stream())
        if not docs:
            return count
        batch = col_ref._client.batch()
        for d in docs:
            batch.delete(d.reference)
        batch.commit()
        count += len(docs)


def main():
    env = read_env()
    owner_pw = env.get("VITE_DEMO_OWNER_PASSWORD", "")
    customer_pw = env.get("VITE_DEMO_CUSTOMER_PASSWORD", "")
    for name, pw in (("VITE_DEMO_OWNER_PASSWORD", owner_pw), ("VITE_DEMO_CUSTOMER_PASSWORD", customer_pw)):
        if len(pw) < 6:
            sys.exit(f".env의 {name}가 비었거나 6자보다 짧아요. (Firebase 비밀번호는 6자 이상)")

    import firebase_admin
    from firebase_admin import auth, credentials, firestore

    firebase_admin.initialize_app(credentials.Certificate(find_key()))
    db = firestore.client()
    now = datetime.now(timezone.utc)

    print("1) 데모 계정")
    owner_uid = ensure_user(auth, OWNER_EMAIL, owner_pw, "카페 온기 사장님")
    customer_uid = ensure_user(auth, CUSTOMER_EMAIL, customer_pw, "데모 손님")

    print("2) users 문서")
    db.collection("users").document(owner_uid).set(
        {"role": "owner", "nickname": "카페 온기 사장님", "ownedCafeId": DEMO_CAFE_ID}
    )
    db.collection("users").document(customer_uid).set({"role": "customer", "nickname": "데모 손님"})
    print(f"  owner    uid={owner_uid}")
    print(f"  customer uid={customer_uid}")

    print("3) 카페 온기 (cafes/demo_ongi)")
    keyword_counts = {}
    for r in SAMPLE_REVIEWS:
        for k in r["keywords"]:
            keyword_counts[k] = keyword_counts.get(k, 0) + 1
    cafe_ref = db.collection("cafes").document(DEMO_CAFE_ID)
    cafe_ref.set(
        {
            "name": "카페 온기",
            "lat": ONGI_LAT,
            "lng": ONGI_LNG,
            "address": "서울특별시 동작구 흑석로 84 중앙대학교 310관(100주년기념관) 8층",
            "category": "카페",
            "district": "동작구",
            "kakaoPlaceId": None,
            "hours": "평일 08:00–22:00 · 주말 10:00–20:00",
            "filters": {"study": True, "outlets": True},
            "ownerUid": owner_uid,
            "isPartner": True,
            "intro": {
                "beans": "에티오피아 예가체프 + 브라질 블렌드",
                "machine": "라 마르조꼬 리네아 PB",
                "description": "310관 8층 창가에서 흑석동이 한눈에 보이는 작은 카페예요. 시험기간엔 밤 10시까지 열어요.",
            },
            "status": {"level": "busy", "updatedAt": now},
            "seats": {"available": 2, "total": 30, "updatedAt": now},
            "visibility": "visible",
            "keywordCounts": keyword_counts,
            "premium": False,
            "source": "demo",
        }
    )
    print("  혼잡 · 좌석 2/30 · 노출 중 · 사장 연결 완료")

    print("4) 카페 온기 하위 데이터 초기화")
    for sub in ("reviews", "reviewLocks", "crowdVotes", "subscribers"):
        n = clear_collection(cafe_ref.collection(sub))
        print(f"  {sub}: {n}개 삭제")
    for r in SAMPLE_REVIEWS:
        cafe_ref.collection("reviews").add(
            {
                "uid": r["uid"],
                "nickname": r["nickname"],
                "keywords": r["keywords"],
                "text": r["text"],
                "createdAt": now - timedelta(hours=r["hours_ago"]),
                "ownerReply": None,
            }
        )
    print(f"  샘플 리뷰 {len(SAMPLE_REVIEWS)}개 추가 (키워드 집계: {keyword_counts})")

    print("\n완료! 시연 시작 상태로 되돌렸어요.")


if __name__ == "__main__":
    main()

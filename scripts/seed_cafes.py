"""
공공데이터 카페 목록을 Firestore `cafes` 컬렉션에 넣는 스크립트 — 담당: 공통(PM)

데이터: 공공데이터포털 "소상공인시장진흥공단_상가(상권)정보" 서울 CSV
대상: 시군구가 동작구·관악구이고 업종(소분류)이 카페인 가게

사용법 (cafe_map 폴더에서):
  1) CSV 구조 확인       scripts/.venv/Scripts/python scripts/seed_cafes.py --inspect
  2) 넣을 카페 미리 보기  scripts/.venv/Scripts/python scripts/seed_cafes.py
  3) 실제로 Firestore에 저장  scripts/.venv/Scripts/python scripts/seed_cafes.py --write

- CSV는 scripts/data/ 폴더에 넣어요(자동으로 찾음). 다른 곳이면 --csv 경로.
- 서비스 계정 키(json)는 scripts/ 폴더에 넣어요(자동으로 찾음). 다른 곳이면 --key 경로.
- 다시 실행해도 중복으로 쌓이지 않아요. 문서 ID를 "sbiz_상가업소번호"로 고정하기 때문.
- 이미 있는 카페는 기본 정보(이름·좌표·주소·업종)만 갱신하고,
  사장님이 바꾼 값(상태·좌석·안내·키워드 등)은 건드리지 않아요.
"""

import argparse
import csv
import glob
import os
import sys

# 터미널 종류와 상관없이 한글 출력이 깨지지 않게
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPTS_DIR, "data")

TARGET_DISTRICTS = {"동작구", "관악구"}
CAFE_CATEGORY_KEYWORDS = ("카페",)  # 소분류명에 이 글자가 들어가면 카페로 봄

# 공공데이터 CSV 컬럼 이름 (연도마다 조금씩 달라서 후보를 여러 개 둠)
COLS = {
    "id": ["상가업소번호"],
    "name": ["상호명"],
    "branch": ["지점명"],
    "category": ["상권업종소분류명", "소분류명"],
    "district": ["시군구명"],
    "road_addr": ["도로명주소"],
    "jibun_addr": ["지번주소"],
    "lng": ["경도"],
    "lat": ["위도"],
}


# ── CSV 읽기 ──────────────────────────────────────────────

def find_csv(path_arg):
    if path_arg:
        return path_arg
    files = sorted(glob.glob(os.path.join(DATA_DIR, "*.csv")))
    seoul = [f for f in files if "서울" in os.path.basename(f)]
    picked = seoul or files
    if not picked:
        sys.exit(f"CSV를 못 찾았어요. 서울 상가정보 CSV를 {DATA_DIR} 에 넣거나 --csv 로 경로를 알려주세요.")
    if len(picked) > 1:
        print(f"CSV가 여러 개라 첫 번째를 써요: {os.path.basename(picked[0])}")
    return picked[0]


def open_csv(path):
    """한글이 깨지지 않는 인코딩을 찾아서 연다 (utf-8 → cp949 순서)."""
    for enc in ("utf-8-sig", "cp949"):
        try:
            f = open(path, encoding=enc, newline="")
            f.read(4096)
            f.seek(0)
            return f, enc
        except UnicodeDecodeError:
            f.close()
    sys.exit("CSV 인코딩을 알 수 없어요 (utf-8, cp949 둘 다 실패).")


def resolve_columns(header):
    resolved = {}
    for key, candidates in COLS.items():
        resolved[key] = next((c for c in candidates if c in header), None)
    required = ["id", "name", "category", "district", "lng", "lat"]
    missing = [k for k in required if not resolved[k]]
    if missing:
        sys.exit(
            "필요한 컬럼을 못 찾았어요: "
            + ", ".join(f"{k}({'/'.join(COLS[k])})" for k in missing)
            + "\n--inspect 로 실제 컬럼 이름을 확인해 주세요."
        )
    return resolved


def inspect(path):
    f, enc = open_csv(path)
    with f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"파일: {os.path.basename(path)}  (인코딩: {enc})")
        print(f"컬럼 {len(header)}개:")
        for i, h in enumerate(header):
            print(f"  {i:2d}. {h}")
        print("\n처음 5줄:")
        for i, row in enumerate(reader):
            if i >= 5:
                break
            print("  ", dict(zip(header, row)))


def load_cafes(path):
    f, enc = open_csv(path)
    cafes = []
    with f:
        reader = csv.DictReader(f)
        c = resolve_columns(reader.fieldnames)
        for row in reader:
            if row[c["district"]].strip() not in TARGET_DISTRICTS:
                continue
            category = row[c["category"]].strip()
            if not any(k in category for k in CAFE_CATEGORY_KEYWORDS):
                continue
            try:
                lat, lng = float(row[c["lat"]]), float(row[c["lng"]])
            except ValueError:
                continue  # 좌표가 없는 가게는 지도에 못 그리니 제외
            name = row[c["name"]].strip()
            branch = row[c["branch"]].strip() if c["branch"] else ""
            if branch and branch not in name:
                name = f"{name} {branch}"
            address = (row[c["road_addr"]] if c["road_addr"] else "") or (
                row[c["jibun_addr"]] if c["jibun_addr"] else ""
            )
            cafes.append(
                {
                    "doc_id": f"sbiz_{row[c['id']].strip()}",
                    "name": name,
                    "lat": lat,
                    "lng": lng,
                    "address": address.strip(),
                    "category": category,
                    "district": row[c["district"]].strip(),
                }
            )
    return cafes


# ── Firestore 저장 ────────────────────────────────────────

def find_key(path_arg):
    if path_arg:
        return path_arg
    if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
        return os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
    keys = glob.glob(os.path.join(SCRIPTS_DIR, "*firebase-adminsdk*.json")) + glob.glob(
        os.path.join(SCRIPTS_DIR, "*serviceAccount*.json")
    )
    if not keys:
        sys.exit(
            "서비스 계정 키(json)를 못 찾았어요.\n"
            "Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → 받은 파일을 scripts/ 폴더에 넣어주세요."
        )
    return keys[0]


def write_cafes(cafes, key_path):
    import firebase_admin
    from firebase_admin import credentials, firestore

    firebase_admin.initialize_app(credentials.Certificate(key_path))
    db = firestore.client()
    col = db.collection("cafes")

    created = updated = 0
    CHUNK = 200  # 한 번에 묶어서 저장 (Firestore batch 최대 500)
    for start in range(0, len(cafes), CHUNK):
        chunk = cafes[start : start + CHUNK]
        refs = [col.document(c["doc_id"]) for c in chunk]
        existing = {snap.id for snap in db.get_all(refs) if snap.exists}
        batch = db.batch()
        for cafe, ref in zip(chunk, refs):
            base = {k: v for k, v in cafe.items() if k != "doc_id"}
            if ref.id in existing:
                # 이미 있으면 기본 정보만 갱신 (사장님 데이터 보존)
                batch.update(ref, base)
                updated += 1
            else:
                batch.set(
                    ref,
                    {
                        **base,
                        "isPartner": False,
                        "visibility": "visible",
                        "keywordCounts": {},
                        "source": "sbiz",
                    },
                )
                created += 1
        batch.commit()
        print(f"  저장 중… {min(start + CHUNK, len(cafes))}/{len(cafes)}")
    print(f"완료: 새로 추가 {created}곳, 기본 정보 갱신 {updated}곳")


def main():
    p = argparse.ArgumentParser(description="공공데이터 카페 → Firestore cafes")
    p.add_argument("--csv", help="상가정보 CSV 경로 (기본: scripts/data/ 안에서 찾음)")
    p.add_argument("--key", help="서비스 계정 키 json 경로 (기본: scripts/ 안에서 찾음)")
    p.add_argument("--inspect", action="store_true", help="CSV 컬럼과 처음 5줄만 보여주기")
    p.add_argument("--write", action="store_true", help="실제로 Firestore에 저장 (없으면 미리 보기만)")
    args = p.parse_args()

    csv_path = find_csv(args.csv)
    if args.inspect:
        inspect(csv_path)
        return

    cafes = load_cafes(csv_path)
    by_district = {}
    for c in cafes:
        by_district[c["district"]] = by_district.get(c["district"], 0) + 1
    print(f"대상 카페 {len(cafes)}곳: " + ", ".join(f"{d} {n}곳" for d, n in sorted(by_district.items())))
    for c in cafes[:5]:
        print(f"  예) {c['name']} | {c['category']} | {c['address']} | ({c['lat']}, {c['lng']})")

    if not args.write:
        print("\n미리 보기만 했어요. 실제로 저장하려면 --write 를 붙여 다시 실행하세요.")
        return
    write_cafes(cafes, find_key(args.key))


if __name__ == "__main__":
    main()

"""Láy quãng 3 theo ngũ cung — Linh Nhi. Cắt NGUYÊN từ bản chép tay *Biển Tình* (bolero, Rê trưởng).

python -B scripts/lay_linh_nhi.py          # in bảng
python -B scripts/lay_linh_nhi.py --ghi    # ghi src/thay/kyThuat/layLinhNhi.json

Số đo (md Linh Nhi 13j, PianoBrain `tools/sheet/giat_lay.py`): Biển Tình — bản duy nhất của chị mang dấu nốt láy — có 52 nốt láy ở 46 chỗ, toàn
tay phải, 39/46 trên giai điệu lời; kiểu chính là LÁY TỪ QUÃNG 3 THỨ DƯỚI 21/46 (Si → Rê, Fa♯ → La: bậc 6 → 1, 3 → 5 của giọng — đi trong ngũ
cung). Cà Pháo 0/35 chỗ kiểu này (anh láy nửa cung). Một sheet nên mọi con số n = 1 bài.
Chọn đoạn: ô có ít nhất một nốt láy quãng 3 thứ dưới; hai ô liền nhau gộp một đoạn; trùng nguyên văn (điệp hát lại) giữ một. Hai tay, mọi
nốt như sheet, kể cả các nốt láy kiểu khác trong đoạn. Sheet không ghi nhịp độ: lấy ♩ 66 — md Linh Nhi ghi chị chơi bolero 60–70 BPM.
"""
import hashlib
import json
import sys

from audit_ca_phao import audit
from cat_doan import cu_moi_phach, noi_o, su_kien, ten_not

NGUON = 'D:/PianoBrain/video/Linh_Nhi/bien-tinh-linh-nhi-piano.mxl'
OUT = 'src/thay/kyThuat/layLinhNhi.json'
BPM = 66
TOI_DA = 8
# Mốc đoạn: PianoBrain tools/sheet/corpus.json (người dùng chốt).
DOAN = [('dạo', 1, 9), ('phiên', 10, 25), ('điệp', 26, 43), ('phiên 2', 44, 51), ('giang tấu', 52, 61), ('điệp kết', 62, 67),
        ('kết', 68, 72)]


def lay_quang_3(info):
    """Các nốt láy quãng 3 thứ dưới trong ô: (nốt láy, nốt chính)."""
    out = []
    for g in info['attacks']:
        if not g['grace']:
            continue
        chinh = [m for m in info['attacks'] if not m['grace'] and m['hand'] == g['hand'] and m['at'] >= g['at'] - 1e-6]
        if not chinh:
            continue
        t0 = min(m['at'] for m in chinh)
        dinh = max(m['midi'] for m in chinh if abs(m['at'] - t0) < 1e-6)
        if dinh - g['midi'] == 3:
            out.append((g['midi'], dinh))
    return out


def main():
    data = audit(NGUON)
    o_lay = sorted(int(b) for b, info in data.items() if int(b) > 0 and lay_quang_3(info))
    nhom = []
    for b in o_lay:
        if nhom and nhom[-1][-1] == b - 1 and len(nhom[-1]) < 2:
            nhom[-1].append(b)
        else:
            nhom.append([b])
    chon, da_co = [], set()
    for bars in nhom:
        notes, do_dai = noi_o(data, bars)
        events = su_kien(notes, giat=False)
        khoa = json.dumps([[e['startBeat'], e['notes'], e['hand']] for e in events])
        if khoa in da_co:
            continue
        da_co.add(khoa)
        q3 = [x for b in bars for x in lay_quang_3(data[str(b)])]
        so_lay = sum(1 for e in events if e.get('grace'))
        ten_o = f'Ô {bars[0]}' if len(bars) == 1 else f'Ô {bars[0]}–{bars[-1]}'
        doan = next(t for t, a, z in DOAN if a <= bars[0] <= z)
        chon.append(dict(
            id=f'o{bars[0]}', ten=f'{ten_o} · {doan}', o=bars, doDai=do_dai, cuMoiPhach=cu_moi_phach(events, do_dai),
            ghiChu=f"{so_lay} nốt láy, {len(q3)} láy quãng 3: " + ' · '.join(f'{ten_not(g)} → {ten_not(m)}' for g, m in q3),
            events=events, _q3=len(q3),
        ))
    # Nhiều láy quãng 3 trước, rồi giữ TOI_DA đoạn; xếp dễ trước.
    chon = sorted(chon, key=lambda c: (-c['_q3'], c['cuMoiPhach']))[:TOI_DA]
    chon.sort(key=lambda c: c['cuMoiPhach'])
    print(f"{'đoạn':16} cú/phách  ghi chú")
    for c in chon:
        print(f"{c['ten']:16} {c['cuMoiPhach']:5}    {c['ghiChu']}")
        del c['_q3']
    print('số đoạn', len(chon), '· ô có láy quãng 3:', o_lay)
    if '--ghi' in sys.argv:
        sha = hashlib.sha256(open(NGUON, 'rb').read()).hexdigest()[:12]
        out = dict(nguon=dict(file='Biển Tình — Linh Nhi, bản chép tay MuseScore (PianoBrain video/Linh_Nhi)', sha256=sha,
                              script='scripts/lay_linh_nhi.py'), bpm=BPM, meter=4, bai=chon)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', OUT)


if __name__ == '__main__':
    main()

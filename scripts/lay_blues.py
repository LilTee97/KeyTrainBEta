"""Láy nốt blue — Blues. Cắt NGUYÊN từ hai sheet: *Boogie Woogie Basics* (Marco Brandt — sheet của điệu Twist) và *Rockhouse* (Ray Charles).

python -B scripts/lay_blues.py          # in bảng
python -B scripts/lay_blues.py --ghi    # ghi src/thay/kyThuat/layBlues.json

Số đo (md Blues mục 4; PianoBrain `tools/sheet/giat_lay.py`):
- Boogie (bản chép tay) ghi nốt láy riêng: 8 chỗ — Mi♭ → Mi (♭3 → 3) ở ô 1–3, 17–19; Mi♭ + Fa♯ → Mi + Sol (♭3 + ♭5 → 3 + 5) ở ô 25, 29.
- Rockhouse (chép từ MIDI) ghi láy thành hai nốt cách nửa cung bấm CÙNG LÚC (láy chồng): 13 cặp trong 12/74 câu lick.
Chọn đoạn: Boogie — các ô có nốt láy, hai ô liền nhau gộp một đoạn; Rockhouse — câu lick có láy chồng (`phan_tich_blues_lick.py`), đoạn từ
phách có nốt đầu câu tới hết phách có nốt cuối, ≥ 4 phách. Trùng nguyên văn giữ một. Nhịp độ: Rockhouse ♩ 88 như sheet; Boogie ♩ 140 như nút
Twist (người dùng 30/9 hạ từ 180 của sheet).
"""
import hashlib
import json
import math
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402
from audit_ca_phao import audit  # noqa: E402
from cat_doan import cat, cu_moi_phach, gop_noi, noi_o, su_kien, ten_not  # noqa: E402
from phan_tich_blues_lick import GOC, SHEETS, lay  # noqa: E402

BOOGIE = 'D:/PianoBrain/video/Linh_Nhi/boogie woogie-Linh Nhi.mxl'
OUT = 'src/thay/kyThuat/layBlues.json'
BPM_BOOGIE = 140
TOI_DA_RH = 5


def doan_boogie():
    data = audit(BOOGIE)
    o_lay = sorted(int(b) for b, info in data.items() if int(b) > 0 and any(n['grace'] for n in info['attacks']))
    nhom = []
    for b in o_lay:
        if nhom and nhom[-1][-1] == b - 1 and len(nhom[-1]) < 2:
            nhom[-1].append(b)
        else:
            nhom.append([b])
    out = []
    for bars in nhom:
        notes, do_dai = noi_o(data, bars)
        events = su_kien(notes, giat=False)
        lay_rieng = [e for e in events if e.get('grace')]
        ten_o = f'Ô {bars[0]}' if len(bars) == 1 else f'Ô {bars[0]}–{bars[-1]}'
        out.append(dict(
            id=f'boogie-o{bars[0]}', ten=f'Boogie {ten_o}', o=bars, doDai=do_dai, bpm=BPM_BOOGIE,
            cuMoiPhach=cu_moi_phach(events, do_dai),
            ghiChu=f"{len(lay_rieng)} nốt láy ghi riêng ({' · '.join(ten_not(e['notes'][0]) for e in lay_rieng)}) · sheet Twist",
            events=events,
        ))
    return out


def doan_rockhouse():
    file, tonic, bpm, vong, dv = SHEETS['Rockhouse']
    licks, meta = lay('Rockhouse', file, tonic, bpm, vong, dv)
    gop = gop_noi(mxl.notes(mxl.load(GOC + file))[0])
    bs = meta['bar_start']
    out = []
    for x in sorted((x for x in licks if x['lay_chong']), key=lambda x: -x['lay_chong']):
        a = bs[x['bar']] + x['trong_o']
        a0 = math.floor(a + 1e-6)
        b0 = max(math.ceil(a + x['len'] - 1e-6), a0 + 4)
        if any(abs(c['_a'] - a0) < 1e-6 for c in out):
            continue
        events = cat(gop, a0, b0)
        cap = [e['notes'] for e in events if e['hand'] == 'right' and any(q - p == 1 for p, q in zip(e['notes'], e['notes'][1:]))]
        o_dau = max(b for b, s in bs.items() if s <= a0 + 1e-6)
        o_cuoi = max(b for b, s in bs.items() if s < b0 - 1e-6)
        out.append(dict(
            id=f'rockhouse-o{o_dau}-{round(a0 - bs[o_dau])}',
            ten=f'Rockhouse Ô {o_dau}' + (f'–{o_cuoi}' if o_cuoi != o_dau else ''),
            o=list(range(o_dau, o_cuoi + 1)), doDai=b0 - a0, cuMoiPhach=cu_moi_phach(events, b0 - a0),
            ghiChu=f"{len(cap)} cú láy chồng ({' · '.join('+'.join(ten_not(m) for m in n) for n in cap)})",
            events=events, _a=a0,
        ))
        if len(out) == TOI_DA_RH:
            break
    for c in out:
        del c['_a']
    return out, bpm


def main():
    rockhouse, bpm_rh = doan_rockhouse()
    chon, da_co = [], set()
    for c in doan_boogie() + rockhouse:
        khoa = json.dumps([[e['startBeat'], e['notes'], e['hand']] for e in c['events']])
        if khoa in da_co:
            continue
        da_co.add(khoa)
        chon.append(c)
    chon.sort(key=lambda c: c['cuMoiPhach'])
    print(f"{'đoạn':22} ♩    cú/phách  ghi chú")
    for c in chon:
        print(f"{c['ten']:22} {c.get('bpm', bpm_rh):4} {c['cuMoiPhach']:5}    {c['ghiChu']}")
    print('số đoạn', len(chon))
    if '--ghi' in sys.argv:
        sha = {p: hashlib.sha256(open(p, 'rb').read()).hexdigest()[:12] for p in (BOOGIE, GOC + SHEETS['Rockhouse'][0])}
        out = dict(nguon=dict(file='Boogie Woogie Basics (Marco Brandt, bản chép tay) · Rockhouse (Ray Charles, bản ký âm Codex đã sửa)',
                              sha256=' · '.join(sha.values()), script='scripts/lay_blues.py'), bpm=bpm_rh, meter=4, bai=chon)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', OUT)


if __name__ == '__main__':
    main()

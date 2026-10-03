"""Câu lick bè quãng 3/6 — Blues (Ray Charles, *Rockhouse*). Cắt NGUYÊN từ sheet.

python -B scripts/lick_be_blues.py          # in bảng
python -B scripts/lick_be_blues.py --ghi    # ghi src/thay/kyThuat/lickBeBlues.json

Số đo (md Blues mục 4; PianoBrain `tools/sheet/giat_lay.py --cu`): trong câu chạy Rockhouse một nửa số cú là bè đôi (95/191); đo cùng cách
trên mọi sheet, bè 3/6 chiếm 51 % cú hai nốt ở slow blues — Cà Pháo ballad 31 %, Linh Nhi 27–40 %.
Chọn câu: câu lick của `phan_tich_blues_lick.py` ở Rockhouse có ≥ 4 cú, ≥ một nửa số cú là bè quãng 3/6 (3 · 4 · 8 · 9 nửa cung), không
láy chồng — láy nốt blue để dành bài riêng (cần chấm nốt láy). Đoạn = từ phách có nốt đầu câu tới hết phách có nốt cuối, tối thiểu 4 phách,
hai tay, mọi nốt như sheet; trùng nguyên văn thì giữ một.
"""
import hashlib
import json
import math
import sys

sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
import mxl  # noqa: E402
from cat_doan import cat, cu_moi_phach, gop_noi, ten_not  # noqa: E402
from phan_tich_blues_lick import GOC, SHEETS, lay  # noqa: E402

OUT = 'src/thay/kyThuat/lickBeBlues.json'
TOI_DA = 9
BE_36 = {3, 4, 8, 9}


def main():
    file, tonic, bpm, vong, dv = SHEETS['Rockhouse']
    licks, meta = lay('Rockhouse', file, tonic, bpm, vong, dv)
    ns, _ = mxl.notes(mxl.load(GOC + file))
    gop = gop_noi(ns)
    bs = meta['bar_start']
    ung = []
    for x in licks:
        be36 = sum(1 for d in x['be_doi'] if d in BE_36)
        if x['so_cu'] < 4 or x['lay_chong'] or be36 * 2 < x['so_cu']:
            continue
        a = bs[x['bar']] + x['trong_o']
        a0 = math.floor(a + 1e-6)
        b0 = max(math.ceil(a + x['len'] - 1e-6), a0 + 4)
        ung.append((be36 / x['so_cu'], x, a0, b0))
    ung.sort(key=lambda u: -u[0])
    chon, da_co = [], set()
    for ti_le, x, a0, b0 in ung:
        events = cat(gop, a0, b0)
        khoa = json.dumps([[e['startBeat'], e['notes'], e['hand']] for e in events])
        if khoa in da_co or any(abs(c['_a'] - a0) < 1e-6 for c in chon):
            continue
        da_co.add(khoa)
        o_dau = max(b for b, s in bs.items() if s <= a0 + 1e-6)
        o_cuoi = max(b for b, s in bs.items() if s < b0 - 1e-6)
        dinh = ' '.join(ten_not(max(n['m'])) for n in x['notes'])
        chon.append(dict(
            id=f'o{o_dau}-{round(a0 - bs[o_dau])}',
            ten=f'Ô {o_dau}' + (f'–{o_cuoi}' if o_cuoi != o_dau else '') + f' · vòng {x["vong"]}',
            o=list(range(o_dau, o_cuoi + 1)), doDai=b0 - a0, cuMoiPhach=cu_moi_phach(events, b0 - a0),
            ghiChu=f'{x["so_cu"]} cú, bè 3/6 {sum(1 for d in x["be_doi"] if d in BE_36)} · nốt trên: {dinh}',
            events=events, _a=a0,
        ))
        if len(chon) == TOI_DA:
            break
    chon.sort(key=lambda c: c['cuMoiPhach'])
    print(f"{'đoạn':20} phách cú/phách  ghi chú")
    for c in chon:
        print(f"{c['ten']:20} {c['doDai']:4}  {c['cuMoiPhach']:5}    {c['ghiChu']}")
        del c['_a']
    print('số đoạn', len(chon), '· ứng viên', len(ung))
    if '--ghi' in sys.argv:
        sha = hashlib.sha256(open(GOC + file, 'rb').read()).hexdigest()[:12]
        out = dict(nguon=dict(file='Rockhouse — Ray Charles, slow blues giọng Sol (bản ký âm Codex đã sửa)', sha256=sha,
                              script='scripts/lick_be_blues.py'), bpm=bpm, meter=4, bai=chon)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', OUT)


if __name__ == '__main__':
    main()

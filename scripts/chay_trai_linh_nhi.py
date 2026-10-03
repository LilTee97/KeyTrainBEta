"""Câu chạy tay trái dẫn bè trầm vào hợp âm sau — Linh Nhi. Cắt NGUYÊN từ sheet *Lá Thư Trần Thế* (bài gốc của điệu Slow Rock Lá thư).

python -B scripts/chay_trai_linh_nhi.py          # in bảng
python -B scripts/chay_trai_linh_nhi.py --ghi    # ghi src/thay/kyThuat/chayTraiLinhNhi.json

Số đo (md Linh Nhi 13g, `tools/chay_ngon_slow_rock.py`): lúc hát, câu chạy của chị nằm ở TAY TRÁI (42/48 câu chạy ở 2 sheet slow rock) — vào ở
tiếng 4 (phách mạnh thứ hai của ô 6/8), ba móc đơn đi liền một chiều, nốt thứ tư rơi đúng vạch vào gốc hợp âm sau.
Chọn câu: đúng khuôn "dẫn vào hợp âm sau" của `khuon()` trong tool ấy — tay trái, phần hát, ≥ 3 nốt trước vạch ô 6/8 và nốt đáp ở vạch (≤ ½
phách sau vạch). Bỏ *Một Cõi*: nhịp chép hỏng (0,375 · 0,625 phách), không cắt nguyên được. Mỗi đoạn = ô 6/8 có câu chạy + ô 6/8 đáp (6 nốt
đen), hai tay; trùng nguyên văn (phiên hát lại) thì giữ một.
"""
import hashlib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'tools'))
import chay_ngon_slow_rock as C  # noqa: E402
import slow_rock_linh_nhi as S  # noqa: E402
from cat_doan import EPS, cat, cu_moi_phach, gop_noi, ten_not  # noqa: E402

OUT = 'src/thay/kyThuat/chayTraiLinhNhi.json'
BAI = 'La Thư Tran The'
BPM = 86  # dấu nhịp độ của sheet; bài tập Lá thư ở tab Điệu cũng 86
DOAN = {'verse': 'phiên', 'verse_2': 'phiên 2', 'verse_3': 'phiên 3', 'verse_4': 'phiên 4', 'chorus': 'điệp',
        'chorus_climax': 'điệp cao trào'}


def main():
    song = next(s for s in C.bai_slow_rock() if s['name'] == BAI)
    ns, _, _ = S.doc(song)
    gop = gop_noi(ns)
    dai, _ = S.LUOI[BAI]
    chon, da_co = [], set()
    for d in C.do():
        if d['bai'] != S.TEN_DEP[BAI] or d['tay'] != 'trai' or C.la_dem(d) or d['doan'] in ('intro', 'interlude', 'outro'):
            continue
        t = d['_tho']
        vach = t['vach']
        truoc = [(x, m) for x, m in t['seg'] if x < vach - EPS]
        sau_vach = [(x, m) for x, m in t['seg'] if x >= vach - EPS]
        dap = sau_vach[0] if sau_vach else (
            t['sau'] if t['sau'] and vach - EPS <= t['sau'][0] <= vach + 0.5 + EPS else None)
        if dap is None or len(truoc) < 3:
            continue
        a = vach - dai
        events = cat(gop, a, vach + dai)
        khoa = json.dumps([[e['startBeat'], e['notes'], e['hand'], e['durationBeats']] for e in events])
        if khoa in da_co or round(a, 3) in {round(c['_a'], 3) for c in chon}:
            continue
        da_co.add(khoa)
        hop_sau = d['dap']['hop_am'] if d['dap'] else '?'
        chay = ' '.join(ten_not(m) for _, m in truoc) + ' → ' + ten_not(dap[1])
        chon.append(dict(
            id=f"o{d['o_xml']}{'x' if d['chieu'] == 'xuong' else ''}",
            ten=f"Ô {d['o_xml']} · {DOAN.get(d['doan'], d['doan'])}",
            o=[d['o_xml']], doDai=dai * 2, cuMoiPhach=cu_moi_phach(events, dai * 2),
            ghiChu=f"{d['hop_am']} → {hop_sau} · tay trái {chay} ({'lên' if d['chieu'] == 'len' else 'xuống'})",
            events=events, _a=a,
        ))
    # Cùng một câu chạy hát lại ở phiên sau (cùng nốt chạy, cùng hai hợp âm): giữ đoạn có nền thưa hơn.
    gon = {}
    for c in sorted(chon, key=lambda c: c['cuMoiPhach']):
        gon.setdefault(c['ghiChu'], c)
    chon = sorted(gon.values(), key=lambda c: c['cuMoiPhach'])
    print(f"{'đoạn':22} cú/phách  ghi chú")
    for c in chon:
        print(f"{c['ten']:22} {c['cuMoiPhach']:5}    {c['ghiChu']}")
        del c['_a']
    print('số đoạn', len(chon))
    if '--ghi' in sys.argv:
        path = S.B.tim_file(song)
        sha = hashlib.sha256(open(path, 'rb').read()).hexdigest()[:12]
        out = dict(nguon=dict(file='Lá Thư Trần Thế — Linh Nhi (PianoBrain video/Linh_Nhi)', sha256=sha,
                              script='scripts/chay_trai_linh_nhi.py'), bpm=BPM, meter=3, bai=chon)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', OUT)


if __name__ == '__main__':
    main()

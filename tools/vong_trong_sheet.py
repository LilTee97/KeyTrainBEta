"""Vòng hợp âm trong sheet của từng thầy — chuỗi hợp âm từng đoạn (bậc so với chủ âm + chất), gộp hợp âm lặp liền nhau.

Người dùng 9/10/2026: "Hãy phân tích các vòng hợp âm trong các sheet của từng thầy rồi cố gắng tổng hợp lại xem nó là vòng nào trong
các vòng hợp âm phổ biến trong âm nhạc. Sau đó đưa vào tab để tôi có cái đánh theo." Tool này chỉ RÚT chuỗi; nhận vòng phổ biến là việc
của `src/thay/soanCau/nhanVong.ts` (một bộ nhận dùng chung cho tab Tái hòa âm).

Nguồn: Linh Nhi, Cà Pháo — phần hát, đọc bằng `hop_am_linh_nhi.doan_hat` (bỏ đoạn chuyển giọng `_mod`; Cà Pháo giọng trưởng còn lẫn đọc
lệch ký hiệu — md Cà Pháo mục "Ai chọn hợp âm"; 3 bài thứ giọng suy). Blues — ký hiệu in của ba sheet (`scripts/phan_tich_blues_ba_sheet
.nhan`). Đoạn lặp y hệt nhau gộp làm một, ghi số lần.

    python tools/vong_trong_sheet.py          # ghi src/thay/soanCau/vongSheet.json
    python tools/vong_trong_sheet.py --kiem   # tự kiểm
"""
import json
import os
import sys

TOOLS = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, TOOLS)
sys.path.insert(0, os.path.join(TOOLS, '..', 'scripts'))
import hop_am_linh_nhi as H  # noqa: E402
import tach_lua_chon as T  # noqa: E402

S = H.S
RA = os.path.join(TOOLS, '..', 'src', 'thay', 'soanCau', 'vongSheet.json')
CHAT = {'M': '', 'm': 'm', 'sus4': 'sus4', 'dim': 'dim', 'aug': 'aug'}
CHAT_BLUES = {'': '', '7': '7', 'm7': 'm7', 'm': 'm', '°': 'dim', 'maj7': 'maj7', 'major-minor': 'm'}
TEN_GIONG = ['Đô', 'Đô♯', 'Rê', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si']


def gop(ds):
    """Gộp hợp âm lặp liền nhau."""
    ra = []
    for x in ds:
        if not ra or ra[-1] != x:
            ra.append(x)
    return ra


def gom_doan(doan):
    """Đoạn có chuỗi y hệt đoạn trước thì gộp, đếm số lần."""
    ra = []
    for ten, hop in doan:
        cu = next((d for d in ra if d['hop'] == hop), None)
        if cu:
            cu['lan'] += 1
            cu['cung'].append(ten)
        elif len(hop) >= 2:
            ra.append(dict(ten=ten, hop=hop, lan=1, cung=[ten]))
    return ra


def thay_hat(thay):
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    ra = []
    for s in corp['songs']:
        if s.get('teacher') != thay:
            continue
        if not s.get('giong') and s['name'] in T.GIONG_SUY:
            s = dict(s, giong=T.GIONG_SUY[s['name']])
        try:
            chu, thu, meta, segs = H.doan_hat(s)
        except KeyError:  # bài chưa có giọng (Kém duyên, Yêu xa) — chưa vào
            continue
        theo = {}
        for x in segs:
            if x['doan'].endswith('_mod'):
                continue
            theo.setdefault(x['doan'], []).append([x['bac'], CHAT.get(x['q'], '')])
        doan = gom_doan([(k, gop(v)) for k, v in theo.items()])
        ra.append(dict(bai=s['name'], tonic=chu, thu=thu, giong=f"{TEN_GIONG[chu]} {'thứ' if thu else 'trưởng'}",
                       suy=s['name'] in T.GIONG_SUY, doan=doan))
    return ra


KHUON_12 = {  # bậc ở phách đầu 12 ô — ba biến thể quen của khung 12 ô blues
    'chuẩn': [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 0],
    'đổi nhanh': [0, 5, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
    'V–V': [0, 0, 0, 0, 5, 5, 0, 0, 7, 7, 0, 0],
}


def dau_o(path):
    """Phách bắt đầu mỗi ô — cùng lối cộng độ dài ô như `nhan` (đổi số chỉ nhịp thì đổi độ dài ô)."""
    import xml.etree.ElementTree as ET
    import zipfile
    zf = zipfile.ZipFile(path)
    name = next(n for n in zf.namelist() if n.endswith(('.xml', '.musicxml')) and 'META' not in n and 'container' not in n)
    ra, cursor, barlen = [], 0.0, 4.0
    for m in ET.fromstring(zf.read(name)).find('part').findall('measure'):
        t = m.find('attributes/time')
        if t is not None:
            barlen = int(t.findtext('beats')) * 4.0 / int(t.findtext('beat-type'))
        ra.append(cursor)
        cursor += barlen
    return ra


def khung_12(kh, o, tonic):
    """Khung 12 ô: trượt ba khuôn dọc bài, lấy hợp âm ở phách đầu mỗi ô (ký hiệu cuối cùng tính tới đầu ô); cửa sổ khớp ≥ 11/12 ô,
    không chồng nhau. Ô đếm từ 1."""
    bac = []
    for s in o:
        truoc = [(g - tonic) % 12 for t, g, _ in kh if t <= s + 0.01]
        bac.append(truoc[-1] if truoc else None)
    ra, i = [], 0
    while i <= len(o) - 12:
        diem = {ten: sum(bac[i + j] == k[j] for j in range(12)) for ten, k in KHUON_12.items()}
        cao = max(diem.values())
        if cao >= 11:  # hai khuôn hòa điểm thì ghi cả hai — không chọn bừa
            ra.append(dict(o=i + 1, kieu=' / '.join(t for t, d in diem.items() if d == cao), khop=cao))
            i += 12
        else:
            i += 1
    return ra


def blues():
    import phan_tich_blues_ba_sheet as B
    ra = []
    for ten, f, tonic, thu in (('Rockhouse (Ray Charles)', 'Rockhouse-Ray-da-sua.mxl', 7, False),
                               ('Slow Blues Impromptu (Robert Van)', 'Robert-Ray-chia-doan-C-Blues.mxl', 0, False),
                               ('The House of the Rising Sun', 'The-House-of-the-Rising-Sun.mxl', 4, True)):
        kh = sorted(B.nhan(B.BLUES + f))
        o = dau_o(B.BLUES + f)
        hop = gop([[(g - tonic) % 12, CHAT_BLUES.get(B.loai(k), '')] for _, g, k in kh])
        ra.append(dict(bai=ten, tonic=tonic, thu=thu, giong=f"{TEN_GIONG[tonic]} {'thứ' if thu else 'trưởng'}", suy=False,
                       doan=[dict(ten='cả bài', hop=hop, lan=1, cung=['cả bài'])], so_o=len(o),
                       khung12=[] if thu else khung_12(kh, o, tonic)))
    return ra


def chay():
    return {'linh-nhi': thay_hat('linh-nhi'), 'ca-phao': thay_hat('ca-phao'), 'blues': blues()}


def kiem(ra):
    assert [len(ra[k]) for k in ('linh-nhi', 'ca-phao', 'blues')] == [8, 7, 3], {k: len(v) for k, v in ra.items()}
    # Số đo 9/10/2026: Rockhouse 2 khung sạch trong 120 ô (ô 32 chuẩn 12/12, ô 44 khớp 11/12 cả chuẩn lẫn đổi nhanh); Robert không khung nào ≥ 11/12.
    k12 = {b['bai'].split(' ')[0]: [(x['o'], x['kieu'], x['khop']) for x in b['khung12']] for b in ra['blues']}
    assert k12['Rockhouse'] == [(32, 'chuẩn', 12), (44, 'chuẩn / đổi nhanh', 11)], k12
    assert k12['Slow'] == [] and k12['The'] == [], k12
    for k, ds in ra.items():
        for b in ds:
            assert b['doan'], (k, b['bai'])
            for d in b['doan']:
                assert all(0 <= g < 12 for g, _ in d['hop']), (k, b['bai'], d['ten'])
                assert all(x != y for x, y in zip(d['hop'], d['hop'][1:])), (k, b['bai'], 'chưa gộp lặp')
    print('kiem: dung het')


if __name__ == '__main__':
    ra = chay()
    if '--kiem' in sys.argv:
        kiem(ra)
    else:
        json.dump(ra, open(RA, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        for k, ds in ra.items():
            print(k, sum(len(b['doan']) for b in ds), 'đoạn ·', ', '.join(f"{b['bai']} ({b['giong']})" for b in ds))

"""Kỹ thuật đặc trưng của Cà Pháo (ngoài đánh giật) — cắt NGUYÊN từ sheet của anh. Người dùng 4/10/2026: *"tại sao Cà Pháo chỉ có phần
đánh giật thôi, các kỹ thuật đặc trưng khác của anh đâu"* (Claude đã hiểu nhầm câu 3/10 "tôi chỉ muốn học đánh giật kiểu Cà Pháo" thành
"với Cà Pháo chỉ học đánh giật").

python -B scripts/ky_thuat_ca_phao.py          # in bảng
python -B scripts/ky_thuat_ca_phao.py --ghi    # ghi src/thay/kyThuat/{fillCaPhao,beQuang4CaPhao,layCaPhao}.json

1. CÂU FILL LÚC HÁT — 7 kiểu, đúng các chỗ nguồn của bảng "Bảy kỹ thuật" (md Cà Pháo, phần Ballad cứ đi): 5 cửa fill người dùng đã xác nhận
   (Để Em 40 · 59, Chưa Bao Giờ 22 · 50→51 · 75→76) cộng Có Em Chờ 20→22 và Anh Cứ Đi Đi 16 · 53. Soi tận nốt 4/10 trước khi cắt.
2. BÈ QUÃNG 4 · QUÃNG 5 — đo cùng cách trên mọi sheet (PianoBrain `giat_lay.py --cu`): solo ballad của anh, cú hai nốt tay phải là quãng 4/5
   38 % — Linh Nhi 12–24 %, Blues 25 %. Chọn 2 ô đoạn đàn (dạo · giang · kết) có nhiều cú bè quãng 4/5 nhất, mỗi bài tối đa 2 đoạn.
3. LÁY NỬA CUNG — bản chép tay *Người hãy quên em đi* (sheet ghi nhiều nốt láy nhất của anh; Hồng Kông 1 chỉ 2 chỗ): 35 chỗ, láy một nốt nửa
   cung dưới 14, vuốt nửa cung 2–3 nốt 6 (lên) · 8 (xuống); Linh Nhi láy một nốt từ quãng 3 thứ dưới (0/35 chỗ của anh). Chọn ô có nốt láy;
   hai ô liền gộp một đoạn.

*Để Em Rời Xa* lệch vạch nhịp đúng một phách (bass rơi ở phách 2 ô XML, 68/70 ô): cắt theo Ô THẬT = ô XML + 1 phách.
"""
import hashlib
import json
import os
import sys

from audit_ca_phao import audit
from cat_doan import cu_moi_phach, noi_o, su_kien, ten_not

V = 'D:/PianoBrain/video/Ca_Phao/'
CORPUS = 'D:/PianoBrain/tools/sheet/corpus.json'
OUT = 'src/thay/kyThuat/'
TEMPO = {'Chua Bao Gio Trung Quan-Ca Phao.mxl': 72, 'De Em Roi Xa-Ca Phao.mxl': 85, 'Co Em Cho-Ca Phao.mxl': 75,
         'Anh Cu Di Di- Ca Phao.mxl': 63, 'nguoihayquenemdi.mxl': 107, 'Ngay mai em di-Ca Phao.mxl': 83,
         'Chung Ta Khong Thuoc Ve Nhau-Ca Phao.mxl': 103, 'kem-duyen.mxl': 104, 'yeu-xa-ca-phao-cove.mxl': 80,
         'hongkong-1-chuyen-tinh-luot-qua-nguyen-trong-tai-hong-kong-1-advanced-da-don.musicxml': 115}
TEN_BAI = {'Chua Bao Gio Trung Quan-Ca Phao.mxl': 'Chưa Bao Giờ', 'De Em Roi Xa-Ca Phao.mxl': 'Để Em Rời Xa',
           'Co Em Cho-Ca Phao.mxl': 'Có Em Chờ', 'Anh Cu Di Di- Ca Phao.mxl': 'Anh Cứ Đi Đi', 'nguoihayquenemdi.mxl': 'Người hãy quên em đi',
           'Ngay mai em di-Ca Phao.mxl': 'Ngày mai em đi', 'Chung Ta Khong Thuoc Ve Nhau-Ca Phao.mxl': 'Chúng Ta Không Thuộc Về Nhau',
           'kem-duyen.mxl': 'Kém duyên', 'yeu-xa-ca-phao-cove.mxl': 'Yêu xa',
           'hongkong-1-chuyen-tinh-luot-qua-nguyen-trong-tai-hong-kong-1-advanced-da-don.musicxml': 'Hồng Kông 1'}
LECH = {'De Em Roi Xa-Ca Phao.mxl': 1.0}  # ô thật = ô XML + 1 phách
SOLO = ('intro', 'interlude', 'outro', 'coda', 'tag')

_cache = {}


def bai(file):
    """(dữ liệu audit, phách đầu từng ô, nốt đã gộp nối của cả bài, phách tính từ đầu bài)."""
    if file not in _cache:
        data = audit(V + file)
        bars = sorted(int(b) for b in data)
        start, t = {}, 0.0
        for b in bars:
            start[b] = t
            t += data[str(b)]['length']
        notes, _ = noi_o(data, bars)
        _cache[file] = (data, start, notes)
    return _cache[file]


def cat(file, o_dau, o_cuoi, giat=False):
    """Tiếng của app trong [ô o_dau, hết ô o_cuoi) — ô thật (đã cộng lệch vạch), phách tính từ đầu đoạn."""
    data, start, notes = bai(file)
    lech = LECH.get(file, 0.0)
    a = start[o_dau] + lech
    b = start[o_cuoi] + data[str(o_cuoi)]['length'] + lech
    sel = []
    for n in notes:
        if a - 1e-6 <= n['at'] < b - 1e-6:
            m = dict(n, at=round(n['at'] - a, 6))
            if not m['grace']:
                m['dur'] = round(min(m['dur'], b - n['at']), 6)
            sel.append(m)
    return su_kien(sel, giat=giat), round(b - a, 6)


def doan(id, ten, file, o_dau, o_cuoi, ghi_chu, tay=None, giat=False):
    events, do_dai = cat(file, o_dau, o_cuoi, giat)
    d = dict(id=id, ten=ten, o=list(range(o_dau, o_cuoi + 1)), doDai=do_dai, bpm=TEMPO[file],
             cuMoiPhach=cu_moi_phach(events, do_dai), ghiChu=ghi_chu, events=events)
    if tay:
        d['tay'] = tay
    return d


# ---------- 1. Câu fill lúc hát ----------
CBG, DE, CEC, ACDD = ('Chua Bao Gio Trung Quan-Ca Phao.mxl', 'De Em Roi Xa-Ca Phao.mxl', 'Co Em Cho-Ca Phao.mxl',
                      'Anh Cu Di Di- Ca Phao.mxl')
FILL = [
    ('leo-cbg', 'Leo + hợp âm lướt', CBG, 50, 51, 'right', 'tay phải leo thế đảo ba quãng tám, đáp Si♭6+Đô7+Fa7 đầu ô sau'),
    ('leo-acdd', 'Hợp âm lướt hàng xóm', ACDD, 53, 54, None, 'tay trái Rê♭+Si → Đô+Si♭ (Rê♭7 rồi về Đô7), tay phải Fa+Si+Fa'),
    ('tay-trai-dan', 'Tay trái dẫn', ACDD, 16, 17, 'left', 'tay trái 8 móc kép Đô♯–Fa–La♭–Si | Si♭–Sol–Mi–Đô vào điệp, tay phải giữ'),
    ('mo-lot', 'Mở + hợp âm lướt', DE, 39, 40, 'right', 'La5 → Rê6+Fa♯6+La6 → Rê7 đầu ô 40'),
    ('bass-nua-cung', 'Bass đi nửa cung', CEC, 20, 22, 'left', 'bass Đô♯–Rê–Mi♭–Fa–Fa♯–Sol → La♭, rồi một lượt nữa ở ô 22'),
    ('song', 'Sóng lên xuống', CBG, 21, 22, 'right', 'cụm ba nốt lên bốn quãng tám rồi xuống, mở ngay phách 1 ô 22'),
    ('cau-don', 'Câu đơn', CBG, 75, 76, 'right', 'Mi♭4 Sol4 | La♭4 Mi♭5 Sol4 La♭4 Fa4 — nốt dẫn nửa cung vào hợp âm sau'),
    ('chuyen-8ve', 'Chuyển quãng tám', DE, 58, 59, 'right', 'cụm năm nốt chuyển nguyên thế bấm lên quãng tám, ô 59'),
]


def fill():
    out = []
    for id, kieu, file, a, b, tay, chu in FILL:
        o = f'ô {a}–{b}' + (' (ô thật)' if file in LECH else '')
        out.append(doan(id, f'{kieu} · {TEN_BAI[file]} {o}', file, a, b, chu, tay))
    return out


# ---------- 2. Bè quãng 4 · quãng 5 ----------
def be_quang_4():
    corpus = json.load(open(CORPUS, encoding='utf-8'))
    bai_ballad = {s['file']: s.get('sections', {}) for s in corpus['songs'] if s.get('teacher') == 'ca-phao' and s.get('genre') == 'ballad'}
    bai_ballad['Anh Cu Di Di- Ca Phao.mxl'] = {'interlude': {'bars': [33, 37]}, 'outro': {'bars': [62, 68]}}
    ung = []
    for f, sec in bai_ballad.items():
        file = f if os.path.exists(V + f) else f.replace('.mxl', '-da-don.musicxml')
        if not os.path.exists(V + file):
            continue
        data, start, notes = bai(file)
        for ten, v in sec.items():
            if not ten.startswith(SOLO):
                continue
            a0, b0 = (v['bars'] if isinstance(v, dict) else v)
            for o in range(a0, b0):
                if str(o) not in data or str(o + 1) not in data:
                    continue
                events, _ = cat(file, o, o + 1)
                be = [e for e in events if e['hand'] == 'right' and len(e['notes']) == 2 and e['notes'][1] - e['notes'][0] in (5, 7)]
                if len(be) >= 4:
                    ung.append((len(be), file, o, ten, be))
    ung.sort(key=lambda u: -u[0])
    chon, dung = [], {}
    for n, file, o, ten, be in ung:
        if dung.get(file, 0) >= 2 or any(c['_f'] == file and abs(c['_o'] - o) < 2 for c in chon):
            continue
        dung[file] = dung.get(file, 0) + 1
        loai = {'intro': 'dạo', 'interlude': 'giang tấu', 'outro': 'kết', 'coda': 'coda', 'tag': 'đuôi'}[ten.split('_')[0]]
        d = doan(f'be4-{file[:6].lower().replace(" ", "")}-o{o}', f'{TEN_BAI[file]} ô {o}–{o + 1}' + (' (ô thật)' if file in LECH else '') + f' · {loai}',
                 file, o, o + 1, f"{n} cú bè quãng 4/5: " + ' · '.join('+'.join(ten_not(m) for m in e['notes']) for e in be[:4]) + (' …' if n > 4 else ''))
        d.update(_f=file, _o=o)
        chon.append(d)
        if len(chon) == 8:
            break
    for c in chon:
        del c['_f'], c['_o']
    return chon


# ---------- 3. Láy nửa cung (Bossa) ----------
BOSSA = 'nguoihayquenemdi.mxl'


def lay():
    data, start, _ = bai(BOSSA)
    o_lay = sorted(int(b) for b, info in data.items() if int(b) > 0 and any(n['grace'] for n in info['attacks']))
    nhom = []
    for b in o_lay:
        if nhom and nhom[-1][-1] == b - 1 and len(nhom[-1]) < 2:
            nhom[-1].append(b)
        else:
            nhom.append([b])
    ung, da_co = [], set()
    for bars in nhom:
        d = doan(f'lay-o{bars[0]}', f'Ô {bars[0]}' + (f'–{bars[-1]}' if len(bars) > 1 else ''), BOSSA, bars[0], bars[-1], '', giat=True)
        khoa = json.dumps([[e['startBeat'], e['notes'], e['hand']] for e in d['events']])
        if khoa in da_co:
            continue
        da_co.add(khoa)
        that = [e for e in d['events'] if not e.get('grace')]
        chinh_cua = lambda g: next((e for e in that if e['hand'] == g['hand'] and e['startBeat'] >= g['startBeat'] - 1e-6), None)
        # Nốt láy TRÙNG cao độ nốt chính — sheet ghi 2/35 chỗ (ô 37 Đô5 Si♭4 → Si♭4, ô 58 La5 Sol5 → Sol5); trong các đoạn chọn chỉ ô 58
        # (1/26 nốt láy): bỏ nốt láy trùng, giữ nốt láy trên. Phải bấm lại cùng phím trong ~35 ms — tay người không làm được, và
        # `chamLay` sẽ đòi hai lần bấm Sol5. Khi đánh, nốt láy trùng nhập luôn vào nốt chính.
        d['events'] = [e for e in d['events'] if not (e.get('grace') and set(e['notes']) & set(chinh_cua(e)['notes']))]
        d['cuMoiPhach'] = cu_moi_phach(d['events'], d['doDai'])
        graces = [e for e in d['events'] if e.get('grace')]
        mau = []
        for g in graces:
            chinh = chinh_cua(g)
            if chinh:
                mau.append(f"{ten_not(g['notes'][0])}→{ten_not(max(chinh['notes']))}")
        d['ghiChu'] = f'{len(graces)} nốt láy: ' + ' · '.join(mau)
        d['_n'] = len(graces)
        ung.append(d)
    chon = sorted(ung, key=lambda d: -d['_n'])[:8]
    for d in chon:
        del d['_n']
    return chon


def main():
    bo = {'fillCaPhao': fill(), 'beQuang4CaPhao': be_quang_4(), 'layCaPhao': lay()}
    for ten, ds in bo.items():
        ds.sort(key=lambda d: d['cuMoiPhach'])
        print(f'\n== {ten}: {len(ds)} đoạn')
        for d in ds:
            print(f"  {d['ten'][:48]:48} ♩{d['bpm']:4} {d['cuMoiPhach']:5}  {d['ghiChu'][:90]}")
    if '--ghi' in sys.argv:
        files = sorted({f for f in TEMPO if os.path.exists(V + f)})
        sha = hashlib.sha256(b''.join(open(V + f, 'rb').read() for f in files)).hexdigest()[:12]
        for ten, ds in bo.items():
            out = dict(nguon=dict(file='Sheet Cà Pháo (PianoBrain video/Ca_Phao)', sha256=sha, script='scripts/ky_thuat_ca_phao.py'),
                       bpm=ds[0]['bpm'], meter=4, bai=ds)
            with open(OUT + ten + '.json', 'w', encoding='utf-8', newline='\n') as f:
                json.dump(out, f, ensure_ascii=False, indent=1)
                f.write('\n')
            print('đã ghi', OUT + ten + '.json')


if __name__ == '__main__':
    main()

"""Đánh giật kiểu Cà Pháo — cắt NGUYÊN các đoạn có dấu giật (staccato) từ bản chép tay *Người hãy quên em đi*.

python -B scripts/giat_ca_phao.py          # in bảng các đoạn
python -B scripts/giat_ca_phao.py --ghi    # ghi src/thay/kyThuat/giatCaPhao.json

Người dùng 3/10/2026: "đánh giật" = giật ngón (bấm rồi nhấc ngón ngay — dấu staccato) · "tôi chỉ muốn học đánh giật kiểu
Cà Pháo". Bảy sheet ballad của anh là bản máy chép, không mang dấu ký âm nào; Hồng Kông 1 không ghi dấu giật nào. Còn đúng bài
Bossa này: 98 staccato + 1 nhấn mạnh (PianoBrain `tools/sheet/giat_lay.py`).

Chép nguyên mọi nốt hai tay của đoạn — cả nốt láy, nốt nối qua vạch ô. Không sửa nốt nào. Dấu giật ghi trên một nốt của cú thì
cả cú (cùng tay, cùng lúc) là cú giật. Nốt giật VANG một nửa trường độ ghi — cách đọc dấu staccato của Claude, cùng cách bộ soạn
solo CP đọc (gate × .5), chưa đo; trường độ ghi giữ ở `ghiBeats` để chấm lúc nhấc phím.
"""
import hashlib
import json
import sys

from audit_ca_phao import audit

SOURCE = 'D:/PianoBrain/video/Ca_Phao/nguoihayquenemdi.mxl'
OUT = 'src/thay/kyThuat/giatCaPhao.json'
BPM = 107  # dấu nhịp độ ô 1 của sheet
# Mốc đoạn: PianoBrain tools/sheet/corpus.json (người dùng chốt).
DOAN = [('dạo', 1, 8), ('phiên', 9, 24), ('điệp', 25, 40), ('giang tấu', 41, 48), ('phiên', 49, 65), ('điệp', 66, 95),
        ('kết', 96, 104)]
# Đoạn có ≥ 3 cú giật (đếm trên sheet), gộp ô liền nhau thành đoạn 2 ô.
DOAN_TAP = [[8], [16], [24, 25], [29], [43, 44], [45, 46], [70], [79, 80], [96, 97]]
VELOCITY = {1: 76, 2: 68}
GRACE_STEP = 0.0625  # nốt láy đặt sát trước nốt chính, mỗi nốt một móc kép đôi


def ten_doan(bar):
    return next(ten for ten, a, b in DOAN if a <= bar <= b)


def doan_tap(data, bars):
    """Nốt của các ô liền nhau, phách tính từ đầu ô đầu; gộp nốt nối (kể cả qua vạch ô)."""
    notes, offset = [], 0.0
    for bar in bars:
        info = data[str(bar)]
        for n in info['attacks']:
            notes.append(dict(n, at=round(offset + n['at'], 6)))
        offset += info['length']
    joined, active = [], {}
    for n in sorted(notes, key=lambda n: (n['at'], n['grace'] is False)):
        key = (n['hand'], n['voice'], n['midi'])
        prev = active.get(key)
        if 'stop' in n['ties'] and not n['grace']:
            if prev is not None and abs(prev['at'] + prev['dur'] - n['at']) < 1e-6:
                prev['dur'] = round(prev['dur'] + n['dur'], 6)
            # Nối từ ô trước đoạn: tiếng ấy không gõ trong đoạn — bỏ.
        else:
            prev = dict(n)
            joined.append(prev)
        if 'start' in n['ties'] and not n['grace']:
            active[key] = prev
        else:
            active.pop(key, None)
    return joined, offset


def su_kien(notes):
    """Gom thành tiếng của app: cùng tay · cùng lúc · cùng trường độ ghi → một tiếng. Dấu giật lan ra cả cú."""
    giat_cu = {(n['hand'], n['at']) for n in notes if not n['grace']
               and any(a in ('staccato', 'staccatissimo', 'strong-accent') for a in n['articulations'])}
    nhom = {}
    for n in notes:
        if n['grace']:
            continue
        giat = (n['hand'], n['at']) in giat_cu
        nhom.setdefault((n['hand'], n['at'], n['dur'], giat), []).append(n['midi'])
    out = []
    for (hand, at, dur, giat), midis in nhom.items():
        e = dict(notes=sorted(set(midis)), startBeat=at, durationBeats=round(dur / 2, 6) if giat else dur,
                 hand='right' if hand == 1 else 'left', velocity=VELOCITY[hand])
        if giat:
            e.update(giat=True, ghiBeats=dur)
        out.append(e)
    # Nốt láy: sát trước nốt chính cùng tay (nốt thật đầu tiên ở hoặc sau nó).
    graces = [n for n in notes if n['grace']]
    for i, g in enumerate(graces):
        cung_cum = [x for x in graces if x['hand'] == g['hand'] and x['at'] == g['at']]
        k = cung_cum.index(g)
        out.append(dict(notes=[g['midi']], startBeat=round(g['at'] - (len(cung_cum) - k) * GRACE_STEP, 6),
                        durationBeats=GRACE_STEP, hand='right' if g['hand'] == 1 else 'left', velocity=VELOCITY[g['hand']] - 12,
                        grace=True))
    return sorted(out, key=lambda e: (e['startBeat'], e['hand'], e['notes']))


def main():
    data = audit(SOURCE)
    sha = hashlib.sha256(open(SOURCE, 'rb').read()).hexdigest()[:12]
    bai = []
    for bars in DOAN_TAP:
        notes, length = doan_tap(data, bars)
        events = su_kien(notes)
        cu = {(e['hand'], e['startBeat']) for e in events if not e.get('grace')}
        cu_giat = {(e['hand'], e['startBeat']) for e in events if e.get('giat')}
        phai = [k for k in cu if k[0] == 'right']
        ten_o = f'Ô {bars[0]}' if len(bars) == 1 else f'Ô {bars[0]}–{bars[-1]}'
        bai.append(dict(id=f'o{bars[0]}', ten=f'{ten_o} · {ten_doan(bars[0])}', o=bars, doDai=length,
                        soCu=len(cu), soCuGiat=len(cu_giat), giatPhai=sum(1 for k in cu_giat if k[0] == 'right'),
                        cuMoiPhach=round(len(cu) / length, 2), soNotLay=sum(1 for e in events if e.get('grace')),
                        events=events, _phai=len(phai)))
    # Dễ trước: ít cú mỗi phách trước (đo đơn giản — chưa so với cách đo độ khó của tab Điệu).
    bai.sort(key=lambda b: (b['cuMoiPhach'], b['soNotLay']))
    print(f'{"đoạn":24} cú  giật(phải)  cú/phách  nốt láy')
    for b in bai:
        print(f"{b['ten']:24} {b['soCu']:3}  {b['soCuGiat']:3} ({b['giatPhai']:2})   {b['cuMoiPhach']:5}    {b['soNotLay']}")
        del b['_phai']
    print('tổng cú giật', sum(b['soCuGiat'] for b in bai))
    if '--ghi' in sys.argv:
        out = dict(nguon=dict(file='Người hãy quên em đi — bản chép tay MuseScore (PianoBrain video/Ca_Phao/nguoihayquenemdi.mxl)',
                              sha256=sha, script='scripts/giat_ca_phao.py'),
                   bpm=BPM, meter=4, bai=bai)
        with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
            f.write('\n')
        print('đã ghi', OUT)


if __name__ == '__main__':
    main()

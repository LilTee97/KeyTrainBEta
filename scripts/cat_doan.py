"""Cắt NGUYÊN một đoạn sheet thành tiếng của app — dùng chung cho bài tập tab Kỹ thuật đánh (GĐ 2).

Nốt vào là bản ghi của `PianoBrain/tools/sheet/mxl.py` (`notes()`): phách tính từ đầu bài, `tie_start` / `tie_stop`.
- Gộp nốt nối thành một lần gõ (kể cả nối qua vạch ô).
- Lấy mọi lần gõ có lúc bấm trong [a, b); nốt nối từ trước `a` không gõ trong đoạn — bỏ. Nốt ngân quá `b` cắt ở `b`.
- Cùng tay · cùng lúc · cùng độ dài → một tiếng. Không sửa nốt nào.
"""
EPS = 1e-6
VELOCITY = {1: 76, 2: 70}


def gop_noi(ns):
    """Nốt đã gộp nối, bỏ nốt láy (độ dài 0)."""
    out, active = [], {}
    for n in sorted(ns, key=lambda n: (n['beat'], n['hand'], n['midi'])):
        if n['dur'] <= EPS:
            continue
        key = (n['hand'], n.get('voice'), n['midi'])
        prev = active.get(key)
        if n['tie_stop']:
            if prev is not None and abs(prev['beat'] + prev['dur'] - n['beat']) < 1e-4:
                prev['dur'] += n['dur']
            else:
                prev = None
        else:
            prev = dict(n, tu_truoc=False)
            out.append(prev)
        if n['tie_start'] and prev is not None:
            active[key] = prev
        else:
            active.pop(key, None)
    return out


def cat(gop, a, b):
    """Tiếng của app trong [a, b), phách tính từ `a`."""
    nhom = {}
    for n in gop:
        if not (a - EPS <= n['beat'] < b - EPS):
            continue
        dur = min(n['dur'], b - n['beat'])
        nhom.setdefault((n['hand'], round(n['beat'] - a, 4), round(dur, 4)), set()).add(n['midi'])
    return sorted(
        (dict(notes=sorted(ms), startBeat=t, durationBeats=d, hand='right' if h == 1 else 'left', velocity=VELOCITY[h])
         for (h, t, d), ms in nhom.items()),
        key=lambda e: (e['startBeat'], e['hand'], e['notes']),
    )


def cu_moi_phach(events, do_dai):
    """Số lúc gõ (mọi tay) mỗi phách — thước dễ/khó đơn giản, như bài đánh giật."""
    return round(len({(e['hand'], e['startBeat']) for e in events}) / do_dai, 2)


TEN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']


def ten_not(m):
    return f'{TEN[m % 12]}{m // 12 - 1}'

"""Cắt NGUYÊN một đoạn sheet thành tiếng của app — dùng chung cho bài tập tab Kỹ thuật đánh (GĐ 2).

Nốt vào là bản ghi của `PianoBrain/tools/sheet/mxl.py` (`notes()`): phách tính từ đầu bài, `tie_start` / `tie_stop`.
- Gộp nốt nối thành một lần gõ (kể cả nối qua vạch ô).
- Lấy mọi lần gõ có lúc bấm trong [a, b); nốt nối từ trước `a` không gõ trong đoạn — bỏ. Nốt ngân quá `b` cắt ở `b`.
- Cùng tay · cùng lúc · cùng độ dài → một tiếng. Không sửa nốt nào.
"""
EPS = 1e-6
VELOCITY = {1: 76, 2: 70}
GRACE_STEP = 0.0625  # nốt láy đặt sát trước nốt chính, mỗi nốt một móc kép đôi


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


def noi_o(data, bars):
    """Bản ghi `audit_ca_phao.audit` → nốt của các ô liền nhau (kể cả nốt láy), phách tính từ đầu ô đầu; gộp nốt nối (kể cả qua vạch ô)."""
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


def su_kien(notes, giat=True, velocity=VELOCITY):
    """Gom `noi_o` thành tiếng của app: cùng tay · cùng lúc · cùng trường độ ghi → một tiếng. `giat`: dấu giật lan ra cả cú, nốt
    giật vang nửa trường độ ghi (`ghiBeats` giữ trường độ ghi). Nốt láy đặt sát trước nốt chính, mỗi nốt `GRACE_STEP` phách."""
    giat_cu = set() if not giat else {(n['hand'], n['at']) for n in notes if not n['grace']
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
                 hand='right' if hand == 1 else 'left', velocity=velocity[hand])
        if giat:
            e.update(giat=True, ghiBeats=dur)
        out.append(e)
    # Nốt láy: sát trước nốt chính cùng tay (nốt thật đầu tiên ở hoặc sau nó).
    graces = [n for n in notes if n['grace']]
    for i, g in enumerate(graces):
        cung_cum = [x for x in graces if x['hand'] == g['hand'] and x['at'] == g['at']]
        k = cung_cum.index(g)
        out.append(dict(notes=[g['midi']], startBeat=round(g['at'] - (len(cung_cum) - k) * GRACE_STEP, 6),
                        durationBeats=GRACE_STEP, hand='right' if g['hand'] == 1 else 'left', velocity=velocity[g['hand']] - 12,
                        grace=True))
    return sorted(out, key=lambda e: (e['startBeat'], e['hand'], e['notes']))

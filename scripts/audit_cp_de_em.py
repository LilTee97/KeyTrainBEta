"""Để Em Rời Xa (Cà Pháo): đo pha bass và cách hai tay đệm lúc hát. Chỉ đọc sheet.

python -B scripts/audit_cp_de_em.py

Ô THẬT k = [ô XML k offset 1, ô XML k+1 offset 1): vạch nhịp ký âm lệch nhạc một phách.
Nốt đỉnh mỗi cú gõ tay phải = giai điệu; cú "đệm" = nằm dưới nốt giai điệu đang ngân,
hoặc hụt >= 9 nửa cung so với cả hai nốt giai điệu kề bên.
"""
import collections
import hashlib
import sys

from audit_ca_phao import audit
from audit_cp_acdd import joined_attacks

SOURCE = 'D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl'
# Mốc đoạn: PianoBrain tools/sheet/corpus.json (người dùng chốt). Bỏ ô lẻ 10, 11 (2/4, 3/4), 23 (6/4).
SING = {'phien1': [k for k in range(4, 20) if k not in (10, 11)], 'diep1': [k for k in range(20, 28) if k != 23],
        'phien2': list(range(32, 48)), 'diep2': list(range(48, 56)), 'diepNang': list(range(56, 64))}
D = audit(SOURCE, dynamics=True)
L = {k: D[str(k)]['length'] for k in range(74)}


def hands(k):
    g = collections.defaultdict(list)
    for n in joined_attacks(D[str(k)]):
        g[n['hand'], n['at']].append(n)
    return {h: sorted((at, sorted(ns, key=lambda n: n['midi'])) for (hh, at), ns in g.items() if hh == h) for h in (1, 2)}


def real(k):
    out = {1: [], 2: []}
    for h in (1, 2):
        out[h] += [(round(at - 1, 4), ns) for at, ns in hands(k)[h] if at >= 1 - 1e-9]
        if k + 1 < 74:
            out[h] += [(round(at + L[k] - 1, 4), ns) for at, ns in hands(k + 1)[h] if at < 1 - 1e-9]
    return out


def dem(rh):
    tops = [(p, ns[-1]) for p, ns in rh]
    for i, (p, ns) in enumerate(rh):
        top = ns[-1]['midi']
        under = any(q < p < q + t['dur'] - 1e-6 and t['midi'] > top for q, t in tops[:i])
        dip = 0 < i < len(tops) - 1 and tops[i - 1][1]['midi'] - top >= 9 and tops[i + 1][1]['midi'] - top >= 9
        yield p, ns, under or dip


def cover(k, keep_melody):
    """So not dang vang o tung moc kep cua o that k; bo giai dieu = bo not dinh cu tay phai khong phai 'dem'."""
    r, spans = real(k), []
    spans += [(p, p + n['dur']) for p, ns in r[2] for n in ns]
    for p, ns, d in dem(r[1]):
        spans += [(p, p + n['dur']) for j, n in enumerate(ns) if keep_melody or d or j < len(ns) - 1]
    return [sum(a <= s / 4 + .01 < b for a, b in spans) for s in range(int(L[k] * 4))]


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print('sha256', hashlib.sha256(open(SOURCE, 'rb').read()).hexdigest())
    on1 = [k for k in range(1, 71) if any(abs(at - 1) < 1e-9 and ns[0]['midi'] <= 50 for at, ns in hands(k)[2])]
    print('o XML 1-70 co bass (<= D3) o offset 1: %d/70' % len(on1))
    for name, bars in SING.items():
        rh = [x for k in bars for x in dem(real(k)[1])]
        print('%-8s o=%2d  cu go RH=%3d  dem=%d  co be duoi=%d' % (
            name, len(bars), len(rh), sum(d for *_, d in rh), sum(len(ns) >= 2 for _, ns, _ in rh)))
    for group, keys in (('phien', ['phien1', 'phien2']), ('diep', ['diep1', 'diep2', 'diepNang'])):
        lh, rh, be = collections.Counter(), collections.Counter(), collections.Counter()
        bars = [k for key in keys for k in SING[key] if L[k] == 4]
        for k in bars:
            r = real(k)
            for p, _ in r[2]: lh[round(p * 4)] += 1
            for p, ns in r[1]: rh[round(p * 4)] += 1; be[round(p * 4)] += len(ns) >= 2
        print('%s (%d o 4 phach) vi tri: LH go | RH co be/RH go' % (group, len(bars)))
        print('  ' + '  '.join('%g:%d|%d/%d' % (i / 4, lh[i], be[i], rh[i]) for i in range(16)))
    for group, keys in (('phien', ['phien1', 'phien2']), ('diep', ['diep1', 'diep2', 'diepNang'])):
        bars = [k for key in keys for k in SING[key] if L[k] == 4]
        for mel in (True, False):
            c = [x for k in bars for x in cover(k, mel)]
            print('do phu %s %s: moc kep=%d im=%d not vang TB=%.2f <=1 not=%d' % (
                group, 'du hai tay' if mel else 'bo giai dieu', len(c), c.count(0), sum(c) / len(c), sum(x <= 1 for x in c)))
    c = cover(4, True) + cover(5, True)
    print('do phu cua so 4-5 du hai tay: im=%d TB=%.2f' % (c.count(0), sum(c) / len(c)))
    for k in (4, 5, 8, 9, 32, 33, 36, 37, 24, 25, 52, 53):
        r = real(k)
        print('o that %d  L %s' % (k, ' '.join('%g:%s(%g)' % (p, '/'.join(n['pitch'] for n in ns), ns[0]['dur']) for p, ns in r[2])))
        print('         R %s' % ' '.join('%g:%s%s' % (p, '/'.join(n['pitch'] for n in ns), '*' if d else '') for p, ns, d in dem(r[1])))


if __name__ == '__main__':
    main()

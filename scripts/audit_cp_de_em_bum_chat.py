"""Để Em Rời Xa (Cà Pháo): phiên khúc đọc theo tai người dùng — ở mỗi mốc móc kép, tiếng THẤP (chỉ tay trái),
tiếng CAO (chỉ tay phải) hay CẢ HAI TAY; mỗi tay mấy nốt; ngân bao lâu. Chỉ đọc sheet.

python -B scripts/audit_cp_de_em_bum_chat.py

Ô thật k = [ô XML k offset 1, ô XML k+1 offset 1) (vạch nhịp ký âm lệch một phách — xem audit_cp_de_em.py).
"""
import collections
import sys

from audit_cp_de_em import L, SING, real

PHIEN = [k for key in ('phien1', 'phien2') for k in SING[key] if L[k] == 4]


def grid(k):
    r = real(k)
    cell = {}
    for h, name in ((2, 'T'), (1, 'P')):
        for p, ns in r[h]:
            s = round(p * 4)
            if 0 <= s < 16:
                cell.setdefault(s, {})[name] = ns
    return cell


def kind(c):
    return ('T' if 'T' in c else '') + ('P' if 'P' in c else '')


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    count = collections.Counter()
    notes = collections.defaultdict(collections.Counter)
    for k in PHIEN:
        for s, c in grid(k).items():
            count[s, kind(c)] += 1
            for h in c:
                notes[s, h][len(c[h])] += 1
    print('phiên khúc: %d ô thật đủ 4 phách' % len(PHIEN))
    print('mốc  | chỉ trái (thấp) | chỉ phải (cao) | hai tay | trống | số nốt tay trái | số nốt tay phải')
    for s in range(16):
        n = {t: count[s, t] for t in ('T', 'P', 'TP')}
        print('%-4g | %15d | %14d | %7d | %5d | %s | %s' % (
            s / 4, n['T'], n['P'], n['TP'], len(PHIEN) - sum(n.values()),
            dict(sorted(notes[s, 'T'].items())), dict(sorted(notes[s, 'P'].items()))))
    for k in (4, 5, 6, 7, 8, 9, 32, 33, 34, 35, 36, 37):
        print('\nô thật %d' % k)
        for s, c in sorted(grid(k).items()):
            print('  %-5g %-3s T %-22s P %s' % (s / 4, kind(c),
                  ' '.join('%s(%g)' % (n['pitch'], n['dur']) for n in c.get('T', [])),
                  ' '.join('%s(%g)' % (n['pitch'], n['dur']) for n in c.get('P', []))))


if __name__ == '__main__':
    main()

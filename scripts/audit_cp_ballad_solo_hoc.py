"""Cà Pháo — solo BALLAD (dạo · giang · kết): cách chọn nốt, cách đặt hợp âm, kỹ thuật. Chỉ đọc dữ liệu.

python -X utf8 -B scripts/audit_cp_ballad_solo_hoc.py

Nguồn: src/reharm/style/cpBalladSolos.json (Codex trích từ MusicXML, tools/cp_ballad_solos.py; Để Em Rời Xa đã nắn
về vạch nhịp thật 26/9/2026). Chỉ 20 đoạn đã rõ giọng; Kém duyên · Yêu xa (chưa rõ giọng) bị loại.
Nốt đỉnh = nốt cao nhất của mỗi cú tay phải (cụm nhiều nốt cùng lúc tính một cú).
"""
import collections
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'src/reharm/style/cpBalladSolos.json').read_text(encoding='utf8'))['sections']
TEN = {0: '1', 1: 'b9', 2: '9', 3: 'b3', 4: '3', 5: '11', 6: '#11/b5', 7: '5', 8: 'b13/#5', 9: '13/6', 10: 'b7', 11: '7'}
LA_MA = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']  # gốc hợp âm so với chủ âm
# Nốt của hợp âm theo đuôi (bậc so với gốc). Đuôi lạ → chỉ lấy tam âm theo chất.
TRIAD = {'': {0, 4, 7}, 'm': {0, 3, 7}}


def tones_of(suffix):
    s = suffix
    base = {0, 3, 7} if s.startswith('m') and not s.startswith('maj') else {0, 4, 7}
    if 'sus4' in s: base = {0, 5, 7}
    if 'sus2' in s: base = {0, 2, 7}
    if 'dim' in s: base = {0, 3, 6}
    if 'aug' in s or '#5' in s: base = {0, 4, 8}
    if 'maj7' in s or 'maj9' in s: base |= {11}
    elif '7' in s or '9' in s or '11' in s or '13' in s: base |= {10}
    if '9' in s or 'add9' in s or '2' in s: base |= {2}
    if '6' in s or '13' in s: base |= {9}
    return base


def chord_at(sec, at):
    h = [h for h in sec['harmony'] if h['at'] <= at + 1e-6]
    return h[-1] if h else sec['harmony'][0]


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    secs = [s for s in DATA if s['mode'] != 'unknown' and s['harmony']]
    print('đoạn đã rõ giọng: %d  (%s)' % (len(secs), ', '.join(sorted({s['song'] for s in secs}))))

    # 1. BẬC NỐT ĐỈNH TAY PHẢI so với gốc hợp âm đang vang — phách mạnh (nguyên phách) vs yếu
    deg = {k: collections.Counter() for k in ('manh', 'yeu')}
    chordtone = {k: [0, 0] for k in ('manh', 'yeu')}
    ngoai_giai = collections.Counter()  # nốt ngoài hợp âm → nốt kế đi thế nào
    for s in secs:
        right = [e for e in s['events'] if e['hand'] == 'right']
        for i, e in enumerate(right):
            top = max(e['tones'])
            h = chord_at(s, e['at'])
            iv = (top - h['root']) % 12
            k = 'manh' if abs(e['at'] - round(e['at'])) < 1e-6 else 'yeu'
            deg[k][TEN[iv]] += 1
            inside = iv in tones_of(h['suffix'])
            chordtone[k][0] += inside
            chordtone[k][1] += 1
            if not inside and i + 1 < len(right):
                nxt = right[i + 1]
                step = max(nxt['tones']) - top
                hn = chord_at(s, nxt['at'])
                ok = (max(nxt['tones']) - hn['root']) % 12 in tones_of(hn['suffix'])
                kind = ('liền bậc ' + ('lên' if step > 0 else 'xuống') if 1 <= abs(step) <= 2 else
                        'đứng' if step == 0 else 'nhảy')
                ngoai_giai['%s → %s' % (kind, 'nốt hợp âm' if ok else 'nốt ngoài')] += 1
    for k, name in (('manh', 'phách nguyên'), ('yeu', 'giữa phách')):
        n = sum(deg[k].values())
        print('\nnốt đỉnh %s: %d cú · nốt hợp âm %d/%d (%.0f%%)' % (name, n, *chordtone[k], 100 * chordtone[k][0] / chordtone[k][1]))
        print('   ' + '  '.join('%s %d%%' % (d, round(100 * c / n)) for d, c in deg[k].most_common()))
    print('\nnốt đỉnh ngoài hợp âm, nốt kế: ' + '  '.join('%s %d' % kv for kv in ngoai_giai.most_common()))

    # 2. HỢP ÂM: vòng, số hợp âm mỗi ô, màu
    print('\nHỢP ÂM (bậc so với chủ âm):')
    mau = collections.Counter()
    for s in secs:
        roman = ['%s%s@%g' % (LA_MA[h['root']], h['suffix'], h['at']) for h in s['harmony']]
        n_bars = sum(1 for b in s['bars'] if b['length'] == 4)
        print('  %-26s %-9s %-5s %2d ô, %2d hợp âm: %s' % (s['song'][:26], s['kind'], s['mode'], n_bars, len(s['harmony']),
              ' '.join(r.split('@')[0] for r in roman)[:150]))
        for h in s['harmony']:
            mau[h['suffix'] or '(trưởng)'] += 1
    print('  màu: ' + '  '.join('%s %d' % kv for kv in mau.most_common()))

    # 3. KỸ THUẬT theo loại đoạn
    print('\nKỸ THUẬT (tay phải; một cú = một thời điểm):')
    tong = collections.defaultdict(collections.Counter)
    for s in secs:
        right = [e for e in s['events'] if e['hand'] == 'right']
        left = [e for e in s['events'] if e['hand'] == 'left' and not e['carry']]
        c = tong[s['kind']]
        c['đoạn'] += 1
        c['cú phải'] += len(right)
        c['phách'] += s['end'] - s['start']
        for e in right:
            t = sorted(e['tones'])
            gaps = {b - a for a, b in zip(t, t[1:])}
            c['quãng tám'] += any(x + 12 in t for x in t)
            c['bè quãng 3/6'] += len(t) == 2 and (t[1] - t[0]) in (3, 4, 8, 9)
            c['cụm ≥3 nốt'] += len(t) >= 3
            c['cụm có quãng 2'] += len(t) >= 2 and bool(gaps & {1, 2})
            c['móc kép lẻ'] += abs(e['at'] * 2 - round(e['at'] * 2)) > 1e-6
            c['chùm ba'] += abs(e['at'] * 4 - round(e['at'] * 4)) > 1e-6
            c['tay trái cùng lúc'] += any(abs(l['at'] - e['at']) < 1e-6 for l in left)
        tops = [max(e['tones']) for e in right]
        steps = [b - a for a, b in zip(tops, tops[1:])]
        c['bước nửa cung'] += sum(abs(x) == 1 for x in steps)
        c['bước ≤ 2'] += sum(1 <= abs(x) <= 2 for x in steps)
        c['nhảy ≥ quãng 5'] += sum(abs(x) >= 7 for x in steps)
        c['bước'] += len(steps)
        c['tay trái đáp dưới tay phải ngân'] += sum(any(r['at'] < l['at'] - 1e-6 and r['at'] + max(r['gates']) > l['at'] + 1e-6
                                                       for r in right) for l in left)
        c['cú trái'] += len(left)
    cols = ['đoạn', 'phách', 'cú phải', 'quãng tám', 'bè quãng 3/6', 'cụm ≥3 nốt', 'cụm có quãng 2', 'móc kép lẻ', 'chùm ba',
            'tay trái cùng lúc', 'cú trái', 'tay trái đáp dưới tay phải ngân']
    for kind in ('intro', 'interlude', 'outro'):
        c = tong[kind]
        print('  %-9s ' % kind + ' · '.join('%s %g' % (k, round(c[k], 1)) for k in cols))
        print('            cú phải/phách %.2f · bước nửa cung %d/%d · bước ≤2 nửa cung %d%% · nhảy ≥ quãng 5 %d%%' % (
            c['cú phải'] / c['phách'], c['bước nửa cung'], c['bước'], 100 * c['bước ≤ 2'] / c['bước'],
            100 * c['nhảy ≥ quãng 5'] / c['bước']))

    # 4. TẦM ÂM nốt đỉnh (MIDI tuyệt đối = tones + tonic)
    print('\nTẦM nốt đỉnh tay phải (MIDI):')
    for kind in ('intro', 'interlude', 'outro'):
        tops = sorted(max(e['tones']) + s['tonic'] for s in secs if s['kind'] == kind for e in s['events'] if e['hand'] == 'right')
        q = lambda f: tops[int(f * (len(tops) - 1))]
        print('  %-9s n=%d  thấp %d · tứ phân 1 %d · trung vị %d · tứ phân 3 %d · cao %d' % (kind, len(tops), tops[0], q(.25), q(.5), q(.75), tops[-1]))


if __name__ == '__main__':
    main()

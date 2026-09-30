"""Cà Pháo NỐI HỢP ÂM thế nào — đo ở MỌI chỗ đổi hợp âm trong các sheet ballad (30/9/2026, cho câu fill Ballad cứ đi).

python -B scripts/audit_cp_noi_hop_am.py            # bảng tổng + ví dụ
python -B scripts/audit_cp_noi_hop_am.py --vi 12    # in 12 ví dụ mỗi loại

Chỗ đổi hợp âm = ký hiệu hợp âm in trên sheet đổi (gốc / loại / bass), ký hiệu trải ô (ô không ghi = hợp âm đang vang).
Ở mỗi chỗ đổi t (A → B), xét PHÁCH CUỐI trước t — [t−1, t):
- BASS: nốt thấp nhất của cú tay trái cuối trước t, so với gốc (bass) của B: +1 = đi nửa cung từ trên xuống, −1 = từ dưới lên,
  ±2 = liền bậc, 0 = đã về gốc B, 7 = bậc 5 của B; và nốt ấy có phải nốt hợp âm A không ("ngầm" = không — nốt lướt / hợp âm ngầm).
- HỢP ÂM LƯỚT GHI: A dài ≤ 1 phách, hoặc A là 7 trội / giảm đứng ngay trước B, gốc cách gốc B +1 (bII7), +7 (V7 của B), −1 (vii°).
- TAY TRÁI CHẠY: ≥ 3 cú tay trái trong phách cuối.
- TAY PHẢI: nốt đỉnh cú tay phải cuối trước t là nốt chung A/B · nốt của B (vào sớm) · nốt của A · nốt ngoài; và có đi liền bậc
  (≤ 2 nửa cung) tới nốt đỉnh đầu tiên của B trong ½ phách không.
PHA: bass cú đầu ở t trùng gốc (bass) in của B — sheet lệch vạch (Để Em Rời Xa) thì tỉ lệ này thấp, số của bài ấy phải đọc thận trọng.
"""
import argparse
import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, 'D:/PianoBrain/tools/sheet')
from audit_ca_phao import audit  # noqa: E402
from audit_cp_acdd import joined_attacks  # noqa: E402
import bac_not  # noqa: E402

PC = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
N = 'C Db D Eb E F Gb G Ab A Bb B'.split()
KIND = {
    'major': [0, 4, 7], 'minor': [0, 3, 7], 'dominant': [0, 4, 7, 10], 'major-seventh': [0, 4, 7, 11],
    'minor-seventh': [0, 3, 7, 10], 'diminished': [0, 3, 6], 'diminished-seventh': [0, 3, 6, 9],
    'half-diminished': [0, 3, 6, 10], 'augmented': [0, 4, 8], 'suspended-fourth': [0, 5, 7], 'suspended-second': [0, 2, 7],
    'major-minor': [0, 3, 7, 11], 'dominant-ninth': [0, 4, 7, 10, 2], 'major-ninth': [0, 4, 7, 11, 2],
    'minor-ninth': [0, 3, 7, 10, 2], 'major-sixth': [0, 4, 7, 9], 'minor-sixth': [0, 3, 7, 9], 'dominant-11th': [0, 4, 7, 10, 5],
    'dominant-13th': [0, 4, 7, 10, 9], 'power': [0, 7], 'augmented-seventh': [0, 4, 8, 10], 'minor-11th': [0, 3, 7, 10, 5],
}
nm = lambda n: N[n % 12] + str(n // 12 - 1)


def pcn(name):
    return (PC[name[0]] + name.count('#') - name.count('b')) % 12


def tones(ch):
    kind = ch['kind'] or 'major'
    iv = KIND.get(kind) or (KIND['minor'] if 'minor' in kind else KIND['dominant'] if 'dominant' in kind else KIND['major'])
    return {(ch['root'] + i) % 12 for i in iv}


def songs():
    corpus = json.loads(Path('D:/PianoBrain/tools/sheet/corpus.json').read_text(encoding='utf-8'))
    out = [(s['name'], bac_not.tim_file(s), s.get('sections', {})) for s in corpus['songs']
           if s.get('teacher') == 'ca-phao' and s.get('genre') == 'ballad']
    out.append(('Anh Cu Di Di', 'D:/PianoBrain/video/Ca_Phao/Anh Cu Di Di- Ca Phao.mxl',
                {'intro': [0, 0], 'verse': [1, 32], 'interlude': [33, 37], 'verse_2': [38, 61], 'outro': [62, 68]}))
    return [s for s in out if s[1]]


def measure(name, path, sections):
    data = audit(path)
    bars = sorted(data, key=int)
    start, t = {}, 0.0
    for b in bars:
        start[b] = t
        t += data[b]['length']
    hat = set()
    for sec, v in sections.items():
        lo, hi = v['bars'] if isinstance(v, dict) else v
        if sec not in ('intro', 'interlude', 'outro', 'coda', 'tag'):
            hat.update(range(lo, hi + 1))
    segs, notes = [], []
    for b in bars:
        for h in data[b]['harmony']:
            ch = dict(at=start[b] + h['at'], root=pcn(h['root']), kind=h['kind'],
                      bass=pcn(h['bass']) if h['bass'] else None, bar=int(b), name=h['root'] + (h.get('text') or h['kind'] or ''))
            if segs and (segs[-1]['root'], segs[-1]['kind'], segs[-1]['bass']) == (ch['root'], ch['kind'], ch['bass']):
                continue
            segs.append(ch)
        for n in joined_attacks(data[b]):
            notes.append(dict(at=start[b] + n['at'], hand=n['hand'], midi=n['midi'], bar=int(b)))
    rows = []
    for a, b in zip(segs, segs[1:]):
        t = b['at']
        broot = b['bass'] if b['bass'] is not None else b['root']
        w = [n for n in notes if t - 1 - 1e-6 <= n['at'] < t - 1e-6]
        lh = sorted({n['at'] for n in w if n['hand'] == 2})
        rh = sorted({n['at'] for n in w if n['hand'] == 1})
        after_l = [n['midi'] for n in notes if n['hand'] == 2 and t - 1e-6 <= n['at'] < t + .5 - 1e-6]
        after_r = sorted({n['at'] for n in notes if n['hand'] == 1 and t - 1e-6 <= n['at'] < t + .5 - 1e-6})
        row = dict(song=name, bar=b['bar'], hat=b['bar'] in hat, A=a['name'], B=b['name'], dA=round(t - a['at'], 3),
                   pha=bool(after_l) and min(after_l) % 12 == broot)
        rel = lambda p: (p - broot) % 12
        if lh:
            last = min(n['midi'] for n in w if n['hand'] == 2 and n['at'] == lh[-1])
            row['bass'] = {1: '+1 (nửa cung trên)', 11: '−1 (nửa cung dưới)', 2: '+2', 10: '−2', 0: 'gốc B', 7: 'bậc 5 B'}.get(rel(last), 'khác')
            row['bass_ngam'] = last % 12 not in tones(a) and (a['bass'] is None or last % 12 != a['bass'])
            row['lh_chay'] = len(lh) >= 3
            row['lh'] = ' '.join(nm(min(n['midi'] for n in w if n['hand'] == 2 and n['at'] == x)) for x in lh)
        # Hợp âm lướt NGẦM trong 2 phách cuối của A (bass tay trái là nốt ngoài hợp âm A):
        # bII7 của B (bass nửa cung trên gốc B, kèm bậc 3/7 của nó) · bII7 của A (hàng xóm trên, rồi về lại A) ·
        # V7 của B đảo, bass là nốt cảm âm (nửa cung dưới gốc B, kèm bậc 5/9/11 của B = nốt của V7).
        w2 = [n for n in notes if max(a['at'], t - 2) - 1e-6 <= n['at'] < t - 1e-6]
        ta = tones(a)
        loai = set()
        for x in sorted({n['at'] for n in w2 if n['hand'] == 2}):
            lo = min(n['midi'] for n in w2 if n['hand'] == 2 and n['at'] == x)
            if lo % 12 in ta or (a['bass'] is not None and lo % 12 == a['bass']):
                continue
            cung = {n['midi'] % 12 for n in w2 if abs(n['at'] - x) <= .26}
            for goc, ten in ((broot, 'bII7→B'), (a['root'], 'bII7 hàng xóm A')):
                r = (goc + 1) % 12
                if lo % 12 == r and cung & {(r + 4) % 12, (r + 10) % 12}:
                    loai.add(ten)
            if lo % 12 == (broot + 11) % 12 and cung & {(broot + 7) % 12, (broot + 2) % 12, (broot + 5) % 12}:
                loai.add('V7/B bass cảm âm')
        lows = [min(n['midi'] for n in notes if n['hand'] == 2 and n['at'] == x)
                for x in sorted({n['at'] for n in notes if n['hand'] == 2 and t - 1.25 - 1e-6 <= n['at'] < t - 1e-6})]
        if len(lows) >= 3 and all(0 < abs(q - p) <= 2 for p, q in zip(lows[-3:], lows[-2:])) and after_l \
                and min((min(after_l) - lows[-1]) % 12, (lows[-1] - min(after_l)) % 12) <= 2:
            loai.add('bass đi nửa cung/liền bậc ≥ 3 nốt')
        row['ngam'] = sorted(loai)
        rel_a = (a['root'] - b['root']) % 12
        dom = 'dominant' in (a['kind'] or '') or 'diminished' in (a['kind'] or '')
        row['luot_ghi'] = (a['at'] > 0 and t - a['at'] <= 1.01) or (dom and rel_a in (1, 7, 11) and t - a['at'] <= 2.01)
        row['luot_loai'] = {1: 'bII', 7: 'V/B', 11: 'vii/B'}.get(rel_a, '') if dom else ''
        if rh and after_r:
            top = max(n['midi'] for n in w if n['hand'] == 1 and n['at'] == rh[-1])
            top2 = max(n['midi'] for n in notes if n['hand'] == 1 and n['at'] == after_r[0])
            ta, tb = tones(a), tones(b)
            p = top % 12
            row['rh'] = 'chung' if p in ta and p in tb else 'vào sớm' if p in tb else 'hợp âm cũ' if p in ta else 'ngoài'
            row['rh_lien'] = 0 < abs(top2 - top) <= 2
        rows.append(row)
    return rows


def pct(k, n):
    return f'{k}/{n} ({100 * k / max(1, n):.0f}%)'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vi', type=int, default=6)
    args = ap.parse_args()
    allrows = []
    for name, path, sections in songs():
        rows = measure(name, path, sections)
        allrows += rows
        ok = [r for r in rows if r['pha']]
        print(f'{name}: {len(rows)} chỗ đổi, pha đúng {pct(len(ok), len(rows))}')
    good = {r['song'] for r in allrows} - {s for s in {r['song'] for r in allrows}
                                           if sum(r['pha'] for r in allrows if r['song'] == s) < .6 * sum(r['song'] == s for r in allrows)}
    print('Bài pha đúng ≥ 60% (dùng để tổng):', sorted(good))
    for nhan, sel in (('PHẦN HÁT', lambda r: r['hat']), ('ĐOẠN ĐÀN', lambda r: not r['hat'])):
        rows = [r for r in allrows if r['song'] in good and sel(r)]
        print(f'\n== {nhan}: {len(rows)} chỗ đổi hợp âm')
        withlh = [r for r in rows if 'bass' in r]
        print(' bass cú tay trái cuối trước chỗ đổi (n =', len(withlh), '):',
              dict(collections.Counter(r['bass'] for r in withlh).most_common()))
        ngam = [r for r in withlh if r['bass_ngam']]
        print(' bass là nốt NGOÀI hợp âm A (nốt lướt / hợp âm ngầm):', pct(len(ngam), len(withlh)),
              dict(collections.Counter(r['bass'] for r in ngam).most_common()))
        print(' tay trái chạy ≥ 3 cú trong phách cuối:', pct(sum(r['lh_chay'] for r in withlh), len(withlh)))
        ng = collections.Counter(x for r in rows for x in r['ngam'])
        print(' hợp âm lướt / bass dẫn NGẦM trong nốt (2 phách cuối):', pct(sum(bool(r['ngam']) for r in rows), len(rows)), dict(ng))
        for s in sorted({r['song'] for r in rows}):
            rs = [r for r in rows if r['song'] == s]
            print(f'   {s}: {pct(sum(bool(r["ngam"]) for r in rs), len(rs))}',
                  dict(collections.Counter(x for r in rs for x in r['ngam'])))
        luot = [r for r in rows if r['luot_ghi']]
        print(' hợp âm lướt GHI ký hiệu (A ≤ 1 phách, hoặc 7 trội/giảm bII · V/B · vii/B ≤ 2 phách):', pct(len(luot), len(rows)),
              dict(collections.Counter(r['luot_loai'] or 'ngắn' for r in luot)))
        wr = [r for r in rows if 'rh' in r]
        print(' tay phải cú cuối (n =', len(wr), '):', dict(collections.Counter(r['rh'] for r in wr).most_common()),
              '· đi liền bậc vào nốt đầu B:', pct(sum(r['rh_lien'] for r in wr), len(wr)))
    print('\n== VÍ DỤ (bài pha đúng)')
    for title, sel in (('bass nửa cung ngầm', lambda r: r.get('bass_ngam') and r.get('bass', '').startswith(('+1', '−1'))),
                       ('bass liền bậc ngầm', lambda r: r.get('bass_ngam') and r.get('bass') in ('+2', '−2')),
                       ('hợp âm lướt ghi', lambda r: r['luot_ghi']),
                       ('bII7 ngầm → B', lambda r: 'bII7→B' in r['ngam']),
                       ('bII7 hàng xóm A', lambda r: 'bII7 hàng xóm A' in r['ngam']),
                       ('V7/B bass cảm âm', lambda r: 'V7/B bass cảm âm' in r['ngam']),
                       ('bass đi ≥ 3 nốt', lambda r: 'bass đi nửa cung/liền bậc ≥ 3 nốt' in r['ngam']),
                       ('tay trái chạy', lambda r: r.get('lh_chay'))):
        ex = [r for r in allrows if r['song'] in good and sel(r)][:args.vi]
        print(f' {title}:')
        for r in ex:
            print(f"   {r['song']} ô{r['bar']} {'hát' if r['hat'] else 'đàn'}: {r['A']}({r['dA']:g}) → {r['B']} · tay trái {r.get('lh', '-')}"
                  f" · tay phải {r.get('rh', '-')}")


if __name__ == '__main__':
    main()

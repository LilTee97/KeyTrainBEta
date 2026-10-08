"""Màu hợp âm nằm ở đâu — tay trái · bè giữa tay phải · nốt trên cùng — và tay trái bấm hình gì. Phần hát, bỏ đoạn chuyển giọng.
So hai thầy CÙNG một cách đo; số trích vào KeyTrain `src/thay/soanCau/giaiThich.ts` (khối Cà Pháo) và md Cà Pháo mục "Ai chọn hợp âm".

    python tools/cho_dat_mau.py ca-phao      # in bảng
    python tools/cho_dat_mau.py --kiem       # tự kiểm số đã trích (Cà Pháo + Linh Nhi)

Định nghĩa: "bè giữa" = nốt tay phải dưới nốt trên cùng cùng lúc gõ, không tính quãng tám của nốt trên cùng. Một màu "có" trong đoạn
khi chiếm ≥ 8 % thời lượng nốt đệm (`ly_do_hop_am_linh_nhi.not_dem`) hay nằm ở nốt trên cùng. Hình tay trái = các quãng tính từ nốt
thấp nhất tay trái gõ trong nửa đầu đoạn (đoạn có ≥ 2 nốt tay trái khác nhau).
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import hop_am_linh_nhi as H  # noqa: E402
import ly_do_hop_am_linh_nhi as L  # noqa: E402
import tach_lua_chon as T  # noqa: E402

S = H.S
EPS = 1e-6
TEN = {10: '♭7', 11: 'maj7', 2: '9', 9: '6', 5: '11', 6: '♯11', 1: '♭9', 8: '♭13'}


def do(thay):
    corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
    cho = collections.defaultdict(collections.Counter)  # màu → chỗ ('trai+giua+tren' …) → số đoạn
    hinh, r = collections.Counter(), collections.Counter()
    for s in corp['songs']:
        if s.get('teacher') != thay:
            continue
        if not s.get('giong') and s['name'] in T.GIONG_SUY:
            s = dict(s, giong=T.GIONG_SUY[s['name']])
        try:
            _, _, _, segs = H.doan_hat(s)
        except KeyError:  # bài không ghi giọng, chưa suy giọng — chưa vào
            continue
        ns, _, _ = S.doc(s)
        for x in segs:
            if x['doan'].endswith('_mod'):
                continue
            a, b, g, q = x['a'], x['b'], x['goc'], x['q']
            trai = {(n['midi'] - g) % 12 for n, _ in H.not_vang(ns, a, b, 2)}
            moc = collections.defaultdict(list)
            for n in ns:
                if n['hand'] == 1 and n['dur'] > EPS and a - EPS <= n['beat'] < b - EPS:
                    moc[round(n['beat'], 3)].append(n['midi'])
            top, giua, cum = set(), set(), False
            ba = 3 if q == 'm' else 4
            for v in moc.values():
                t = max(v)
                top.add((t - g) % 12)
                duoi = [m for m in v if (t - m) % 12]
                giua |= {(m - g) % 12 for m in duoi}
                cum |= q in ('M', 'm', '7') and any((m - g) % 12 == 2 and m + ba - 2 in v for m in duoi)
            dm = L.not_dem(ns, a, b)
            tong = sum(d for _, d in dm) or 1
            w = collections.Counter()
            for n, d in dm:
                w[(n['midi'] - g) % 12] += d
            co = {iv for iv in TEN if w[iv] >= 0.08 * tong or iv in top}
            for iv in co:
                if (iv == 5 and q.startswith('sus')) or (iv == 6 and q == 'dim') or (iv == 8 and q == 'aug'):
                    continue
                o = ('trai' if iv in trai else '') + ('+giua' if iv in giua else '') + ('+tren' if iv in top else '')
                cho[TEN[iv]][o.strip('+') or '?'] += 1
            if q == 'm':
                r['thu'] += 1
                r['thu_b7'] += 10 in co
            if q in ('M', 'm', '7') and 2 in giua:
                r['9_giua'] += 1
                r['cum_9_3'] += cum
            lt = sorted({n['midi'] for n in ns if n['hand'] == 2 and n['dur'] > EPS and a - EPS <= n['beat'] < a + (b - a) / 2})
            if len(lt) >= 2:
                r['hinh'] += 1
                hinh[tuple(sorted({(m - lt[0]) % 12 for m in lt}))] += 1
    return cho, hinh, r


def tom(cho, hinh, r):
    """Các số trích ra: (♭7 ở bè giữa, đoạn có ♭7), (9 ở bè giữa, 9 ở tay trái, đoạn có 9), (hợp âm ba đủ, đoạn có hình), (thứ có ♭7, đoạn
    thứ), (cụm 9–3, đoạn có 9 ở bè giữa)."""
    n = lambda ten, k: sum(v for o, v in cho[ten].items() if k in o)  # noqa: E731
    return ((n('♭7', 'giua'), sum(cho['♭7'].values())), (n('9', 'giua'), n('9', 'trai'), sum(cho['9'].values())),
            (hinh[(0, 4, 7)] + hinh[(0, 3, 7)], r['hinh']), (r['thu_b7'], r['thu']), (r['cum_9_3'], r['9_giua']))


def kiem():
    # Số trên thẻ Cà Pháo (giaiThich.ts, nguyên tắc "Màu nằm trong tay phải" và bậc 1) và md Cà Pháo — đổi thì sửa cả hai nơi.
    # Cụm 9–3: bản nháp đầu (7/10) tính cả nốt nhân quãng tám của nốt trên cùng là "bè dưới" → 30/106 · 13/51; nay theo định nghĩa
    # bè giữa chung → 30/88 · 13/43. Kết luận như cũ: hai thầy ngang nhau.
    assert tom(*do('ca-phao')) == ((145, 248), (88, 88, 238), (42, 350), (140, 172), (30, 88)), tom(*do('ca-phao'))
    assert tom(*do('linh-nhi')) == ((27, 253), (40, 148, 274), (196, 638), (137, 302), (13, 43)), tom(*do('linh-nhi'))
    print('kiem: dung het')


if __name__ == '__main__':
    if '--kiem' in sys.argv:
        kiem()
    else:
        cho, hinh, r = do(sys.argv[1] if len(sys.argv) > 1 else 'ca-phao')
        for ten, c in cho.items():
            print(f'{ten:5s}', sum(c.values()), dict(c.most_common()))
        B = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7']
        print('\nhình tay trái (nửa đầu đoạn):', r['hinh'], 'đoạn')
        for k, v in hinh.most_common(10):
            print(f'  {v:3d}  ' + ' – '.join(B[i] for i in k))
        print('\ntóm:', tom(cho, hinh, r))

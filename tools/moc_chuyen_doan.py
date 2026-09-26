# -*- coding: utf-8 -*-
"""Moc chuyen doan trong MOI sheet co chia doan (PianoBrain corpus): lang bao nhieu not den truoc vach dau doan moi.

    python tools/moc_chuyen_doan.py          # ca hai tay
    python tools/moc_chuyen_doan.py --trai   # rieng tay trai (tieng dem)

Vach = o dau cua doan (luoi dung cua tung bai: slow rock theo LUOI 6/8; De Em Roi Xa lech ky am 1 phach). Lay moi not
bat dau trong 4 not den truoc vach, do tu luc not cuoi tat toi vach. Nut "Mac dinh" o moc chuyen doan cua KeyTrain
(`NGHI_MAC_DINH`, sectionStyles.ts) dat theo so nay — 26/9/2026: moi thay im 0.
"""
import sys, json, os, statistics, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import slow_rock_linh_nhi as S

TRAI = '--trai' in sys.argv

EPS = 1e-6
corp = json.load(open(os.path.join(S.BRAIN, 'tools', 'sheet', 'corpus.json'), encoding='utf-8'))
items = corp if isinstance(corp, list) else corp.get('songs') or list(corp.values())
PHASE = {'De Em': 1.0}
nhom = collections.defaultdict(list)
for song in items:
    try:
        ns, meta, _ = S.doc(song)
    except Exception as e:
        print('!!', song['name'], e); continue
    secs = sorted(song['sections'].items(), key=lambda kv: kv[1]['bars'][0])
    phase = next((v for k, v in PHASE.items() if song['file'].startswith(k) or song['name'].startswith(k)), 0.0)
    ra = []
    for i, (ten, v) in enumerate(secs):
        if i == 0:
            continue
        a = v['bars'][0]
        if song['name'] in S.LUOI:
            try:
                o = S.o_cua_doan(song, meta, ten)
            except KeyError:
                o = None
            if not o:
                continue
            vach = o[0][0]
        else:
            if a not in meta['bar_start']:
                ra.append((ten, 'ngoài-bài')); continue
            vach = meta['bar_start'][a] + phase
        truoc = [n for n in ns if (not TRAI or n['hand'] == 2) and not n['tie_stop'] and n['dur'] > EPS and n['beat'] < vach - EPS and n['beat'] >= vach - 4 - EPS]
        if not truoc:
            ra.append((ten, None)); continue
        tat = max(n['beat'] + n['dur'] for n in truoc)
        ra.append((ten, round(max(0.0, vach - tat), 3)))
    key = (song['teacher'], song['genre'])
    vals = [x for _, x in ra if isinstance(x, float)]
    nhom[key] += vals
    print(f"{song['teacher']:9} {song['genre']:10} {song['name'][:28]:28} " + ' '.join(f'{t}:{x}' for t, x in ra))
print()
for k, v in nhom.items():
    print(k, 'n', len(v), 'lặng (nốt đen) trung vị', statistics.median(v) if v else None,
          '| 0:', sum(1 for x in v if x < 0.13), '≤0.5:', sum(1 for x in v if 0.13 <= x <= 0.5), '>0.5:', sum(1 for x in v if x > 0.5),
          '| các giá trị', sorted(v))

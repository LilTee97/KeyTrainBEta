"""Complete CP instrumental sections, measured from raw XML (not the stale ledger).

Read-only toward PianoBrain. --write regenerates the bundled data; --check compares it.
No CP Lick data or old solo is changed. Pitches stay relative to the section's tonic.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sys

import cp_lick_corpus as cp

sys.path.insert(0, str(cp.ROOT / 'scripts'))
import audit_ca_phao as audit

OUT = cp.ROOT / 'src/reharm/style/caPhaoFullSolos.json'
KINDS = {
    'major': '', 'minor': 'm', 'dominant': '7', 'minor-seventh': 'm7',
    'major-seventh': 'maj7', 'minor-11th': 'm11', 'minor-ninth': 'm9',
    'dominant-11th': '11', 'dominant-13th': '13', 'dominant-ninth': '9',
    'major-ninth': 'maj9', 'half-diminished': 'm7b5', 'diminished-seventh': 'dim7',
    'suspended-fourth': 'sus4', 'major-sixth': '6', 'major-minor': 'mMaj7',
    'augmented': 'aug',
}

# Để Em Rời Xa: vạch nhịp ký âm lệch nhạc ĐÚNG MỘT PHÁCH — bass rơi ở offset 1 của ô XML trong 68/70 ô
# (Reference/CA-PHAO-BALLAD-DE-EM.md, scripts/audit_cp_de_em.py). Ô thật k = [ô XML k + 1, ô XML k+1 + 1); ô 0
# lấy đà dài 3.25 nên ô thật 0 bắt đầu ở 0.25. Cũ: lưới ô XML → cử chỉ hai ô lệch pha, bộ soạn không chọn được.
PHASE = {'De Em': 1}
# Ký hiệu hợp âm in của bài này đặt sớm một phách ở đầu ô và đảo thứ tự ở một số ô (ô 30: in C rồi Bb, bass thật
# Bb1 rồi C2), nên dựng lại từ nốt bass thật của từng ô: (ô thật, phách trong ô thật, bậc so với chủ âm, đuôi).
# Đoạn kết ở Mi giáng thứ: bậc 8 = Cb, 10 = Db.
BASS_HARMONY = {'De Em': {
    'intro': [(0, 0, 8, ''), (0, 2, 10, ''), (1, 0, 0, 'm7'), (2, 0, 8, ''), (2, 1.75, 10, ''), (3, 0, 0, 'm7')],
    'interlude': [(27, 3, 0, 'm7'), (28, 0, 8, ''), (28, 2, 10, ''), (29, 0, 0, 'm7'), (30, 0, 8, ''), (30, 1.75, 10, ''),
                  (31, 0, 0, 'm7')],
    'outro': [(63, 3, 0, 'm7'), (64, 0, 8, ''), (64, 2, 10, ''), (65, 0, 0, 'm7'), (66, 0, 8, ''), (66, 1.75, 10, ''),
              (67, 0, 0, 'm7'), (68, 0, 8, ''), (68, 1.75, 10, ''), (69, 0, 0, 'm7'), (70, 0, 8, ''), (70, 1.75, 10, ''),
              (71, 0, 0, 'm7')],
}}


def pc(name):
    return (audit.STEP[name[0]] + name.count('#') - name.count('b')) % 12


def harmony(h, tonic):
    suffix = KINDS.get(h['kind'], h['text'] or '?')
    # Superscript 1/2 is the score's inversion label, not a chord quality.
    # The explicit bass already preserves that inversion.
    if suffix in ('¹', '²') and h['bass'] is not None: suffix = ''
    for degree, alter, action in h['degrees']:
        if degree == '5' and alter == '1': suffix = 'aug'
        elif degree == '7' and suffix == 'sus4': suffix = '7sus4'
        elif degree == '9' and suffix in ('', 'm'): suffix += 'add9'
        else: suffix += ('b' if alter == '-1' else '#' if alter == '1' else 'add') + degree
    return dict(root=(pc(h['root']) - tonic) % 12, suffix=suffix,
                bass=None if h['bass'] is None else (pc(h['bass']) - tonic) % 12)


def analyze():
    corpus = json.loads((cp.BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf8'))
    sections, inventory = [], []
    for song in corpus['songs']:
        if song.get('teacher') != 'ca-phao': continue
        path = cp.bac_not.tim_file(song)
        co_em_cho = song['file'].startswith('Co Em')
        ballad = song['genre'] == 'ballad'
        data = audit.audit(path, dynamics=ballad, actual_pickups=ballad)
        starts, cursor = {}, 0
        for bar, info in data.items():
            starts[int(bar)] = cursor
            cursor += info['length']
        raw = [dict(n, beat=starts[int(bar)] + n['at'], bar=int(bar),
                    tie_start='start' in n['ties'], tie_stop='stop' in n['ties'])
               for bar, info in data.items() for n in info['attacks']]
        groups = cp.groups_of(raw)
        row = dict(song=song['name'], file=Path(path).name, genre=song['genre'],
                   sha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(), sections=[])
        inventory.append(row)
        for kind, bounds in song.get('sections', {}).items():
            if kind not in ('intro', 'interlude', 'outro'): continue
            lo, declared_hi = bounds['bars']
            hi = min(declared_hi, max(starts))
            key = cp.key_at(song['file'], lo)
            bossa_outro = song['file'].startswith('nguoihay') and kind == 'outro'
            if bossa_outro: key = (2, 'minor')
            begin, end = starts[lo], starts[hi] + data[str(hi)]['length']
            # corpus.cua_loi explicitly includes both closing gestures in 56:0..2.
            # Keep the full printed opening/pickups in simulation, not training cuts.
            if co_em_cho and kind == 'interlude':
                hi, end = 56, starts[56] + 2
            elif song['file'].startswith('hongkong') and kind == 'intro':
                hi, end = 16, starts[16] + 1.5
            elif song['file'].startswith('De Em') and kind == 'interlude':
                hi, end = 32, starts[32] + 1
            phase = next((v for p, v in PHASE.items() if song['file'].startswith(p)), 0)

            def real_start(b):
                return starts[b] + phase if b >= 1 else starts[1] + phase - 4

            if phase:
                # Mô phỏng bắt đầu/kết thúc đúng VẠCH THẬT: phách lệch trước vạch là đuôi phần hát, không vào đoạn.
                # Cũ: dạo 15.25 phách (ô đầu 3.25, cắt mất cụm Dm9 cuối), giang 17 (một phách đuôi điệp ở đầu).
                begin = real_start(lo)
                end = real_start(hi + 1) if kind == 'intro' else end
            report = dict(kind=kind, bars=[lo, hi], declaredBars=[lo, declared_hi], beats=end-begin)
            row['sections'].append(report)
            if not key:
                report['status'] = 'needs-key-confirmation'
                continue
            tonic, mode = key
            chosen = [g for g in groups if g['at'] < end and g['at'] + g['dur'] > begin]
            events = []
            for g in chosen:
                # At a cut boundary the source tie is re-articulated once, never discarded.
                at = max(begin, g['at'])
                pitches, gates = [], []
                for pitch, gate in zip(g['pitches'], g['gates']):
                    finish = min(end, g['at'] + gate)
                    if finish <= at: continue
                    pitches.append(pitch-tonic)
                    gates.append(round(finish-at, 6))
                if not pitches: continue
                ornaments = [n for n in raw if n['hand'] == g['hand'] and abs(n['beat']-g['at']) < 1e-5 and not n['grace']]
                events.append(dict(at=round(at-begin, 6), tones=pitches, gates=gates,
                    hand='right' if g['hand'] == 1 else 'left',
                    arpeggiate=any(n['arpeggiate'] for n in ornaments),
                    articulations=sorted({a for n in ornaments for a in n['articulations']}),
                    carry=g['at'] < begin,
                    parallelMajor=bossa_outro and g['bar'] >= 100))
                if ballad:
                    events[-1]['velocities'] = [next((n['velocity'] for n in ornaments
                        if n['midi'] == pitch + tonic and 'velocity' in n),
                        64 if g['hand'] == 2 else 72) for pitch in pitches]
            graces = [dict(at=round(n['beat']-begin, 6), tone=n['midi']-tonic,
                           hand='right' if n['hand'] == 1 else 'left',
                           parallelMajor=bossa_outro and n['bar'] >= 100)
                      for n in raw if n['grace'] and begin <= n['beat'] < end]
            changes = []
            for bar, info in data.items():
                for h in info['harmony']:
                    at = starts[int(bar)] + h['at']
                    if at >= end: continue
                    changes.append(dict(at=at, **harmony(h, tonic)))
            changes.sort(key=lambda h: h['at'])
            before = [h for h in changes if h['at'] <= begin]
            harmony_events = ([dict(before[-1], at=0)] if before else [dict(at=0, root=0, suffix='m' if mode=='minor' else '', bass=None)])
            harmony_events += [dict(h, at=round(h['at']-begin, 6)) for h in changes if begin < h['at'] < end]
            if phase:
                # Ký hiệu in đặt sớm một phách và đảo ở ô 30 · 66 · 68 → dựng từ bass thật (cả bản "in" dùng khi mô phỏng).
                table = next(v for p, v in BASS_HARMONY.items() if song['file'].startswith(p))[kind]
                built = [dict(at=round(real_start(b) + off - begin, 6), root=root, suffix=suffix, bass=None)
                         for b, off, root, suffix in table if begin - 1e-9 <= real_start(b) + off < end]
                harmony_events = ([] if built and built[0]['at'] == 0 else [dict(built[0], at=0)]) + built
            # XML's F#aug/Eb in bar 42 conflicts with sounding Db-F-A/Eb,
            # followed by A-C#-G over A. Describe the measured bII -> V instead.
            if song['file'].startswith('nguoihay'):
                if kind == 'interlude':
                    harmony_events = [h for h in harmony_events if not 4 <= h['at'] < 8]
                    harmony_events += [dict(at=4, root=1, suffix='9', bass=None), dict(at=6, root=7, suffix='7', bass=None)]
                if bossa_outro:
                    written_harmony = [dict(h) for h in harmony_events]
                    for h in harmony_events:
                        if h['at'] >= starts[100]-begin and h['root'] == 0: h['suffix'] = 'm9'
                harmony_events.sort(key=lambda h: h['at'])
            rh = [g for g in chosen if g['hand'] == 1]
            report.update(status='exported', rightAttacks=len(rh), rightNotes=sum(len(g['pitches']) for g in rh),
                          techniques=cp.tags_of(rh), graces=len(graces))
            sections.append(dict(id=f"{song['file'].rsplit('.',1)[0]}:{kind}", song=song['name'],
                genre=song['genre'], mode=mode, tonic=tonic, kind=kind, fromBar=lo,
                vocalPickupAt=30.5 if song['file'].startswith('nguoihay') and kind in ('intro', 'interlude') else None,
                barLengths=[round(min(real_start(b + 1) if b + 1 in starts else end, end) - real_start(b), 6)
                            for b in range(lo, hi + 1) if real_start(b) < end - 1e-9] if phase else
                           [min(data[str(b)]['length'], end-starts[b]) for b in range(lo,hi+1)], lengthBeats=end-begin,
                events=events, graces=graces, harmony=harmony_events,
                writtenHarmony=written_harmony if bossa_outro else harmony_events,
                techniques=report['techniques']))
    return dict(version=1, inventory=inventory, sections=sections)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    cp.self_check()
    result = analyze()
    assert len(result['inventory']) == 9
    assert len(result['sections']) == 21
    bossa = next(s for s in result['sections'] if s['genre'] == 'bossa nova' and s['kind'] == 'interlude')
    assert bossa['fromBar'] == 41 and bossa['lengthBeats'] == 32
    assert any(e['carry'] for e in bossa['events'])
    assert any(abs(e['at']-22-1/3) < 1e-4 for e in bossa['events'])  # bar 46, actual triplet
    cec = {s['kind']: s for s in result['sections'] if s['song'] == 'Co Em Cho'}
    assert cec['interlude']['lengthBeats'] == 34 and cec['interlude']['barLengths'][-1] == 2
    tail = [e for e in cec['interlude']['events'] if e['hand'] == 'right' and e['at'] >= 32]
    assert [(e['at'], e['tones'], e['gates']) for e in tail] == [(32, [55, 62], [1, 1]), (33, [55, 60], [1, 1])]
    # Bar 5: peak C7 followed by the quiet C4/D4/G4 response, not equal accents.
    intro = cec['intro']['events']
    assert next(e for e in intro if e['hand'] == 'right' and e['at'] == 18.25)['velocities'] == [94, 94]
    assert next(e for e in intro if e['hand'] == 'right' and e['at'] == 19)['velocities'] == [56, 56, 56]
    for s in result['sections']:
        assert sum(s['barLengths']) == s['lengthBeats']
        assert all(0 <= e['at'] < s['lengthBeats'] and all(0 < gate <= s['lengthBeats']-e['at']+1e-5 for gate in e['gates']) for e in s['events'])
    encoded = json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n'
    if args.write: OUT.write_text(encoded, encoding='utf8')
    if args.check: assert json.loads(OUT.read_text(encoding='utf8')) == result, 'Bundled full solos differ from source'
    print(f"CP full: {len(result['inventory'])} sheets measured; {len(result['sections'])} complete sections from 7 confirmed sheets")
    for row in result['inventory']:
        print(row['song'], [(s['kind'], s['bars'], s['beats'], s['status']) for s in row['sections']])

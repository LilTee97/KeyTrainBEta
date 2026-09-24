"""Ballad-only training corpus with vocal boundaries; never rewrites legacy/Bossa data.

python -X utf8 -B tools/cp_ballad_solos.py --write
python -X utf8 -B tools/cp_ballad_solos.py --check
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

import cp_lick_corpus as cp
from cp_full_solos import harmony
import audit_ca_phao as audit

OUT = cp.ROOT / 'src/reharm/style/cpBalladSolos.json'
REPORT = cp.ROOT / 'Reference/CP-BALLAD-SOLO-INVENTORY.json'
# Half-open, zero-based quarter beats. From corpus cua_loi, NOT guessed by pitch.
WINDOWS = {
    'hongkong': {'intro': (1, 0, 16, 1.5), 'interlude': (47, 2, 65, 1.5), 'outro': (100, .5, 107, 2)},
    'Co Em': {'intro': (1, 0, 8, 3.5), 'interlude': (48, .25, 56, 2)},
    'Ngay mai': {'interlude': (51, .75, 54, 4), 'outro': (87, .75, 91, 4)},
    'De Em': {'interlude': (28, 0, 32, 1)},
    # 43:3.5/3.75 are the vocal pickup; exclude both identical final clusters.
    'Chua Bao': {'interlude': (35, 0, 43, 3.5)},
    'Chung Ta': {'intro': (1, 0, 8, 2.5), 'interlude': (33, 0, 48, 2.5)},
    'Anh Cu': {'interlude': (33, 1.5, 37, 2.5), 'outro': (62, .75, 68, 4)},
}


def analyze():
    corpus = json.loads((cp.BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf8'))
    songs = [s for s in corpus['songs'] if s['teacher'] == 'ca-phao' and s['genre'] == 'ballad']
    songs.append(dict(name='Anh Cu Di Di', file='Anh Cu Di Di- Ca Phao.mxl',
                      sections={'interlude': {'bars': [33, 37]}, 'outro': {'bars': [62, 68]}}))
    sections, inventory = [], []
    for song in songs:
        acdd = song['file'].startswith('Anh Cu')
        path = cp.BRAIN / 'video/Ca_Phao' / song['file'] if acdd else Path(cp.bac_not.tim_file(song))
        data = audit.audit(path, dynamics=True, actual_pickups=True)
        starts, cursor = {}, 0
        for b, info in data.items():
            starts[int(b)] = cursor
            cursor += info['length']
        raw = [dict(n, beat=starts[int(b)] + n['at'], bar=int(b),
                    tie_start='start' in n['ties'], tie_stop='stop' in n['ties'])
               for b, info in data.items() for n in info['attacks']]
        groups = cp.groups_of(raw)
        incomplete_ties = []
        for n in raw:
            if not n['tie_start']:
                continue
            following = sorted([t for t in raw if t['hand'] == n['hand'] and t['voice'] == n['voice'] and
                t['midi'] == n['midi'] and t['beat'] > n['beat']], key=lambda t: t['beat'])
            if not following or not following[0]['tie_stop']:
                incomplete_ties.append(n)
        row = dict(song=song['name'], file=str(path), sha256=hashlib.sha256(path.read_bytes()).hexdigest(), sections=[])
        inventory.append(row)
        for kind, bounds in song['sections'].items():
            if kind not in ('intro', 'interlude', 'outro'):
                continue
            lo, hi = bounds['bars']
            hi = min(hi, max(starts))
            window = next((v[kind] for p, v in WINDOWS.items() if song['file'].startswith(p) and kind in v), None)
            if window is None:
                window = (lo, 0, hi, data[str(hi)]['length'])
            first, offset, last, last_offset = window
            begin, end = starts[first] + offset, starts[last] + last_offset
            origin = starts[first]
            key = (5, 'minor') if acdd else cp.key_at(song['file'], first)
            tonic, mode = key if key else (0, 'unknown')
            # Unconfirmed boundary sheets still get an inventory. Only interior
            # gestures are candidates; no harmony/key is invented for them.
            uncertain = not key
            learn_start = starts[lo + 1] if uncertain else begin
            learn_end = starts[hi] if uncertain else end
            changes = [dict(at=starts[int(b)] + h['at'] - origin, **harmony(h, tonic))
                       for b, info in data.items() for h in info['harmony']
                       if starts[int(b)] + h['at'] < end]
            changes.sort(key=lambda h: h['at'])
            before = [h for h in changes if h['at'] <= 0]
            written = ([dict(before[-1], at=0)] if before else []) + [h for h in changes if h['at'] > 0]
            corrected = [dict(h) for h in written]
            corrections = []

            def replace(bar, until, entries, reason):
                nonlocal corrected
                at = starts[bar] - origin
                corrected = [h for h in corrected if not at <= h['at'] < at + until]
                corrected += [dict(at=at + off, root=root, suffix=suffix, bass=bass)
                              for off, root, suffix, bass in entries]
                corrections.append(dict(bar=bar, reason=reason))

            if song['file'].startswith('Co Em'):
                if kind in ('intro', 'interlude'):
                    bar = 7 if kind == 'intro' else 55
                    replace(bar, 4, [(0, 2, 'm7', None), (1.75, 7, '9sus4', None),
                        (2.25 if kind == 'intro' else 3.25, 7, '9', None)], 'F bass then Bb bass; D resolves sus. Printed ii/V order is reversed.')
                else:
                    replace(66, 4, [(0, 0, '', None), (1.75, 9, 'm7', None)], 'E bass before C# enters at 1.75.')
                    for bar in [67, 69]:
                        replace(bar, 4, [(0, 2, 'm9', None), (1.75, 7, '13', None)], 'F# bass before B; preserve ii-V order.')
            events = []
            for g in groups:
                carry = g['at'] < learn_start - 1e-5
                # A sustained bass is accompaniment, but an RH carry may still
                # be the preceding lyric. Keep only LH carries, marked as holds.
                if g['at'] >= learn_end - 1e-5 or carry and (g['hand'] != 2 or g['at'] + g['dur'] <= learn_start):
                    continue
                at = max(g['at'], learn_start)
                sounding = [(p, min(g['at'] + gate, learn_end) - at) for p, gate in zip(g['pitches'], g['gates'])
                            if g['at'] + gate > at]
                ornaments = [n for n in raw if n['hand'] == g['hand'] and abs(n['beat']-g['at']) < 1e-5 and not n['grace']]
                events.append(dict(at=round(at - origin, 6), tones=[p-tonic for p, _ in sounding],
                    gates=[round(gate, 6) for _, gate in sounding], carry=carry,
                    uncertainTie=any(n['hand'] == g['hand'] and abs(n['beat'] - g['at']) < 1e-5 for n in incomplete_ties),
                    velocities=[next((n['velocity'] for n in ornaments if n['midi'] == p and 'velocity' in n), None)
                                for p, _ in sounding],
                    hand='right' if g['hand'] == 1 else 'left',
                    clipped=any(g['at'] + gate > learn_end + 1e-5 for gate in g['gates']),
                    arpeggiate=any(n['arpeggiate'] for n in ornaments),
                    articulations=sorted({a for n in ornaments for a in n['articulations']})))
            graces = [dict(at=round(n['beat']-origin, 6), tone=n['midi']-tonic,
                           hand='right' if n['hand'] == 1 else 'left')
                      for n in raw if n['grace'] and learn_start <= n['beat'] < learn_end]
            bars = [dict(bar=b, at=starts[b]-origin, length=data[str(b)]['length'])
                    for b in range(first, last+1) if b in starts]
            section = dict(id=song['file'].rsplit('.', 1)[0]+':'+kind, song=song['name'], kind=kind,
                tonic=tonic, mode=mode, fromBar=first, bars=bars,
                start=round(learn_start-origin, 6), end=round(learn_end-origin, 6),
                events=sorted(events, key=lambda e: (e['at'], e['hand'])), graces=graces,
                harmony=sorted(corrected, key=lambda h: h['at']) if key else [], writtenHarmony=written,
                confidence='confirmed-boundaries; score-analyzed-key' if key else 'interior-rhythm-only; key/harmony unconfirmed')
            sections.append(section)
            right = [e for e in events if e['hand'] == 'right']
            tops = [max(e['tones']) for e in right]
            steps = [b-a for a, b in zip(tops, tops[1:])]
            left = [e for e in events if e['hand'] == 'left']
            left_attacks = [e for e in left if not e['carry']]
            runs, run = [], []
            for e in right + [None]:
                if e is None or len(e['tones']) > 2 or run and e['at']-run[-1]['at'] > .501:
                    if len(run) >= 4:
                        motion = [max(b['tones'])-max(a['tones']) for a, b in zip(run, run[1:])]
                        runs.append(dict(at=run[0]['at'], end=run[-1]['at']+max(run[-1]['gates']),
                            onsets=[n['at']-run[0]['at'] for n in run], motion=motion,
                            harmony=[h for h in section['harmony'] if h['at'] <= run[-1]['at']][-3:]))
                    run = []
                if e is not None and len(e['tones']) <= 2:
                    run.append(e)
            report = dict(kind=kind, window=list(window), learningWindow=[section['start'], section['end']],
                mode=mode, tonic=tonic if key else None, confidence=section['confidence'],
                nonFourQuarterBars=[b for b in bars if b['length'] != 4],
                rightAttacks=len(right), leftAttacks=len(left_attacks),
                chords=sum(len(e['tones'])>=3 for e in right), octaves=sum(any(n+12 in e['tones'] for n in e['tones']) for e in right),
                offbeats=sum(abs(e['at']-round(e['at']))>.001 for e in right),
                offSixteenthGrid=sum(abs(e['at']*4-round(e['at']*4))>.001 for e in right),
                semitoneSteps=sum(abs(n)==1 for n in steps), registerLeaps=sum(abs(n)>=12 for n in steps),
                rests=sum(b['at']>a['at']+max(a['gates'])+.08 for a,b in zip(right,right[1:])),
                graces=len(graces), harmony=section['harmony'], corrections=corrections,
                simultaneousHands=sum(any(abs(r['at']-l['at']) < .001 for l in left_attacks) for r in right),
                rightOverHeldBass=sum(any((l['carry'] or l['at'] < r['at']-.001) and
                    l['at']+max(l['gates']) > r['at']+.001 for l in left) for r in right),
                carriedBassNotes=sum(len(e['tones']) for e in left if e['carry']),
                incompleteTies=[dict(bar=n['bar'], at=n['at'], hand=n['hand'], pitch=n['pitch'])
                                for n in incomplete_ties if learn_start <= n['beat'] < learn_end],
                velocityNotes=sum(v is not None for e in events for v in e['velocities']),
                velocityRange=[min(v for e in events for v in e['velocities'] if v is not None),
                               max(v for e in events for v in e['velocities'] if v is not None)]
                    if any(v is not None for e in events for v in e['velocities']) else None,
                runs=runs,
                chordGestures=[dict(at=e['at'], intervals=[n-min(e['tones']) for n in e['tones']],
                    gates=e['gates'], arpeggiate=e['arpeggiate']) for e in right if len(e['tones']) >= 3],
                barRhythms=[dict(bar=b['bar'], left=[e['at']-b['at'] for e in left_attacks if b['at'] <= e['at'] < b['at']+b['length']],
                    right=[e['at']-b['at'] for e in right if b['at'] <= e['at'] < b['at']+b['length']]) for b in bars])
            row['sections'].append(report)
    return dict(version=1, sections=sections), dict(songs=inventory,
        limits='Notation only. A semitone is not automatically an ornament. Unknown-mode sheets teach timing only. No vocal RH or Bossa.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    cp.self_check()
    result, report = analyze()
    assert len(report['songs']) == 9 and len(result['sections']) == 25
    assert Counter(s['mode'] for s in result['sections']) == dict(major=9, minor=11, unknown=5)
    for s in result['sections']:
        assert all(s['start'] <= e['at'] < s['end'] and all(g > 0 for g in e['gates']) for e in s['events'])
        assert all(h['at'] < s['end'] for h in s['harmony'])
    if args.write:
        OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf8')
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf8')
    if args.check:
        assert json.loads(OUT.read_text(encoding='utf8')) == result
        assert json.loads(REPORT.read_text(encoding='utf8')) == report
    for song in report['songs']:
        print(song['song'], [(s['kind'], s['mode'], s['rightAttacks'], s['leftAttacks'], s['offSixteenthGrid']) for s in song['sections']])

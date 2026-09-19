"""Read-only, reproducible solo audit of all nine CP scores; stdout only.

Attack = hand/onset after merging ties. Interior bars avoid uncertain vocal
pickups. Two unconfirmed keys still contribute timing, NOT mode/pitch rules.
"""
import json
import sys
from collections import Counter
import cp_full_solos as full


def measure():
    cp, audit = full.cp, full.audit
    corpus = json.loads((cp.BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf8'))
    result = []
    for song in corpus['songs']:
        if song.get('teacher') != 'ca-phao':
            continue
        path = cp.bac_not.tim_file(song)
        data = audit.audit(path)
        starts, cursor = {}, 0
        for bar, info in data.items():
            starts[int(bar)] = cursor
            cursor += info['length']
        raw = [dict(n, beat=starts[int(b)] + n['at'], bar=int(b),
                    tie_start='start' in n['ties'], tie_stop='stop' in n['ties'])
               for b, info in data.items() for n in info['attacks']]
        groups = cp.groups_of(raw)
        sections = []
        for kind, bounds in song['sections'].items():
            if kind not in ('intro', 'interlude', 'outro'):
                continue
            lo, hi = bounds['bars']
            hi = min(hi, max(starts))
            bars = []
            for bar in range(lo, hi + 1):
                if bar not in starts:
                    continue
                start, length = starts[bar], data[str(bar)]['length']
                right = [g for g in groups if g['hand'] == 1 and start <= g['at'] < start + length]
                left = [g for g in groups if g['hand'] == 2 and start <= g['at'] < start + length]
                rt = {round(g['at'], 5) for g in right}
                held = any(g['hand'] == 2 and g['at'] < start and g['at'] + g['dur'] > start + 1e-5 for g in groups)
                down = any(abs(g['at'] - start) < 1e-5 for g in left)
                steps = [b['pitches'][-1] - a['pitches'][-1] for a, b in zip(right, right[1:])]
                tags = cp.tags_of(right)
                chords = sum(len(g['pitches']) >= 3 for g in right)
                role = 'punch' if chords >= 2 and chords >= len(right) * .35 else 'run' if len(right) / length >= 1.5 else 'line'
                # Sample actual sustain on the 1/24 grid (sixteenths and tuplets).
                states = Counter()
                for tick in range(round(length * 24)):
                    at = start + tick / 24 + 1e-6
                    sounding = [any(g['hand'] == hand and g['at'] <= at < g['at'] + g['dur'] for g in groups) for hand in (1, 2)]
                    states['both' if all(sounding) else 'rightOnly' if sounding[0] else 'leftOnly' if sounding[1] else 'silence'] += 1
                bars.append(dict(bar=bar, interior=lo < bar < hi, role=role, right=len(right), left=len(left),
                    leftAlone=sum(round(g['at'], 5) not in rt for g in left), leftDownbeat=down, leftHeld=held,
                    rightOffbeat=sum(abs(g['at'] - round(g['at'])) > .001 for g in right),
                    bothRest=round(states['silence']/24, 3), rightOnly=round(states['rightOnly']/24, 3),
                    leftOnly=round(states['leftOnly']/24, 3), tags=tags, steps=steps,
                    lh=[round(g['at']-start, 6) for g in left], rh=[round(g['at']-start, 6) for g in right]))
            sections.append(dict(kind=kind, declared=[lo, bounds['bars'][1]], actual=[lo, hi], bars=bars))
        interior = [b for section in sections for b in section['bars'] if b['interior']]
        count = len(interior)
        nleft = sum(b['left'] for b in interior)
        nright = sum(b['right'] for b in interior)
        steps = [n for b in interior for n in b['steps']]
        rhythm = Counter(tuple(b['lh']) for b in interior)
        key = cp.key_at(song['file'], 1)
        result.append(dict(song=song['name'], genre=song['genre'], key=key, bars=count,
            rightAttacks=nright, leftAttacks=nleft,
            leftAlonePct=round(100*sum(b['leftAlone'] for b in interior)/max(1,nleft),1),
            leftNoDownbeat=sum(not b['leftDownbeat'] for b in interior),
            heldNoDownbeat=sum(not b['leftDownbeat'] and b['leftHeld'] for b in interior),
            rightOnlyBeats=round(sum(b['rightOnly'] for b in interior),2),
            leftOnlyBeats=round(sum(b['leftOnly'] for b in interior),2),
            rightOffbeatPct=round(100*sum(b['rightOffbeat'] for b in interior)/max(1,nright),1),
            chordBars=sum('chord-gesture' in b['tags'] for b in interior),
            semitoneBars=sum('semitone-connection' in b['tags'] for b in interior),
            skipBars=sum('broken-intervals' in b['tags'] for b in interior),
            turnBars=sum(any(a*b<0 for a,b in zip(b['steps'], b['steps'][1:])) for b in interior),
            repeated=sum(n==0 for n in steps), steps=len(steps),
            commonLeft=[dict(at=list(pattern), bars=n) for pattern,n in rhythm.most_common(3)],
            sections=sections))
    assert len(result) == 9
    assert sum(r['key'] is None for r in result) == 2
    for r in result:
        assert r['heldNoDownbeat'] <= r['leftNoDownbeat'] <= r['bars']
        assert 0 <= r['leftAlonePct'] <= 100
    return result


def melody_colors():
    """Descriptive counts, NOT runtime probabilities; Ballad pickup filtering is incomplete."""
    result = {}
    for s in full.analyze()['sections']:
        for e in s['events']:
            if e['hand'] != 'right' or e['parallelMajor'] or (s['vocalPickupAt'] is not None and e['at'] >= s['vocalPickupAt']):
                continue
            h = next(h for h in reversed(s['harmony']) if h['at'] <= e['at'])
            q = h['suffix']
            quality = ('diminished' if 'b5' in q or 'dim' in q else
                       'minor' if q.startswith('m') and not q.startswith('maj') else
                       'sus' if 'sus' in q else
                       'dominant' if not q.startswith('maj') and q.startswith(('7', '9', '11', '13')) else 'major')
            counts = result.setdefault(s['mode'] + '/' + quality, Counter())
            counts[(max(e['tones']) - h['root']) % 12] += 1
    return result


def minor_context():
    """Re-read raw scores: harmony with its sounding/held melody, not a pitch bag."""
    rows = []
    for s in full.analyze()['sections']:
        if s['mode'] != 'minor':
            continue
        right = [e for e in s['events'] if e['hand'] == 'right' and not e['parallelMajor']
                 and (s['vocalPickupAt'] is None or e['at'] < s['vocalPickupAt'])]
        phrases = []
        for i, h in enumerate(s['harmony']):
            end = s['harmony'][i+1]['at'] if i+1 < len(s['harmony']) else s['lengthBeats']
            attacks = [e for e in right if h['at'] <= e['at'] < end]
            if not attacks:
                continue
            carried = [e for e in right if e['at'] < h['at'] < e['at']+e['gates'][-1]-.001]
            phrases.append(dict(at=h['at'], root=h['root'], suffix=h['suffix'],
                tops=[dict(at=e['at'], tonic=max(e['tones']) % 12, normalizedMidi=max(e['tones']),
                           voices=len(e['tones']), chord=(max(e['tones'])-h['root']) % 12,
                           gate=e['gates'][-1] * (.5 if 'staccato' in e['articulations'] else 1)) for e in attacks],
                carried=[dict(tonic=max(e['tones']) % 12, until=e['at']+e['gates'][-1]) for e in carried]))
        rows.append(dict(id=s['id'], fromBar=s['fromBar'], genre=s['genre'], tonic=s['tonic'], phrases=phrases))
    return rows


if __name__ == '__main__':
    print(json.dumps(minor_context() if '--minor-context' in sys.argv else
                     melody_colors() if '--melody' in sys.argv else measure(), ensure_ascii=False, separators=(',', ':')))

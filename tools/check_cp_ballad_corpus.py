"""Audit every exported ballad note against raw score attacks, without groups_of.

python -X utf8 -B tools/check_cp_ballad_corpus.py
Uses the shared MusicXML reader, but independently follows each tie chain and
compares pitch, hand, onset, individual gate, dynamics and boundary carries.
"""
from collections import Counter
import json

import cp_ballad_solos as ballad


def check():
    generated, report = ballad.analyze()
    bundled = json.loads(ballad.OUT.read_text(encoding='utf8'))
    assert generated == bundled, 'Regenerate the bundled training corpus first'
    count = 0
    incomplete_ties = set()
    for row in report['songs']:
        data = ballad.audit.audit(row['file'], dynamics=True, actual_pickups=True)
        starts, cursor = {}, 0
        for bar, info in data.items():
            starts[int(bar)] = cursor
            cursor += info['length']
        raw = [dict(n, beat=starts[int(bar)] + n['at'])
               for bar, info in data.items() for n in info['attacks']]
        for s in [s for s in bundled['sections'] if s['song'] == row['song']]:
            origin = starts[s['fromBar']]
            begin, end = origin + s['start'], origin + s['end']
            expected = {}
            for n in raw:
                if 'stop' in n['ties'] and begin <= n['beat'] < end:
                    preceding = sorted([t for t in raw if t['hand'] == n['hand'] and
                        t['voice'] == n['voice'] and t['midi'] == n['midi'] and t['beat'] < n['beat']],
                        key=lambda t: t['beat'])
                    assert preceding and 'start' in preceding[-1]['ties'], (s['id'], n, 'orphan tie-stop')
                if n['grace'] or 'stop' in n['ties']:
                    continue
                if n['beat'] >= end or n['beat'] < begin and n['hand'] != 2:
                    continue
                finish, continuation = n['beat'] + n['dur'], n
                while 'start' in continuation['ties']:
                    following = sorted([t for t in raw if t['hand'] == n['hand'] and
                        t['voice'] == n['voice'] and t['midi'] == n['midi'] and t['beat'] > continuation['beat']],
                        key=lambda t: t['beat'])
                    if not following or 'stop' not in following[0]['ties']:
                        if begin <= n['beat'] < end:
                            incomplete_ties.add((s['id'], round(n['beat'] - origin, 6), n['pitch']))
                        break  # No tie-stop in XML: keep the next written attack, do not invent a tie.
                    continuation = following[0]
                    if begin <= n['beat'] < end:
                        assert abs(continuation['beat'] - finish) < 2e-5, (s['id'], n, 'gap in instrumental tie')
                    finish = continuation['beat'] + continuation['dur']
                carry = n['beat'] < begin - 1e-5
                if n['beat'] >= end - 1e-5 or finish <= begin or carry and n['hand'] != 2:
                    continue
                at = max(begin, n['beat'])
                key = (n['hand'], round(at - origin, 6), n['midi'] - s['tonic'])
                value = (round(min(finish, end) - at, 5), n.get('velocity'), carry)
                if key in expected:
                    assert expected[key][1:] == value[1:]
                    value = (max(expected[key][0], value[0]), *value[1:])
                expected[key] = value
            actual = {(1 if e['hand'] == 'right' else 2, e['at'], p): (round(g, 5), v, e['carry'])
                      for e in s['events'] for p, g, v in zip(e['tones'], e['gates'], e['velocities'])}
            assert expected == actual, (s['id'], 'note/gate/dynamic mismatch',
                expected.keys() - actual.keys(), actual.keys() - expected.keys(),
                [(k, expected[k], actual[k]) for k in expected.keys() & actual.keys() if expected[k] != actual[k]][:5])
            assert all(len(e['tones']) == len(e['gates']) == len(e['velocities']) for e in s['events'])
            for e in s['events']:
                if e['carry']:
                    continue
                written = [n for n in raw if not n['grace'] and
                    n['hand'] == (1 if e['hand'] == 'right' else 2) and
                    abs(n['beat'] - origin - e['at']) < 1e-5]
                assert e['arpeggiate'] == any(n['arpeggiate'] for n in written), s['id']
                assert e['articulations'] == sorted({a for n in written for a in n['articulations']}), s['id']
            expected_graces = Counter((round(n['beat'] - origin, 6), n['midi'] - s['tonic'], n['hand'])
                for n in raw if n['grace'] and begin <= n['beat'] < end)
            assert expected_graces == Counter((g['at'], g['tone'], 1 if g['hand'] == 'right' else 2) for g in s['graces'])
            count += len(actual)
            print(s['song'], s['kind'], len(actual), 'notes;', sum(v[2] for v in actual.values()),
                  'held bass;', sum(v[1] is not None for v in actual.values()), 'written dynamics: OK')
    # Confirmed boundary evidence, independent of exporter window constants.
    hk = next(s for s in bundled['sections'] if s['song'] == 'Hồng Kông 1' and s['kind'] == 'intro')
    assert hk['end'] == 61.5
    assert any(e['hand'] == 'right' and e['at'] == 60.5 and e['tones'] == [58] for e in hk['events'])
    cec = next(s for s in bundled['sections'] if s['song'] == 'Co Em Cho' and s['kind'] == 'interlude')
    assert cec['end'] == 34
    assert [(e['at'], e['tones']) for e in cec['events'] if e['hand'] == 'right' and e['at'] >= 32] == [
        (32, [55, 62]), (33, [55, 60])]
    de = next(s for s in bundled['sections'] if s['song'] == 'Để Em Rời Xa' and s['kind'] == 'interlude')
    assert de['end'] == 17 and any(e['at'] >= 16 for e in de['events'])
    print(f'{len(report["songs"])} sheets / {len(bundled["sections"])} sections / {count} notes: exact within learning windows')
    print('Source tie-starts without a following tie-stop (not repaired by guessing):', sorted(incomplete_ties))


if __name__ == '__main__':
    check()

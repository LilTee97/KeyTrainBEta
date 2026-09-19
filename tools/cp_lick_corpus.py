"""Measure all active Ca Phao sheets; export short, traceable instrumental gestures.

Read-only toward PianoBrain. Regenerate: python -X utf8 tools/cp_lick_corpus.py --write
No source score is copied into KeyTrain. Runtime data contains relative pitches.
"""
import argparse
from collections import Counter, defaultdict
import hashlib
import json
import os
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BRAIN = Path(os.environ.get('PIANOBRAIN_ROOT', 'D:/PianoBrain'))
sys.path.insert(0, str(BRAIN / 'tools/sheet'))
import mxl  # noqa: E402
import bac_not  # noqa: E402

# User-confirmed keys, not guessed from the last key signature in the file.
KEYS = {
    'hongkong': (0, 'major'), 'nguoihay': (2, 'minor'),
    'Co Em': (3, 'major'), 'Ngay mai': (3, 'major'),
    'De Em': (2, 'minor'), 'Chua Bao': (5, 'minor'), 'Chung Ta': (9, 'minor'),
}
# Half-open windows: (bar, offset in quarter beats), from confirmed vocal boundaries.
# Other sung material is measured but NEVER exported as an instrumental fill.
FILL_WINDOWS = {
    'De Em': [(40, 0, 40, 1), (59, 2, 59, 2.75), (32, 0, 32, 1)],
    'Chua Bao': [(22, 0, 22, 2), (50, 3.25, 51, 2.75), (75, 3.25, 76, 2.25)],
    'Chung Ta': [(32, 2, 32, 4)],
}
# User identified these as instrumental section-change runs (14/9/2026).
# The first beat's RH tie is the preceding sung note, not part of the run.
TRANSITION_WINDOWS = {'nguoihay': [(39, 0, 39, 4), (64, 0, 64, 4)]}


def groups_of(notes):
    """Merge ties before grouping strikes. A chord is ONE onset, not a run."""
    sounding = []
    tied = {}
    for note in sorted(notes, key=lambda n: (n['beat'], n['hand'], n['voice'], n['midi'])):
        key = (note['hand'], note['voice'], note['midi'])
        if note['tie_stop']:
            previous = tied.get(key)
            if previous is not None:
                previous['dur'] = max(previous['dur'], note['beat'] + note['dur'] - previous['beat'])
            if not note['tie_start']:
                tied.pop(key, None)
            continue
        if note['dur'] <= 0:  # grace is counted separately, not fabricated as a timed hit
            continue
        hit = dict(note)
        sounding.append(hit)
        if note['tie_start']:
            tied[key] = hit
    grouped = defaultdict(list)
    for note in sounding:
        grouped[note['hand'], note['beat']].append(note)
    return [dict(hand=hand, at=at, bar=ns[0]['bar'],
                 pitches=sorted(set(n['midi'] for n in ns)),
                 gates=[max(n['dur'] for n in ns if n['midi'] == pitch)
                        for pitch in sorted(set(n['midi'] for n in ns))],
                 dur=max(n['dur'] for n in ns))
            for (hand, at), ns in sorted(grouped.items())]


def tags_of(groups):
    tops = [g['pitches'][-1] for g in groups]
    steps = [b - a for a, b in zip(tops, tops[1:])]
    tags = []
    if any(abs(s) == 1 for s in steps): tags.append('semitone-connection')
    if steps and all(0 < abs(s) <= 2 for s in steps): tags.append('stepwise-run')
    if sum(3 <= abs(s) <= 7 for s in steps) >= 2: tags.append('broken-intervals')
    if any(len(g['pitches']) > 1 for g in groups): tags.append('chord-gesture')
    if any(abs(s) >= 12 for s in steps): tags.append('register-transfer')
    if any(abs(g['at'] * 2 - round(g['at'] * 2)) > .01 for g in groups): tags.append('subdivision')
    if any(abs(g['at'] - round(g['at'])) > .01 for g in groups): tags.append('offbeat')
    if any(b['at'] > a['at'] + a['dur'] + .08 for a, b in zip(groups, groups[1:])): tags.append('breath')
    return tags


def key_at(filename, bar):
    base = next((value for prefix, value in KEYS.items() if filename.startswith(prefix)), None)
    if base and filename.startswith('Co Em') and bar >= 56: return 4, 'major'
    if base and filename.startswith('De Em') and bar >= 56: return 3, 'minor'
    # Bossa outro reaches parallel D major: do not train its ending as D minor.
    if filename.startswith('nguoihay') and bar >= 96: return None
    return base


def self_check():
    def note(at, pitch, dur, **extra):
        return dict(beat=at, midi=pitch, dur=dur, hand=1, voice=1, bar=1,
                    tie_start=False, tie_stop=False) | extra
    groups = groups_of([note(0, 60, .5, tie_start=True), note(0, 64, .25),
                        note(.5, 60, .5, tie_stop=True), note(1, 62, .25), note(1, 63, 0)])
    assert len(groups) == 2
    assert groups[0]['pitches'] == [60, 64] and groups[0]['gates'] == [1, .25]
    assert groups[1]['at'] == 1 and groups[1]['pitches'] == [62]
    assert key_at('Co Em Cho', 55) == (3, 'major')
    assert key_at('Co Em Cho', 56) == (4, 'major')
    assert key_at('De Em Roi Xa', 56) == (3, 'minor')
    assert key_at('nguoihayquenemdi', 96) is None
    assert key_at('yeu-xa', 1) is None


def analyze():
    corpus = json.loads((BRAIN / 'tools/sheet/corpus.json').read_text(encoding='utf-8'))
    songs = [s for s in corpus['songs'] if s.get('teacher') == 'ca-phao']
    inventory, phrases, transitions = [], [], []
    for song_index, song in enumerate(songs):
        path = bac_not.tim_file(song)
        if not path:
            inventory.append(dict(song=song['name'], status='missing'))
            continue
        root = mxl.load(path) if path.lower().endswith('.mxl') else ET.parse(path).getroot()
        notes, meta = mxl.notes(root)
        groups = groups_of(notes)
        by_bar = defaultdict(list)
        for g in groups:
            by_bar[g['hand'], g['bar']].append(g)
        counts = Counter()
        for (hand, _), gs in by_bar.items():
            if hand == 1: counts.update(tags_of(gs))
        row = dict(song=song['name'], file=Path(path).name, genre=song['genre'],
                   status='measured', sha256=hashlib.sha256(Path(path).read_bytes()).hexdigest(),
                   bars=len(meta['barlens']), attacks=len(groups),
                   rightAttacks=sum(g['hand'] == 1 for g in groups),
                   tieContinuations=sum(n['tie_stop'] for n in notes),
                   graceNotes=sum(n['dur'] == 0 for n in notes),
                   rightBars=sum(hand == 1 for hand, _ in by_bar),
                   techniqueBars=dict(counts), phrases=0,
                   keyStatus='confirmed' if key_at(song['file'], 1) else 'needs-confirmation')
        inventory.append(row)
        windows = []
        # Interior instrumental bars only: exclude boundary bars with uncertain vocal pickups.
        for section, data in song.get('sections', {}).items():
            if section not in ('intro', 'interlude', 'outro'): continue
            lo, hi = data['bars']
            for bar in range(lo + 1, hi):
                if bar in meta['bar_start']:
                    windows.append((bar, 0, bar, meta['barlens'][bar], 'instrumental-' + section))
        for prefix, confirmed in FILL_WINDOWS.items():
            if song['file'].startswith(prefix):
                windows.extend((*window, 'confirmed-fill') for window in confirmed)
        transition_windows = list(windows)
        for prefix, confirmed in TRANSITION_WINDOWS.items():
            if song['file'].startswith(prefix):
                transition_windows.extend((*window, 'confirmed-transition') for window in confirmed)
        for bar, offset, last_bar, last_off, evidence in transition_windows:
            start = meta['bar_start'][bar] + offset
            end = meta['bar_start'][last_bar] + last_off
            key = key_at(song['file'], bar)
            lead = [g for g in groups if g['hand'] == 1 and start <= g['at'] < end]
            if not key or not 2 < end-start <= 4 or len(lead) < 4: continue
            if any(len(g['pitches']) != 1 or g['at'] + g['dur'] > end + 1e-5 for g in lead): continue
            if max(g['pitches'][0] for g in lead) - min(g['pitches'][0] for g in lead) > 36: continue
            # No fabricated grace duration; full solo renderer owns grace realization.
            if any(n['dur'] == 0 and start <= n['beat'] < end for n in notes): continue
            support = [g for g in groups if g['hand'] == 2 and g['at'] < end and g['at'] + g['dur'] > start]
            if any(g['at'] + g['dur'] > end + 1e-5 for g in support): continue
            tonic, mode = key
            def relative(gs):
                return [dict(at=round(max(start,g['at'])-start,6),
                    dur=round(g['at']+g['dur']-max(start,g['at']),6),
                    gates=[round(g['at']+gate-max(start,g['at']),6) for gate in g['gates']],
                    tones=[p-tonic-60 for p in g['pitches']]) for g in gs]
            support_rel = relative(support)
            if any(gate <= 0 for n in support_rel for gate in n['gates']): continue
            transitions.append(dict(id=f'cp-transition-{song_index}-{bar}', song=song['name'],
                genre='bossa' if song['genre']=='bossa nova' else song['genre'], mode=mode,
                hand='right',kind='run',bar=bar,offset=offset,meter=meta['barlens'][bar],
                supportComplete=True,support=support_rel,evidence=evidence,span=end-start,
                tags=tags_of(lead),notes=relative(lead)))
        seen = set()
        for first_bar, first_off, last_bar, last_off, evidence in windows:
            start = meta['bar_start'][first_bar] + first_off
            end = meta['bar_start'][last_bar] + last_off
            for hand in (1, 2):
                gs = [g for g in groups if g['hand'] == hand and start <= g['at'] < end]
                for i, first in enumerate(gs):
                    key = key_at(song['file'], first['bar'])
                    if not key: continue
                    for size in (2, 3, 4, 6, 8):
                        take = gs[i:i + size]
                        if len(take) != size: continue
                        # A complete short window: no truncation of a held note or tie.
                        stop = max(g['at'] + g['dur'] for g in take)
                        span = stop - first['at']
                        if span > 2.001 or span < .24 or stop > end + 1e-5: continue
                        if any(b['at'] < a['at'] + a['dur'] - .02 for a, b in zip(take, take[1:])): continue
                        pitches = [p for g in take for p in g['pitches']]
                        if max(pitches) - min(pitches) > 24 or any(len(g['pitches']) > 4 for g in take): continue
                        if hand == 2 and (max(pitches) > 60 or any(len(g['pitches']) > 1 for g in take)): continue
                        if len(set(tuple(g['pitches']) for g in take)) < 2: continue
                        tonic, mode = key
                        # Full two-hand texture, only when no held note/grace crosses the cut.
                        complete = not any(
                            (g['at'] < first['at'] - 1e-5 and g['at'] + g['dur'] > first['at'] + 1e-5)
                            or (g['at'] < stop - 1e-5 and g['at'] + g['dur'] > stop + 1e-5)
                            for g in groups)
                        complete = complete and not any(n['dur'] == 0 and first['at'] <= n['beat'] < stop for n in notes)
                        complete = complete and sum(g['hand'] == hand and first['at'] <= g['at'] < stop for g in groups) == size
                        support = [dict(at=round(g['at'] - first['at'], 6), dur=round(g['dur'], 6),
                                        gates=[round(d, 6) for d in g['gates']],
                                        tones=[p - tonic - 60 for p in g['pitches']])
                                   for g in groups if g['hand'] != hand and first['at'] <= g['at'] < stop]
                        tags = tags_of(take)
                        kind = 'run' if size >= 4 and all(len(g['pitches']) == 1 for g in take) else 'fill'
                        rel = [dict(at=round(g['at'] - first['at'], 6), dur=round(g['dur'], 6),
                                    gates=[round(d, 6) for d in g['gates']],
                                    tones=[p - tonic - 60 for p in g['pitches']]) for g in take]
                        fingerprint = json.dumps([hand, rel, mode])
                        if fingerprint in seen: continue
                        seen.add(fingerprint)
                        phrase = dict(id=f'cp-{song_index}-{first["bar"]}-{hand}-{i}-{size}',
                                      song=song['name'], genre='bossa' if song['genre'] == 'bossa nova' else song['genre'],
                                      mode=mode, hand='right' if hand == 1 else 'left', kind=kind,
                                      bar=first['bar'], offset=round(first['at'] - meta['bar_start'][first['bar']], 6),
                                      meter=meta['barlens'][first['bar']], supportComplete=complete, support=support,
                                      evidence=evidence, span=round(span, 6), tags=tags, notes=rel)
                        phrases.append(phrase)
                        row['phrases'] += 1
    # One representative per rhythmic/interval gesture, balanced by source/hand/kind.
    buckets = defaultdict(list)
    for phrase in phrases:
        buckets[phrase['song'], phrase['mode'], phrase['hand'], phrase['kind']].append(phrase)
    selected = []
    for pool in buckets.values():
        signatures = set()
        for phrase in sorted(pool, key=lambda p: (not p['supportComplete'], p['evidence'] != 'confirmed-fill', p['span'], p['id'])):
            first = phrase['notes'][0]['tones'][0]
            signature = json.dumps([phrase['offset'] % phrase['meter'], phrase['support'],
                                    [[n['at'], n['gates'], [t - first for t in n['tones']]] for n in phrase['notes']]])
            if signature in signatures: continue
            signatures.add(signature)
            selected.append(phrase)
            if len(signatures) >= 32: break
    for row in inventory:
        row['exported'] = sum(p['song'] == row['song'] for p in selected)
    return dict(version=2, inventory=inventory, phrases=selected, transitions=transitions,
                deferred=[s for s in corpus['_de_sau']['sheets'] if s.get('teacher') == 'ca-phao'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--check', action='store_true', help='Check ties, chords, keys and exact regeneration')
    args = parser.parse_args()
    self_check()
    data = analyze()
    if args.check:
        assert data == json.loads((ROOT / 'src/reharm/licky/cpPhrases.json').read_text(encoding='utf-8'))
        print('CP corpus self-check and exact regeneration: PASS')
    if args.write:
        target = ROOT / 'src/reharm/licky/cpPhrases.json'
        target.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(json.dumps(dict(inventory=data['inventory'], total=len(data['phrases']),
                         pools=dict(Counter((p['genre'] + '/' + p['mode'] + '/' + p['kind']) for p in data['phrases']))),
                     ensure_ascii=False, indent=2))

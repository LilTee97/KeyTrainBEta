#!/usr/bin/env python3
"""Sidecar: file nhạc → JSON KeyTrain.

    pip install -r tools/requirements.txt
    python tools/analyze_song.py bai.mp3 -o bai.json

MP3 cần ffmpeg trên PATH. WAV/FLAC không cần.
Không gọi mạng. Madmom/Chordino/yt-dlp không dùng (cài Windows khó).
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import librosa
import numpy as np

QUALITIES = {
    "maj": (0, 4, 7),
    "min": (0, 3, 7),
    "7": (0, 4, 7, 10),
    "m7": (0, 3, 7, 10),
    "dim": (0, 3, 6),
    "sus4": (0, 5, 7),
}
SYMBOL = {"maj": "", "min": "m", "7": "7", "m7": "m7", "dim": "dim", "sus4": "sus4"}
PC = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]
KEY_MAJ = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
)
KEY_MIN = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
)
SCALE_MAJ = {0, 2, 4, 5, 7, 9, 11}
SCALE_MIN = {0, 2, 3, 5, 7, 8, 10}
SIMPLE = {"maj", "min"}


def _template(intervals: tuple[int, ...]) -> np.ndarray:
    bins = np.zeros(12)
    for index, interval in enumerate(intervals):
        bins[interval] = 1.3 if index == 0 else (1.15 if interval in (3, 4) else 1.0)
    return bins


TEMPLATES = [(qid, _template(iv)) for qid, iv in QUALITIES.items()]


def _cosine(left: np.ndarray, right: np.ndarray) -> float:
    denom = float(np.linalg.norm(left) * np.linalg.norm(right))
    return 0.0 if denom < 1e-9 else float(np.dot(left, right) / denom)


def _pearson(left: np.ndarray, right: np.ndarray) -> float:
    a = left - left.mean()
    b = right - right.mean()
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    return 0.0 if denom < 1e-9 else float(np.dot(a, b) / denom)


def estimate_key(chroma_mean: np.ndarray) -> tuple[int, bool]:
    best, root, minor = -1.0, 0, False
    for shift in range(12):
        aligned = np.roll(chroma_mean, -shift)
        for is_min, profile in ((False, KEY_MAJ), (True, KEY_MIN)):
            score = _pearson(aligned, profile)
            if score > best:
                best, root, minor = score, shift, is_min
    return root, minor


def match_chroma(chroma: np.ndarray, key: tuple[int, bool] | None) -> tuple[str, int]:
    scale = None
    bonus = 0.0
    if key:
        scale = SCALE_MIN if key[1] else SCALE_MAJ
        bonus = 0.06
    best_score = -1.0
    best_root = 0
    best_qid = "maj"
    for root in range(12):
        rotated = np.roll(chroma, -root)
        in_key = scale is None or ((root - key[0]) % 12) in scale
        for qid, tmpl in TEMPLATES:
            score = _cosine(rotated, tmpl) + (bonus if in_key else 0.0)
            if qid not in SIMPLE:
                score -= 0.03
            if score > best_score:
                best_score = score
                best_root = root
                best_qid = qid
    return f"{PC[best_root]}{SYMBOL[best_qid]}", best_root


def smooth(symbols: list[str], meter: int) -> list[str]:
    if len(symbols) < 3:
        return symbols
    out = list(symbols)
    for index in range(1, len(out) - 1):
        if out[index] == out[index - 1]:
            continue
        if out[index - 1] != out[index + 1]:
            continue
        if index % meter == 0:
            continue
        out[index] = out[index - 1]
    return out


def merge(symbols: list[str]) -> list[dict]:
    chords: list[dict] = []
    for symbol in symbols:
        if chords and chords[-1]["symbol"] == symbol:
            chords[-1]["beats"] += 1
        else:
            chords.append({"symbol": symbol, "beats": 1})
    return chords


def analyze(path: Path, meter: int) -> dict:
    y, sr = librosa.load(path, sr=22050, mono=True)
    if y.size < sr // 4:
        raise SystemExit("File quá ngắn.")

    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    bpm = int(round(float(np.atleast_1d(tempo)[0])))
    bpm = min(220, max(40, bpm))

    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    if beat_frames.size < 2:
        hop = int(sr * 60 / bpm / 512) or 1
        beat_frames = np.arange(0, chroma.shape[1], max(hop, 1))

    per_beat: list[str] = []
    chunks: list[np.ndarray] = []
    for index, start in enumerate(beat_frames):
        end = beat_frames[index + 1] if index + 1 < len(beat_frames) else chroma.shape[1]
        start_i, end_i = int(start), max(int(end), int(start) + 1)
        slice_ch = chroma[:, start_i:end_i].mean(axis=1)
        chunks.append(slice_ch)

    mean = np.mean(np.stack(chunks), axis=0) if chunks else chroma.mean(axis=1)
    key = estimate_key(mean)
    previous_root: int | None = None
    previous_symbol = "C"
    for slice_ch in chunks:
        symbol, root = match_chroma(slice_ch, key)
        if previous_root is not None and root == previous_root:
            symbol = previous_symbol
        per_beat.append(symbol)
        previous_root = root
        previous_symbol = symbol

    per_beat = smooth(per_beat, meter)
    key_name = f"{PC[key[0]]}{'m' if key[1] else ''}"
    return {
        "title": path.stem,
        "bpm": bpm,
        "beatsPerMeasure": meter,
        "key": key_name,
        "chords": merge(per_beat),
        "perBeat": per_beat,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Phân tích bài hát → JSON KeyTrain")
    parser.add_argument("audio", type=Path)
    parser.add_argument("-o", "--output", type=Path)
    parser.add_argument("--meter", type=int, choices=(3, 4), default=4)
    args = parser.parse_args()
    if not args.audio.is_file():
        sys.exit(f"Không thấy file: {args.audio}")

    track = analyze(args.audio, args.meter)
    text = json.dumps(track, ensure_ascii=False, indent=2)
    if args.output:
        args.output.write_text(text, encoding="utf-8")
        print(f"Ghi {args.output} · {track['bpm']} BPM · {track['key']} · {len(track['chords'])} hợp âm")
    else:
        print(text)


if __name__ == "__main__":
    main()

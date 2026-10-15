"""Đo ba clip "Rải Ngón" của SSA (D:/PianoBrain/video/Rai ngon SSA): nốt chép × đoạn hợp âm đọc từ nhãn màn hình.

Dùng cho game chạy ngón (KeyTrain `src/thay/hocSolo/khungNot.ts`, bảng `SSA`). Chạy: `python tools/do_rai_ssa.py [--chi-tiet]`.
- Nốt: piano_transcription_inference (ByteDance, CPU) — file `<clip>.json` cạnh video; chưa có thì tự chép (ffmpeg → wav 16 kHz → mô hình).
- Hợp âm: `tools/du_lieu/doan_hop_am_rai_ssa.json` — Claude đọc tay nhãn hợp âm trên màn hình, 2 khung/giây (±0,25 s), 15/10/2026.
In: tay trái · tay phải · nốt đỉnh chồng · nốt giai điệu (vai so gốc hợp âm) từng đoạn (--chi-tiet), rồi tổng hợp theo nhóm đuôi.
Tách tay: khoảng trống cao độ lớn nhất trong đoạn (giữa 40 và 76), không có thì C4 — đoán, bản chép không có tay. Nốt giai điệu: nốt tay
phải cao nhất đang vang ở lúc gõ và không bị một nốt cao hơn gõ tiếp trong 0,25 s (bỏ nốt giữa chuỗi rải lên).
"""
import json
import os
import subprocess
import sys
import tempfile
from collections import Counter, defaultdict

sys.stdout.reconfigure(encoding='utf-8')
GOC_REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THU_MUC_VIDEO = os.environ.get('RAI_SSA', r'D:\PianoBrain\video\Rai ngon SSA')
DOAN = os.path.join(GOC_REPO, 'tools', 'du_lieu', 'doan_hop_am_rai_ssa.json')
CLIP = {'rai1': 'Rai Ngon', 'rai2': 'Rai 2', 'rai3': 'Rai 3'}
IN_TUNG_DOAN = '--chi-tiet' in sys.argv


def doc_not(clip):
    """Nốt chép của một clip; chưa có file JSON thì chép (cần ffmpeg trong PATH, piano_transcription_inference, torch)."""
    duong = os.path.join(THU_MUC_VIDEO, f'{CLIP[clip]}.json')
    if not os.path.exists(duong):
        import librosa
        import torch
        from piano_transcription_inference import PianoTranscription, sample_rate
        with tempfile.TemporaryDirectory() as tam:
            wav = os.path.join(tam, 'am.wav')
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(THU_MUC_VIDEO, f'{CLIP[clip]}.mp4'), '-ac', '1', '-ar', '16000', wav], check=True)
            audio, _ = librosa.load(wav, sr=sample_rate, mono=True)
            kq = PianoTranscription(device=torch.device('cpu')).transcribe(audio, os.path.join(THU_MUC_VIDEO, f'{CLIP[clip]}.mid'))
        json.dump({'not': [{'on': round(float(e['onset_time']), 3), 'off': round(float(e['offset_time']), 3), 'm': int(e['midi_note']),
                            'v': int(e['velocity'])} for e in kq['est_note_events']]}, open(duong, 'w', encoding='utf-8'))
    return json.load(open(duong, encoding='utf-8'))['not']


PC = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
TEN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
LOAI = {
    'Maj9': [0, 4, 7, 11, 2], 'Maj9(13)': [0, 4, 7, 11, 2, 9], 'Maj7': [0, 4, 7, 11], 'Maj7(#11)': [0, 4, 7, 11, 6],
    'Maj(add2)': [0, 2, 4, 7], 'Maj9sus4': [0, 5, 7, 11, 2], 'Maj7sus2': [0, 2, 7, 11], '6/9(#11)': [0, 4, 7, 9, 2, 6],
    '': [0, 4, 7], '5': [0, 7],
    'min7': [0, 3, 7, 10], 'min9': [0, 3, 7, 10, 2], 'min9(11)': [0, 3, 7, 10, 2, 5], 'min7(11)': [0, 3, 7, 10, 5],
    'min9(13)': [0, 3, 7, 10, 2, 9], 'min7(13)': [0, 3, 7, 10, 9], 'minMaj7': [0, 3, 7, 11], 'minMaj7(13)': [0, 3, 7, 11, 9],
    'min6': [0, 3, 7, 9], 'min(add4/11)': [0, 3, 5, 7], 'min': [0, 3, 7], 'min7b5': [0, 3, 6, 10], 'min7b5(11)': [0, 3, 6, 10, 5],
    'min7b5(9,11)': [0, 3, 6, 10, 2, 5], 'min7b5(b13)': [0, 3, 6, 10, 8], 'dim': [0, 3, 6],
    '7': [0, 4, 7, 10], '9(13)': [0, 4, 7, 10, 2, 9], '7(13 no5)': [0, 4, 10, 9], '7(b9)': [0, 4, 7, 10, 1], '7(#11)': [0, 4, 7, 10, 6],
    '9(13)#11': [0, 4, 7, 10, 2, 9, 6], '9(#11)': [0, 4, 7, 10, 2, 6], '7(b9#5)': [0, 4, 8, 10, 1], '7sus4': [0, 5, 7, 10],
    '9sus4': [0, 5, 7, 10, 2], '13sus': [0, 5, 7, 10, 2, 9], '13sus(b9)': [0, 5, 7, 10, 1, 9], '7sus2': [0, 2, 7, 10],
    '9sus4(add3)': [0, 4, 5, 7, 10, 2],
}


def nhom_duoi(loai):
    """Nhóm đuôi theo cách người dùng gọi (maj7 · m7 · 7 · sus · m7b5 · dim · 6 · add9 …)."""
    if loai.startswith('min7b5'):
        return 'm7b5'
    if loai == 'dim':
        return 'dim'
    if loai.startswith('minMaj7'):
        return 'mMaj7'
    if loai == 'min6':
        return 'm6'
    if loai.startswith('min9') or loai.startswith('min7') or loai == 'min(add4/11)':
        return 'm7/m9/m11'
    if loai == 'min':
        return 'thứ'
    if 'sus' in loai and loai.startswith(('7', '9', '13')):
        return '7sus/9sus/13sus'
    if loai.startswith('Maj9sus4') or loai.startswith('Maj7sus2'):
        return 'maj7sus'
    if loai.startswith('Maj') and ('7' in loai or '9' in loai):
        return 'maj7/maj9'
    if loai == '6/9(#11)':
        return '6/9'
    if loai.startswith(('7', '9')):
        return '7 màu (9 · 13 · b9 · #11 · #5)' if loai != '7' else '7'
    if loai == 'Maj(add2)':
        return 'add9'
    return 'ba nốt / 5'


def ten_bac(iv, quang):
    q = set(quang)
    if iv == 0:
        return '1'
    if iv == 1:
        return 'b9'
    if iv == 2:
        return '9' if (3 in q or 4 in q) else '2'
    if iv == 3:
        return '#9' if 4 in q else 'b3'
    if iv == 4:
        return '3'
    if iv == 5:
        return '4' if not (3 in q or 4 in q) else '11'
    if iv == 6:
        return '#11' if 7 in q else 'b5'
    if iv == 7:
        return '5'
    if iv == 8:
        return 'b13' if 7 in q else '#5'
    if iv == 9:
        return '13' if (10 in q or 11 in q) else '6'
    if iv == 10:
        return 'b7'
    return '7'


def vai(iv, quang):
    """trụ = 1 · 3 (hay nốt treo) · 5 · 7 (hay 6 của hợp âm 6); màu = nốt căng có trong nhãn; ngoài = không có trong nhãn."""
    q = set(quang)
    if iv not in q:
        return 'ngoài nhãn'
    ba = 3 if 3 in q else 4 if 4 in q else None
    tru = {0, 6 if 7 not in q and 6 in q else 7, 8 if 7 not in q and 8 in q else 7}
    if ba is not None:
        tru.add(ba)
    else:
        tru |= {2, 5} & q  # hợp âm treo: nốt treo thay bậc 3
    if 10 in q:
        tru.add(10)
    elif 11 in q:
        tru.add(11)
    elif 9 in q:
        tru.add(9)  # 6 / m6: bậc 6 đứng chỗ bậc 7
    return 'trụ' if iv in tru else 'màu'


def ten_not(m):
    return f'{TEN[m % 12]}{m // 12 - 1}'


# Tên một chùm tay phải: loại hợp âm ba / bảy quen (gốc nào cũng được) — để viết "tay trái X + tay phải Y".
CHUM = {
    (0, 4, 7): '', (0, 3, 7): 'm', (0, 3, 6): 'dim', (0, 4, 8): 'aug', (0, 2, 7): 'sus2', (0, 5, 7): 'sus4',
    (0, 4, 7, 11): 'maj7', (0, 3, 7, 10): 'm7', (0, 4, 7, 10): '7', (0, 3, 6, 10): 'm7b5', (0, 3, 6, 9): 'dim7',
    (0, 3, 7, 11): 'mMaj7', (0, 4, 7, 9): '6', (0, 3, 7, 9): 'm6', (0, 2, 4, 7): 'add9', (0, 2, 3, 7): 'm(add9)',
    (0, 4, 11): 'maj7(no5)', (0, 3, 10): 'm7(no5)', (0, 4, 10): '7(no5)', (0, 7, 11): 'maj7(no3)', (0, 7, 10): '7(no3)',
    (0, 5, 10): '7sus4(no5)', (0, 5, 7, 10): '7sus4', (0, 2, 7, 10): '7sus2', (0, 4, 7, 11, 14): 'maj9',
}


def ten_chum(notes):
    pcs = sorted({n % 12 for n in notes})
    if len(pcs) == 1:
        return f'{TEN[pcs[0]]} (một nốt / quãng tám)'
    if len(pcs) == 2:
        d = (pcs[1] - pcs[0]) % 12
        return f'quãng {d} nửa cung ({TEN[min(notes) % 12]}–…)'
    thap = min(notes) % 12
    goc_uu_tien = [thap] + [p for p in pcs if p != thap]
    for g in goc_uu_tien:
        k = tuple(sorted(((p - g) % 12) for p in pcs))
        if k in CHUM:
            return TEN[g] + CHUM[k]
    return 'chùm ' + ' '.join(TEN[p] for p in pcs)


def main():
    tong_dinh = defaultdict(Counter)       # nhóm đuôi → bậc của nốt đỉnh chồng
    tong_gd = defaultdict(Counter)         # nhóm đuôi → bậc của nốt giai điệu
    vai_gd = Counter()
    vai_dinh = Counter()
    khop_nhan = Counter()
    cong_thuc = defaultdict(Counter)       # nhóm đuôi → "tay trái + tay phải"
    so_doan = Counter()
    tay_trai_dang = Counter()

    trai_bac = defaultdict(Counter)        # nhóm đuôi → bậc tay trái gõ
    phai_bac = defaultdict(Counter)        # nhóm đuôi → bậc mọi nốt tay phải (khung tay phải)
    so_go_trai = []
    giu_chung = []                         # tỉ lệ nốt tay phải (cao độ) giữ nguyên qua chỗ đổi hợp âm
    doi_bass_giu_khung = Counter()
    ket_cau = Counter()
    ioi = defaultdict(list)
    seg_all = json.load(open(DOAN, encoding='utf-8'))
    for clip in ['rai1', 'rai2', 'rai3']:
        notes = sorted(doc_not(clip), key=lambda n: (n['on'], n['m']))
        doan = seg_all[clip]['doan']
        if IN_TUNG_DOAN:
            print(f'\n===== {clip} =====')
        # Gán nốt: ứng viên là đoạn có [s − 0,5, e) chứa lúc gõ; ưu tiên đoạn có nốt ấy trong nhãn, rồi đoạn bắt đầu muộn hơn.
        gan = defaultdict(list)
        for n in notes:
            ung = [i for i, d in enumerate(doan) if d[0] - 0.5 <= n['on'] < d[1]]
            if not ung:
                continue
            def co(i):
                d = doan[i]
                g = PC[d[2]]
                pcs = {(g + x) % 12 for x in LOAI[d[3]]} | ({PC[d[4]]} if d[4] else set())
                return n['m'] % 12 in pcs
            tot = [i for i in ung if co(i)] or ung
            gan[max(tot, key=lambda i: doan[i][0])].append(n)
        truoc_phai = None
        truoc_bass = None
        for k in range(len(notes) - 1):
            ioi[clip].append(notes[k + 1]['on'] - notes[k]['on'])
        for i, d in enumerate(doan):
            s, e, goc, loai, bass = d
            ns = sorted(gan[i], key=lambda n: (n['on'], n['m']))
            if not ns:
                continue
            g = PC[goc]
            quang = LOAI[loai]
            pcs_nhan = {(g + x) % 12 for x in quang} | ({PC[bass]} if bass else set())
            for n in ns:
                khop_nhan['trong nhãn' if n['m'] % 12 in pcs_nhan else 'ngoài nhãn'] += 1
            cao = sorted({n['m'] for n in ns})
            khe = [(cao[k + 1] - cao[k], cao[k]) for k in range(len(cao) - 1) if 40 <= cao[k] and cao[k + 1] <= 76]
            tach = max(khe)[1] if khe and max(khe)[0] >= 3 else 59
            trai = [n for n in ns if n['m'] <= tach]
            phai = [n for n in ns if n['m'] > tach]
            nhom = nhom_duoi(loai)
            so_doan[nhom] += 1
            so_go_trai.append(len(trai))
            for n in trai:
                trai_bac[nhom]['bass' if (bass and n['m'] % 12 == PC[bass]) else ten_bac((n['m'] - g) % 12, quang)] += 1
            for n in phai:
                phai_bac[nhom][ten_bac((n['m'] - g) % 12, quang)] += 1
            cao_phai = {n['m'] for n in phai}
            bass_nay = min(n['m'] for n in ns) % 12
            if truoc_phai is not None and cao_phai:
                giu_chung.append(len(cao_phai & truoc_phai) / len(cao_phai))
                if bass_nay != truoc_bass and len(cao_phai & truoc_phai) >= 2:
                    doi_bass_giu_khung['doi bass, giu >= 2 not tay phai'] += 1
                elif bass_nay != truoc_bass:
                    doi_bass_giu_khung['doi bass, doi ca tay phai'] += 1
            truoc_phai, truoc_bass = cao_phai, bass_nay
            cum = defaultdict(list)
            for n in phai:
                cum[round(n['on'] / 0.06)].append(n)
            khoi = sum(1 for v in cum.values() if len(v) >= 3)
            ket_cau['khoi' if khoi >= max(1, len(phai) // 6) else 'rai'] += 1
            # Nốt đỉnh chồng: nốt tay phải cao nhất của cụm gõ đầu (0,8 s từ nốt đầu đoạn).
            dau = ns[0]['on']
            cum = [n for n in phai if n['on'] <= dau + 0.8]
            dinh = max(cum, key=lambda n: n['m']) if cum else (max(phai, key=lambda n: n['m']) if phai else None)
            if dinh:
                iv = (dinh['m'] - g) % 12
                tong_dinh[nhom][ten_bac(iv, quang)] += 1
                vai_dinh[vai(iv, quang)] += 1
            # Nốt giai điệu.
            gd = []
            for n in phai:
                dang = [x for x in phai if x is not n and x['on'] <= n['on'] + 0.03 and x['off'] > n['on'] + 0.03]
                if any(x['m'] > n['m'] for x in dang):
                    continue
                if any(x['m'] > n['m'] and n['on'] < x['on'] <= n['on'] + 0.25 for x in phai):
                    continue
                gd.append(n)
            for n in gd:
                iv = (n['m'] - g) % 12
                tong_gd[nhom][ten_bac(iv, quang)] += 1
                vai_gd[vai(iv, quang)] += 1
            # Công thức chồng ở lúc đầy nhất: nốt tay trái · tay phải đang giữ 0,8 s sau nốt đầu.
            t = dau + 0.8
            giu_trai = sorted({n['m'] for n in trai if n['on'] <= t + 0.2})
            giu_phai = sorted({n['m'] for n in phai if n['on'] <= t + 0.2})
            if giu_trai:
                b = giu_trai[0]
                dang_trai = '+'.join(ten_bac((m - g) % 12, quang) if (m - b) % 12 else ('1' if (b - g) % 12 == 0 else f'bass {TEN[b % 12]}')
                                     for m in giu_trai)
                tay_trai_dang[dang_trai] += 1
            if giu_trai and giu_phai:
                cong_thuc[nhom][f'tay trái {"–".join(ten_not(m) for m in giu_trai)} + tay phải {ten_chum(giu_phai)}'] += 1
            if IN_TUNG_DOAN:
                nhan = f'{goc}{loai}' + (f'/{bass}' if bass else '')
                print(f'{s:5.1f} {nhan:16} trái {" ".join(ten_not(n["m"]) for n in sorted(trai, key=lambda n: n["m"]))[:40]:40} | '
                      f'phải {" ".join(ten_not(n["m"]) for n in sorted(phai, key=lambda n: n["on"]))[:60]:60} | '
                      f'đỉnh {ten_not(dinh["m"]) + "=" + ten_bac((dinh["m"] - g) % 12, quang) if dinh else "-":10} | '
                      f'giai điệu {" ".join(ten_not(n["m"]) + "=" + ten_bac((n["m"] - g) % 12, quang) for n in gd)[:70]}')

    print('\n--- KIỂM nhãn: nốt chép nằm trong nhãn', dict(khop_nhan))
    import statistics
    print('--- IOI trung vi (s):', {c: round(statistics.median([x for x in v if x > 0.04]), 3) for c, v in ioi.items()})
    print('--- so not tay trai moi doan: trung vi', statistics.median(so_go_trai), '; >= 3 not:', sum(1 for x in so_go_trai if x >= 3), '/', len(so_go_trai))
    print('--- tay phai giu nguyen cao do qua cho doi hop am: trung vi', round(statistics.median(giu_chung), 2), 'n =', len(giu_chung), dict(doi_bass_giu_khung))
    print('--- ket cau tay phai:', dict(ket_cau))
    for nhom in sorted(phai_bac, key=lambda k: -so_doan[k]):
        print(f'  [{nhom}] khung tay phai: {dict(phai_bac[nhom].most_common(8))} | tay trai: {dict(trai_bac[nhom].most_common(6))}')
    print('--- vai nốt ĐỈNH chồng (một nốt mỗi đoạn):', dict(vai_dinh), '/', sum(vai_dinh.values()))
    print('--- vai nốt GIAI ĐIỆU:', dict(vai_gd), '/', sum(vai_gd.values()))
    print('--- số đoạn theo nhóm đuôi:', dict(so_doan))
    for nhom in sorted(tong_dinh, key=lambda k: -so_doan[k]):
        print(f'  [{nhom}] đỉnh chồng: {dict(tong_dinh[nhom].most_common())} · giai điệu: {dict(tong_gd[nhom].most_common())}')
    print('--- dạng tay trái:', dict(tay_trai_dang.most_common(12)))
    for nhom in sorted(cong_thuc, key=lambda k: -so_doan[k]):
        print(f'  [{nhom}] công thức (3 hay gặp):', cong_thuc[nhom].most_common(3))


if __name__ == '__main__':
    main()

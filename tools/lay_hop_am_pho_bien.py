# -*- coding: utf-8 -*-
"""Hợp âm PHỔ BIẾN của các bài trong kho sheet — lấy từ hopamchuan.com làm MỐC NGOÀI để tách lựa chọn của thầy (7/10/2026).

    python tools/lay_hop_am_pho_bien.py        # lấy (có cache), ghi tools/du_lieu/hop_am_pho_bien.json

Vì sao cần: sheet của thầy là bản PHỐI của bài người khác. Muốn biết chỗ nào là lựa chọn của thầy thì phải có cái để so — "bài này
người ta thường đệm thế nào". Nhạc sĩ hiếm khi in sẵn hòa âm, nên mốc tốt nhất có được là các bản hợp âm cộng đồng đăng (nhiều
người, nhiều bản). Đây KHÔNG phải hòa âm gốc của nhạc sĩ — ghi rõ như vậy ở mọi chỗ dùng.

Chỉ lưu tên nhạc sĩ, giọng, điệu và chuỗi hợp âm theo dòng (số âm tiết của dòng, vị trí âm tiết của từng hợp âm). KHÔNG lưu lời.
Bài nào ứng với trang nào là CHỌN TAY sau khi đối chiếu hợp âm với sheet (`BAI` dưới đây) — có bài trùng tên khác nhạc sĩ.
"""
from __future__ import annotations

import html as H
import json
import os
import re
import tempfile
import time
import urllib.request

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
CACHE = os.environ.get('HOPAM_CACHE') or os.path.join(tempfile.gettempdir(), 'hopamchuan_cache')
RA = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'du_lieu', 'hop_am_pho_bien.json')

# Tên bài trong corpus.json → (id trang, đường dẫn) trên hopamchuan. Chọn tay 7/10/2026:
#   Mùa Xuân Đầu Tiên có hai bài trùng tên — Văn Cao (Rê thứ, valse) và Tuấn Khanh (giọng trưởng). Sheet Linh Nhi Sol trưởng,
#   bolero, vòng G – Em – Bm – D … khớp bài Tuấn Khanh; trang 2306 và 6978 là cùng bài Tuấn Khanh đăng hai lần — lấy cả hai.
#   Nỗi Buồn Hoa Phượng có trang "2" (bài khác cùng nhạc sĩ) — lấy trang 1254.
BAI = {
    'Biển Tình': [('2740', 'bien-tinh')],
    'Dung Xa Em Dem Nay': [('485', 'dung-xa-em-dem-nay')],
    'La Thư Tran The': [('5554', 'la-thu-tran-the')],
    'Mot Coi Di Ve': [('2308', 'mot-coi-di-ve')],
    'Duong Xua Loi Cu': [('3402', 'duong-xua-loi-cu')],
    'Mua xuan dau tien': [('2306', 'mua-xuan-dau-tien'), ('6978', 'mua-xuan-dau-tien-tuan-khanh')],
    'Rung La Thap': [('3319', 'rung-la-thap')],
    'Noi buon hoa phuong': [('1254', 'noi-buon-hoa-phuong')],
    # Cà Pháo (7/10/2026). Trang trùng tên khác bài đã bỏ: "Ngày Mai Em Đi Mất" (Đạt G), "Hongkong 12", bản chế, mashup.
    'Hồng Kông 1': [('22061', 'hong-kong-1')],
    'Người hãy quên em đi': [('15388', 'nguoi-hay-quen-em-di')],
    'Co Em Cho': [('9998', 'co-em-cho')],
    'Ngay mai em di': [('1528', 'ngay-mai-em-di')],
    'Để Em Rời Xa': [('3825', 'de-em-roi-xa')],
    'Chưa Bao Giờ (Trung Quân)': [('6213', 'chua-bao-gio')],
    'Chúng Ta Không Thuộc Về Nhau': [('8027', 'chung-ta-khong-thuoc-ve-nhau')],
}


def lay(url):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, re.sub(r'[^A-Za-z0-9]+', '_', url)[-150:] + '.html')
    if os.path.exists(p):
        return open(p, encoding='utf-8').read()
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'vi,en;q=0.8'})
    for lan in range(3):
        try:
            t = urllib.request.urlopen(req, timeout=60).read().decode('utf-8', errors='ignore')
            break
        except OSError:
            if lan == 2:
                raise
            time.sleep(5 * (lan + 1))
    open(p, 'w', encoding='utf-8').write(t)
    time.sleep(1.0)
    return t


def doc_trang(t):
    """Tên nhạc sĩ, điệu, giọng, dòng [(số âm tiết, [(vị trí âm tiết, hợp âm)])] — không giữ lời."""
    m = re.search(r'Tác giả:\s*(.*?)Thể loại', re.sub(r'<[^>]+>', ' ', t), re.S)
    tac_gia = [x.strip() for x in re.split(r'\s{2,}|,', H.unescape(m.group(1))) if x.strip()] if m else []
    giong = re.search(r'id="display-key"[^>]*data-key="([^"]+)"', t)
    khoi = t[t.find('id="song-lyric"'):]
    dong = []
    for ln in re.findall(r'<div class="chord_lyric_line[^"]*">(.*?)</div>', khoi, re.S):
        am, hop = 0, []
        for kind, val in re.findall(r'<span class="hopamchuan_(lyric|chord)">(.*?)</span>', ln, re.S):
            if kind == 'chord':
                hop.append([am, H.unescape(val).strip()])
            else:
                am += len([w for w in re.split(r'\s+', H.unescape(re.sub(r'<[^>]+>', '', val))) if re.search(r'\w', w)])
        if hop or am:
            dong.append([am, hop])
    # Dòng ghi chú đầu trang ("hợp âm chia ở tone [Dm]") không phải lời bài: bỏ.
    if dong and 'song-lyric-note' in khoi[:khoi.find('chord_lyric_line') + 200]:
        dong = dong[1:]
    return dict(tac_gia=tac_gia, giong=giong.group(1) if giong else None, dong=dong)


def main():
    ra = {}
    for bai, trang in BAI.items():
        ban = []
        for sid, slug in trang:
            goc = lay(f'https://hopamchuan.com/song/{sid}/{slug}/')
            urls = [f'https://hopamchuan.com/song/{sid}/{slug}/'] + sorted(set(re.findall(rf'https://hopamchuan\.com/song/{sid}/[A-Za-z0-9-]+/[A-Za-z0-9_.-]+', goc)))
            for u in urls[:12]:
                b = doc_trang(goc if u.endswith(f'/{slug}/') else lay(u))
                if sum(len(h) for _, h in b['dong']) >= 8:
                    ban.append(dict(url=u, **b))
        ra[bai] = dict(tac_gia=ban[0]['tac_gia'] if ban else [], ban=ban)
        print(f"{bai:22s} {ra[bai]['tac_gia']} · {len(ban)} bản · giọng {[b['giong'] for b in ban]}")
    os.makedirs(os.path.dirname(RA), exist_ok=True)
    json.dump(ra, open(RA, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main()

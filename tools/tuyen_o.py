# -*- coding: utf-8 -*-
"""Sinh bang TUYEN — chep tung o nhip cua doan solo tu ban ky am PianoBrain.

    python tools/tuyen_o.py --kiem              # sinh lai bang Linh Nhi, so voi bang dang co
    python tools/tuyen_o.py ca-phao > out.ts    # sinh bang cho mot thay

Vi sao co bo nay: bang `tuyenDaoLinhNhi.ts` truoc day sinh bang mot script khong luu
lai, nen khong ai chay lai duoc. Bo nay lam duoc ca hai viec — sinh bang moi, va SINH
LAI bang cu de doi chieu.

HUONG DOC MOT CHIEU. KeyTrain doc PianoBrain, khong bao gio nguoc lai. Bo nay chi doc
`D:/PianoBrain/tools/sheet/` va `video/`, khong ghi gi sang ben ay.
"""
from __future__ import annotations

import collections
import json
import os
import sys

BRAIN = os.environ.get('PIANOBRAIN_ROOT') or os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'PianoBrain'))
sys.path.insert(0, os.path.join(BRAIN, 'tools', 'sheet'))

import bac_not as B  # noqa: E402
import clone_do  # noqa: E402
import don_hop_am  # noqa: E402
import khung  # noqa: E402
import mxl  # noqa: E402

DOAN = ('intro', 'interlude', 'outro')
TEN_VI = {'do': 'Đô', 're': 'Rê', 'mi': 'Mi', 'fa': 'Fa', 'sol': 'Sol', 'la': 'La',
          'si': 'Si'}


def chat_cua(el, rp):
    """Rut chat hop am ve ba nhan bo ghep dung: 'm' thu · '7' at · '' truong.

    `Dm11` va `Dm7` cung roi vao 'm' — day la CO Y. Bo loc ghep o chi can biet mau
    thu/truong/at; giu nguyen chat mo rong thi vong hop am nao cung thanh doc nhat vo
    nhi va khong con o nao khop voi o nao.
    """
    tap = don_hop_am.tap_not(el, gom_bass=False)
    rel = set((p - rp) % 12 for p in tap)
    if 3 in rel:
        return 'm'
    if 10 in rel and 4 in rel:
        return '7'
    return ''


def doc_bai(song):
    """Tra ve (not tay phai, ky hieu hop am, do dai tung o).

    NOT doc bang `mxl.notes` + `clone_do.sua_o` cua PianoBrain, KHONG tu viet lai.
    Ban dau toi tu di mot luot tren cay XML, va no dat sai vach nhip: o 1 cua Đừng Xa
    dai ra thanh 5 phach, keo mot not cua o 2 vao. `sua_o` co san de vá đúng chỗ ấy —
    no day not sang o sau khi moc phach vuot qua do dai o. Bang sinh lai chi khop
    228/373 not truoc khi doi sang bo doc nay.

    DUOI NOT NOI ĐƯỢC GIỮ làm một mốc gõ riêng. Kiểm bằng cách sinh lại bảng cũ: tổng
    số nốt khớp đúng 373 khi giữ, và tụt xuống 370 khi bỏ.
    """
    path = B.tim_file(song)
    if not path:
        return None
    # `mxl.load` chi mo file .mxl nen. Hong Kong 1 nam trong kho duoi dang
    # .musicxml tho — doc thang bang ElementTree.
    if path.lower().endswith('.mxl'):
        root = mxl.load(path)
    else:
        import xml.etree.ElementTree as ET
        root = ET.parse(path).getroot()
    ns, meta = mxl.notes(root)
    ns, bl, dau_o = clone_do.sua_o(ns, meta)
    phai = [n for n in ns if n['hand'] == 1]

    # Ky hieu hop am: di rieng mot luot, lay moc phach trong o.
    hops = []
    parts = root.findall('part')
    if parts:
        div, at = 1, 0.0
        for measure in parts[0].findall('measure'):
            bar = int(measure.get('number') or 0)
            at = 0.0
            attr = measure.find('attributes')
            if attr is not None and attr.findtext('divisions'):
                div = int(attr.findtext('divisions'))
            for el in measure:
                if el.tag == 'harmony':
                    if not don_hop_am.la_hoi(el):
                        hops.append((round(at, 3), bar, el))
                elif el.tag == 'backup':
                    at -= float(el.findtext('duration') or 0) / div
                elif el.tag == 'forward':
                    at += float(el.findtext('duration') or 0) / div
                elif el.tag == 'note':
                    if el.find('chord') is None and el.find('grace') is None:
                        at += float(el.findtext('duration') or 0) / div
    return phai, hops, dau_o, bl


def hop_cua_o(hops, bar):
    """Ky hieu hop am dang vang truoc o, va cac ky hieu RIENG BIET trong o."""
    truoc = None
    trong = []
    for at, b, el in hops:
        if b < bar:
            truoc = el
        elif b == bar:
            trong.append((at, el))
    return truoc, trong


def tuyen_bai(song, doan):
    ra = doc_bai(song)
    g = B.giong_ra_so(song.get('giong'))
    if not ra or not g:
        return None
    notes, hops, dau_o, dai_o = ra
    chu_am, the = g
    sec = (song.get('sections') or {}).get(doan) or {}
    khoang = tuple(sec.get('bars') or ())
    if len(khoang) != 2:
        return None
    if sec.get('giong'):
        chu_am, the = B.giong_ra_so(sec['giong'])

    # BO NOT HOA MY. `mxl.notes` giu ca <grace>, ma not hoa my co duration = 0 nen vao
    # bang thanh mot moc go khong keu. Bat duoc bang test `tuyenSolo.test.ts`: Hong Kong
    # 1 doan dao co not do ngan 0. Not hoa my cung khong thuoc xuong song giai dieu —
    # bang giu not tren cung moi moc go, khong giu do trang tri.
    notes = [n for n in notes
             if khoang[0] <= n['bar'] <= khoang[1] and n['dur'] > 0]
    o_ra = []
    for bar in range(khoang[0], khoang[1] + 1):
        dau, dai = dau_o.get(bar), dai_o.get(bar)
        if dau is None:
            continue
        truoc, trong = hop_cua_o(hops, bar)

        bac = chat = bac2 = chia = None
        dau_el = trong[0][1] if trong and trong[0][0] <= 1e-6 else truoc
        if dau_el is not None:
            r = dau_el.find('root')
            rp = don_hop_am._pc(r, 'root') if r is not None else None
            if rp is not None:
                bac, chat = (rp - chu_am) % 12, chat_cua(dau_el, rp)
        # O CHIA DOI: ky hieu thu hai trong o, KHAC ten ky hieu dau.
        #
        # O LAY DA (bac is None) KHONG TINH LA O CHIA. O dau bai chua co ky hieu nao thi
        # ky hieu dau tien roi vao giua o la ky hieu DAU cua no, khong phai ky hieu thu
        # hai — goi la "chia doi" thi dem ra 7 o chia trong khi ban ky am co 6. Va
        # `locO` ben KeyTrain bo het o `bac === null` nen truong `bac2` o day khong ai
        # doc, chi lam lech con so.
        for moc, el in (trong if bac is not None else []):
            if moc <= 1e-6:
                continue
            r = el.find('root')
            rp = don_hop_am._pc(r, 'root') if r is not None else None
            if rp is None:
                continue
            b2, c2 = (rp - chu_am) % 12, chat_cua(el, rp)
            if (b2, c2) != (bac, chat):
                bac2, chia = b2, moc
                break

        # Giai dieu: not cao nhat moi moc go.
        #
        # BO NOT VUOT VACH NHIP. `sua_o` day not sang o sau khi moc phach vuot qua do
        # dai o, NHUNG o cuoi ban nhac thi khong co o sau de day — not cua doan sau bi
        # ket lai voi moc phach 4.75, 5.75 trong mot o 4 phach. Bat duoc bang test
        # `tuyenSolo.test.ts`. Do duoc 22 not nhu vay tren ca kho, deu o doan ket.
        at = collections.defaultdict(list)
        for n in notes:
            if n['bar'] == bar and n['off'] < dai - 1e-6:
                at[round(n['off'], 3)].append(n)
        n_ra = []
        for moc in sorted(at):
            cao = max(at[moc], key=lambda n: n['midi'])
            n_ra.append([moc, cao['midi'] - (60 + chu_am), round(cao['dur'], 3)])
        o_ra.append(dict(bac=bac, chat=chat if bac is not None else '',
                         bac2=bac2, chia=chia, n=n_ra))
    # SO PHACH MOT O: lay o HAY GAP NHAT trong doan, khong lay o dau tien. Doan ket
    # Tinh Em mo bang mot o 2/4 roi con lai 4/4 — lay o dau thi ca tuyen bi khai la 2
    # phach, va moi not tu phach 2 tro di doc ra thanh vuot vach.
    dem = collections.Counter(dai_o.get(b) for b in range(khoang[0], khoang[1] + 1)
                              if dai_o.get(b))
    phach = dem.most_common(1)[0][0] if dem else 4.0
    # O LE DAI HON O CHUAN thi phan duoi cua no khong ghep duoc: bo ghep dat o vao mot
    # o dai `phach`, not nam ngoai khoang ay se roi ra ngoai vach. Cat di.
    for o in o_ra:
        o['n'] = [m for m in o['n'] if m[0] < phach - 1e-6]
    return dict(ten=song['name'], thu=(the == 'thu'), chuGoc=chu_am,
                phach=phach, o=o_ra)


def doc_bang_ts(path):
    """Doc bang TS dang co ra JSON de doi chieu. Chi doc, khong sua."""
    import re
    src = open(path, encoding='utf-8').read()
    bai, hien = [], None
    for khoi in re.finditer(r"id: '([^']+)',\s*\n\s*ten: '([^']+)'", src):
        bai.append(dict(id=khoi.group(1), ten=khoi.group(2), at=khoi.start()))
    for i, b in enumerate(bai):
        het = bai[i + 1]['at'] if i + 1 < len(bai) else len(src)
        than = src[b['at']:het]
        b['chuGoc'] = int(re.search(r'chuGoc: (\d+)', than).group(1))
        b['o'] = []
        for m in re.finditer(
                r'\{ bac: (null|\d+), chat: \'([^\']*)\', bac2: (null|\d+), '
                r'chia: (null|[\d.]+), n: \[(.*?)\] \}', than, re.S):
            n = [[float(x) for x in p.split(',')]
                 for p in re.findall(r'\[([^\]]+)\]', m.group(5))]
            b['o'].append(dict(
                bac=None if m.group(1) == 'null' else int(m.group(1)),
                chat=m.group(2),
                bac2=None if m.group(3) == 'null' else int(m.group(3)),
                chia=None if m.group(4) == 'null' else float(m.group(4)),
                n=n))
        del b['at']
    return bai


def kiem():
    """Sinh lai doan dao cua Linh Nhi, so tung o voi bang dang co."""
    cu = doc_bang_ts(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                  '..', 'src', 'reharm', 'style', 'tuyenDaoLinhNhi.ts'))
    corpus = khung.nap_corpus()
    tong_o = khop_o = tong_n = khop_n = 0
    # Bang cu ghi ten co dau, corpus ghi ten khong dau — ghep theo THU TU, hai ben
    # cung mot thu tu bai.
    thu_tu = [s for s in corpus['songs'] if s.get('teacher') == 'linh-nhi']
    for vi, song in enumerate(thu_tu):
        moi = tuyen_bai(song, 'intro')
        if not moi:
            print('THIEU:', song['name'])
            continue
        goc = cu[vi] if vi < len(cu) else None
        if goc is None:
            print('KHONG CO TRONG BANG CU:', moi['ten'], '-', len(moi['o']), 'o')
            continue
        a, b = goc['o'], moi['o']
        print('{:24} bang cu {:2} o / {:3} not   sinh lai {:2} o / {:3} not'.format(
            goc['ten'], len(a), sum(len(x['n']) for x in a),
            len(b), sum(len(x['n']) for x in b)))
        for i in range(min(len(a), len(b))):
            tong_o += 1
            if (a[i]['bac'], a[i]['chat'], a[i]['bac2'], a[i]['chia']) == \
               (b[i]['bac'], b[i]['chat'], b[i]['bac2'], b[i]['chia']):
                khop_o += 1
            else:
                print('   o {}: cu {} moi {}'.format(
                    i + 1,
                    (a[i]['bac'], a[i]['chat'], a[i]['bac2'], a[i]['chia']),
                    (b[i]['bac'], b[i]['chat'], b[i]['bac2'], b[i]['chia'])))
            if len(a[i]['n']) != len(b[i]['n']):
                print('   o {}: so not lech — cu {} moi {}'.format(
                    i + 1, len(a[i]['n']), len(b[i]['n'])))
            for x, y in zip(a[i]['n'], b[i]['n']):
                tong_n += 1
                if abs(x[0] - y[0]) < 1e-6 and int(x[1]) == int(y[1]):
                    khop_n += 1
                else:
                    print('   o {} not: cu {} moi {}'.format(i + 1, x, y))
    print('\nO khop hop am: {}/{}   Not khop (phach+cao do): {}/{}'.format(
        khop_o, tong_o, khop_n, tong_n))


def khong_dau(s):
    import unicodedata
    s = unicodedata.normalize('NFD', s.lower().replace('đ', 'd'))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return '-'.join(''.join(c if c.isalnum() else ' ' for c in s).split())


def giong_chu(song, doan):
    sec = (song.get('sections') or {}).get(doan) or {}
    g = sec.get('giong') or song.get('giong') or ''
    tu = g.lower().split()
    if not tu or tu[0] not in TEN_VI:
        return g
    ra = TEN_VI[tu[0]]
    if 'giang' in tu:
        ra += ' giáng'
    if 'thang' in tu:
        ra += ' thăng'
    return ra + (' thứ' if 'thu' in tu else ' trưởng')


def so(x):
    """In so kieu TS: bo duoi .0 cho gon, giu null."""
    if x is None:
        return 'null'
    return str(int(x)) if float(x) == int(x) else str(round(float(x), 3))


def emit_ts(muc):
    ra = []
    for t in muc:
        ra.append(
            "\n  /* {} · {} · {} · {} · {} ô · {} nốt */\n"
            "  {{\n    id: '{}',\n    ten: '{}',\n    thay: '{}',\n    doan: '{}',\n"
            "    thu: {},\n    giong: '{}',\n    dieu: '{}',\n    chuGoc: {},\n"
            "    phach: {},\n    o: [".format(
                t['ten'], t['doan'], t['giong'], t['dieu'], len(t['o']),
                sum(len(o['n']) for o in t['o']),
                t['id'], t['ten'], t['thay'], t['doan'],
                'true' if t['thu'] else 'false', t['giong'], t['dieu'],
                t['chuGoc'], so(t['phach'])))
        for o in t['o']:
            n = ', '.join('[{}, {}, {}]'.format(so(a), so(b), so(c)) for a, b, c in o['n'])
            ra.append(
                "\n      {{ bac: {}, chat: '{}', bac2: {}, chia: {}, n: [{}] }},".format(
                    so(o['bac']), o['chat'], so(o['bac2']), so(o['chia']), n))
        ra.append('\n    ],\n  },')
    return ''.join(ra)


DAU_FILE = """import type { PitchClass } from '../../shared/musicTheory/types'
import type { SoloTeacher } from '../fillSoloGenerator/soloTeacher'

/**
 * TUYẾN GIAI ĐIỆU CÁC ĐOẠN SOLO — chép theo TỪNG Ô từ bản ký âm của ba thầy.
 *
 * SINH BẰNG `tools/tuyen_o.py`, KHÔNG GÕ TAY DÒNG NÀO. Chạy lại:
 *
 *     python tools/tuyen_o.py --sinh > src/reharm/style/tuyenSolo.ts
 *
 * ## Vì sao bảng này thay `tuyenDaoLinhNhi.ts`
 *
 * Bảng cũ cũng ghi là "sinh bằng script", nhưng script ấy không ai lưu lại nên không
 * chạy lại được — và khi dựng được bộ sinh thì bảng cũ **không tái lập nổi**:
 *
 * | | bảng cũ | bảng này |
 * |---|---|---|
 * | số ô mỗi bài | 7/7 khớp | 7/7 khớp |
 * | bậc + chất hợp âm | 57/59 ô khớp | — |
 * | khớp `data/sheet-solos` của PianoBrain | **118/276 nốt** | **285/285 nốt** |
 * | ô giống hệt bảng cũ | — | **12/59** |
 *
 * Hai bộ đọc độc lập (`tools/tuyen_o.py` ở đây và `luu_solo.py` bên PianoBrain) cùng
 * cho một kết quả, và cùng bác bảng cũ ở những chỗ giống nhau. Ô 1 *Đừng Xa* là ca rõ
 * nhất: bảng cũ ghi nốt đầu ô là midi 77 và nốt cuối ô là midi 81, mà **cả ô ấy trong
 * bản ký âm không có nốt nào trong hai nốt đó**.
 *
 * Khả năng cao nhất: bảng cũ sinh từ một bản `.mxl` hoặc một biên đoạn đã bị thay.
 *
 * ## Giai điệu là NỐT TRÊN CÙNG mỗi mốc gõ
 *
 * Giữ hết mọi nốt khuông tay phải thì một ô phình lên 20 nốt trong khi bản ký âm chỉ có
 * 8 mốc gõ — phần dưới là nắm hợp âm tay phải, trùng việc với phần đệm đã dựng.
 *
 * **Đuôi nốt nối được giữ làm một mốc gõ riêng.** Đây là chỗ bảng này khác phép đo
 * trong `LUAT-SOAN-NOT.md` (phép đo ấy bỏ đuôi nối để đếm mật độ). Bảng thì cần phát ra
 * tiếng, nên giữ đúng những gì bản ký âm bảo gõ.
 *
 * ## Ô CHIA ĐÔI ghi cả hai bậc
 *
 * Ghi mỗi ô một bậc là mất đúng hợp âm quyết định hướng câu. Mỗi ô có thêm `bac2` và
 * `chia` (phách mà hợp âm thứ hai vào).
 */

/** Một ô nhịp có thật của một đoạn solo. */
export type OSolo = {
  /** Bậc gốc hợp âm ĐẦU ô so với chủ âm, 0-11. `null` = ô chưa có hợp âm nào. */
  bac: number | null
  /** `'m'` thứ · `'7'` át · `''` trưởng. Chất mở rộng rút về ba nhãn này. */
  chat: string
  /** Bậc hợp âm thứ hai trong ô, `null` khi ô không chia. */
  bac2: number | null
  /** Phách mà hợp âm thứ hai vào, `null` khi ô không chia. */
  chia: number | null
  /** `[phách trong ô, nửa cung so với chủ âm ở MIDI 60+chủ âm, số phách ngân]` */
  n: readonly (readonly [number, number, number])[]
}

export type TuyenSolo = {
  id: string
  ten: string
  thay: Exclude<SoloTeacher, null>
  /** `intro` dạo · `interlude` giang tấu · `outro` kết. */
  doan: 'intro' | 'interlude' | 'outro'
  thu: boolean
  giong: string
  /** Thể loại của bản gốc. */
  dieu: string
  /** Bậc chủ âm BẢN GỐC — giữ tuyến ở đúng tầm bản ký âm khi chuyển giọng. */
  chuGoc: PitchClass
  /** Số phách một ô của bản gốc. Chỉ ghép vào bài cùng số phách. */
  phach: number
  o: readonly OSolo[]
}

/** Bảng tính từ MIDI `60 + chủ âm`. */
export const gocTuyen = (chu: PitchClass) => 60 + chu

export const TUYEN_SOLO: readonly TuyenSolo[] = [
"""


def sinh():
    corpus = khung.nap_corpus()
    muc = []
    for song in corpus['songs']:
        for doan in DOAN:
            t = tuyen_bai(song, doan)
            if not t or not t['o']:
                continue
            t['doan'] = doan
            t['thay'] = song.get('teacher')
            t['dieu'] = song.get('genre') or ''
            t['giong'] = giong_chu(song, doan)
            t['id'] = '{}-{}'.format(khong_dau(song['name']), doan)
            muc.append(t)
    return DAU_FILE + emit_ts(muc) + '\n]\n'


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    if arg == '--kiem':
        kiem()
    elif arg == '--sinh':
        sys.stdout.reconfigure(encoding='utf-8')
        print(sinh(), end='')
    else:
        corpus = khung.nap_corpus()
        ra = []
        for song in corpus['songs']:
            if arg and song.get('teacher') != arg:
                continue
            for doan in DOAN:
                t = tuyen_bai(song, doan)
                if t:
                    t['doan'] = doan
                    t['thay'] = song.get('teacher')
                    ra.append(t)
        print(json.dumps(ra, ensure_ascii=False, indent=1))

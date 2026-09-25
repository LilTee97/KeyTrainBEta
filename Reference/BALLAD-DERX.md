# Ballad DERX: phan tich hai tay va ban rut gon Codex

Ngay 2026-09-25. Cho nghe duyet, KHONG phai ban doc tau nguyen van.
Nut rieng `Ballad DERX`, family/id `ballad-derx`, diep `ballad-derx-chorus`.
Khong thay `Ballad De em` cua Claude (`ca-phao-ballad-de-em-roi-xa`).

## Nguon va cach do

- Sheet: `D:/PianoBrain/video/Ca_Phao/De Em Roi Xa-Ca Phao.mxl`.
- SHA256: `c4d780b7b37c89b1e7891daca40bc13fbca5ffba8c5600cf25ea04350aaaba4b`.
- Tempo trong XML: 85; chu yeu 4/4. Pickup 0 dai 3.25 phach; o 10: 2, 11: 3, 23: 6, 71: 3.
- Re thu; chuyen Mi giang thu tu XML 56. Khong suy hop am chi tu nhan harmony.
- Dung `audit_ca_phao.audit(..., dynamics=True, actual_pickups=True)` de doc hai khuong,
  chord onset, backup/forward. Trai = staff 2, phai = staff 1; day la phan cong theo ky am.
- Noi tie theo cao do, voice va staff tren truc thoi gian TOAN BAI, ke ca qua vach nhip.
  255 not tie-stop khong duoc dem thanh cu nhan moi. Do ngan theo tie, khong suy pedal.
- Bass thuong vao offset 1. Cua so k o day = [XML k offset 1, XML k+1 offset 1).
  Day la cach can pha de so sanh cau nhac, KHONG khang dinh sheet sai nhip.
- Don vi bang duoi: phach den, offset bat dau tu 0 trong cua so.
- Tai tao: `python -X utf8 -B scripts/audit_ballad_derx.py --output Reference/BALLAD-DERX-EVIDENCE.json`.
  Script chi doc sheet; JSON luu not goc, onset, gate, voice, staff va lua chon be giu lai.

## Hai tay thuc su phoi hop the nao

Khong phai trai rai deu, phai dap deu. Co ba cu chi:

1. Trai giu cum hoa am, phai chen be trong nghich phach.
2. Phai giu be trong, trai chay noi luc cuoi cau.
3. Diep khuc co diem cung nhan de nhan cau, xen diem dap lech va chum ba.

Kiem dem tren cac cua so 4 phach trong hai luot phien (4-19, 32-47), bo cua so dai bat thuong:
195 onset trai, 265 onset phai; 93 moc cung nhan, 172 moc chi phai nhan.
155 onset phai xay ra khi trai con ngan; 89 onset trai khi phai con ngan.
Day la THONG KE TOAN TAY PHAI, CO GIAI DIEU, khong phai 265 cu dap dem.
Khong the lay moi not phai, hoac cu bo not cao nhat, de tu dong tach dem.

## Phien: cua so 4-5, doi chieu 32-33

| Cua so | Tay | Offset : not (gate) |
| --- | --- | --- |
| 4 | Trai | 0: Bb2 F3 A3 (1.5); 1.75: C3 G3 (.75); 2.5: G3 (.5); 3: C4 (1) |
| 4 | Phai giu | 0: D4 (.5); 1.75: E4 (.5); 2.25: G4 (.5); 2.75: G4 (.5) |
| 5 | Trai | 0: D3 A3 C4 (2); 2.25: A2; 2.5: D3; 2.75: E3; 3: F3; 3.25: E3; 3.5: D3; 3.75: C3 (moi not cuoi .25) |
| 5 | Phai giu | 1: F4 (.25); 1.25: F4 (.5); 1.75: F4 (2) |

F4 o 5:1.75 la be duoi trong cum co C5; tie giu den 3.75.
Trai bat dau chay tu 2.25, khi F4 van ngan. Not trai cuoi o 3.75 tiep cau sau.
O 33 lap lai cum F4/C5 tai 1 va 1.25, giu F4 tu 1.75 nhung gate 1.5;
duong bass cuoi cau thay doi. Do do chon MOT mau 4-5, khong noi day la cong thuc moi o.
D4/E4/G4 o 4 duoc giu nhu be trong cua cac cum; bo tuyen dinh A4/C5 va duoi giai dieu.
Lua chon bo/gom giai dieu la bien tap co doi chieu, khong phai du lieu XML danh dau san.

## Diep: cua so 24-25, doi chieu 52-53

Trai 24: Bb1 (.5), Bb2 (.5), Bb3 (1), C2 (.5), C3/G3 (.5), C3/G3 (1)
tai 0, .5, 1, 2, 2.5, 3. Ban 52 thay dau bang Bb2-F3-Bb3 cung onset.
Trai 25: C#3 (.5), A3 (1), D2 (.25), D2 (1), D2 (.75)
tai 0, .5, 1.75, 2, 3.

Phai 24 giu F4 tai 0 va .75; F4/Bb4 tai 4/3, gate 2/3 (CHUM BA, khong lam tron 1.25).
E4/C5 tai 2; C4 tai 2.75; D4/G4 tai 3; E4 tai 3.25; C4 tai 3.5.
Phai 25 giu A4/C#5 tai 0; A4 tai .5 va .75; E4 tai 1; C#5 tai 1.25;
F4/A4 tai 1.75; C4 tai 3.25. Gate chi tiet trong JSON.
24:0, 2, 3 va 25:0, .5, 1.75 la nhung diem hai tay gap nhau.
24:.75, 4/3, 2.75, 3.25, 3.5 la nhung diem phai dap lech.
52-53 co bien tau cao do, nhung nhieu onset/be trong lap lai; khong sao chep melody F5/G5.

## Bien tap de thanh dieu dung voi bai khac

- Phien 8 phach lay 4-5, khac mau 8-9 cua Claude. Diep lay cung 24-25 vi day la
  bang chung tot: khong co ly do doi tiet tau chi de tao su khac biet gia.
- Diep dau trai dung 1-5-8 cua 52 thay ba quang tam Bb1-Bb2-Bb3 cua 24.
- Bass C# cua A/C# trong 25 duoc chuan hoa thanh goc hop am nguoi dung;
  khong ep the dao do len moi bai. Slash nhap vao van do engine hien tai xu ly.
- Giu onset/gate, nhung rut gon quang tam: trai 36-59, phai 60-74.
  C4 cua trai 4:3 va 5:0 ha xuong C3 de tranh trung phim/cat tay khi doi giong.
  Cac giong khac co the gap quang tam theo cung gioi han; khong tuyen bo giu nguyen register sheet.
- Bac 3/5/7 theo hop am dang nhap. Neu khong co bac 7, dung fallback san co cua engine;
  khong tu them maj7/min7. Not noi bac 2 = goc +14 semitone; day la bien tap cho mau chay.
- Sheet doi Bb -> C tai 4:1.75, A -> Dm tai 25:1.75. Dieu KHONG tu doi hop am som:
  timing van giu, cao do theo moc hop am bai nguoi dung. Kiem tra nguon phien bang
  Bbmaj7/C/Dm7 voi do dai 1.75/2.25/4; diep Bb/C/A/Dm7 voi 2/2/1.75/2.25.
  Engine co the rut gon cum trai dau hop am ngan thanh bass, dung quy tac chung hien co.
- Velocity .65/.8/.85 la can bang phat lai do Codex chon, khong do duoc luc tay bieu dien.
  Release ratio 1 giu gate trong cell; doi hop am/ranh gioi doan van cat ngan theo engine.
- Khong bat `cpBalladChordLeads`: tranh them cau dan tu dong vao mau dang kiem.
  Khong train solo, khong sua sheet/corpus/Nguon.json. Fill/solo nguoi dung bat rieng van co the anh huong ket qua.
- `KEEP_RH_RESTS` giu khoang nghi DERX khi hop am ngan khong trung onset; khong tu dap RH de lap khoang trong.

## Kiem tra va nghe duyet

`balladDerx.test.ts` doi onset/gate voi evidence, kiem F4 ngan tren duong bass,
be diep/chum ba, 12 giong x 5 loai hop am x 2 mau voicing, register hai tay,
ranh gioi hop am/doan va ID doc lap. `StylePicker.test.tsx` kiem nut hong,
mot lua chon DERX tu doi phien/diep, Claude giu mau cu. Test Claude van nguyen.
Nghe thu tai app chinh `http://localhost:5173`; day la ban rut gon CHO NGHE DUYET.
Sau khi nguoi dung duyet moi ghi quyet dinh vao SO-TAY theo yeu cau rieng.

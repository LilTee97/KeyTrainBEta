# Chạy KeyTrain trên Android và trên máy tính

App đã đóng gói thành **PWA** — một trang web cài được ra màn hình chính, chạy
toàn màn hình và **dùng được khi mất mạng**, vì toàn bộ mã nằm sẵn trong máy sau
lần mở đầu tiên.

Đóng gói được trọn vẹn vì app không phụ thuộc gì bên ngoài: tiếng đàn do Tone.js
tự tổng hợp chứ không tải mẫu tiếng về, và bài hát lưu ở IndexedDB ngay trong
máy.

## Vì sao không đóng thành file APK

Cắm đàn MIDI qua cáp OTG dựa vào **Web MIDI API**, mà API này chỉ chạy trong
*ngữ cảnh an toàn* — tức `https` hoặc `localhost`. Chrome trên Android hỗ trợ
đầy đủ; còn WebView mà file APK chạy bên trong thì phần xin quyền USB không
chắc chắn, nên đóng APK có nguy cơ mất hẳn tính năng cắm đàn.

Cũng vì lý do đó, **mở app qua `http://192.168...` trên mạng nội bộ sẽ không cắm
đàn được** và cũng không cài ra màn hình chính được. Phải có `https`.

---

## Làm một lần: đưa app lên mạng

1. Tạo một repo trên GitHub (để trống, đừng tick *Add a README*) rồi đẩy mã lên:

   ```
   git remote add origin https://github.com/<tên-bạn>/<tên-repo>.git
   git branch -M main
   git push -u origin main
   ```

   Lần `push` đầu sẽ hiện cửa sổ đăng nhập GitHub. Những lần sau chỉ cần
   `git push`.

2. Vào repo trên GitHub → **Settings** → **Pages** → mục *Build and deployment*,
   chọn **Source: GitHub Actions**.

3. Xong. Quy trình dựng sẵn ở [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
   tự chạy sau mỗi lần đẩy mã lên, và app hiện ở:

   ```
   https://<tên-bạn>.github.io/<tên-repo>/
   ```

   Chạy tay được từ tab **Actions** nếu cần dựng lại mà không có gì để đẩy.

## Cài lên điện thoại Android

Mở đường dẫn trên bằng **Chrome**, rồi menu ⋮ → **Thêm vào Màn hình chính** (hay
**Cài đặt ứng dụng**). Sau đó mở từ icon là chạy toàn màn hình, không thanh địa
chỉ, và không cần mạng nữa.

Cắm đàn: nối cáp OTG rồi bấm nút **Cắm đàn MIDI** trong app — Chrome sẽ hỏi
quyền một lần.

## Trên máy tính

Cùng đường dẫn đó, mở bằng Chrome hoặc Edge. Muốn có icon riêng thì bấm nút cài
đặt ở góc phải thanh địa chỉ.

---

## Lúc đang sửa app thì không cần làm gì ở trên

Chỉ cần:

```
npm run dev
```

rồi mở `http://localhost:5173`. `localhost` cũng là ngữ cảnh an toàn nên **cắm
đàn MIDI vẫn chạy bình thường** ở đây.

Muốn xem thử đúng bản đã đóng gói thì:

```
npm run build
npm run preview
```

## Dùng chung bài hát giữa hai máy

Hai bản cài (điện thoại và máy tính) có kho bài **riêng**, không tự đồng bộ.
Chuyển bài qua lại bằng nút **Xuất file** / **Nhập từ file** ở khung *Bài đã
lưu* — file `.keytrain.json` là văn bản thuần, hệ nào cũng đọc.

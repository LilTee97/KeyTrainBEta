import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Đường dẫn gốc khi đưa app lên mạng.
 *
 * GitHub Pages phục vụ trang ở `.../tên-repo/` chứ không phải ở gốc tên miền,
 * nên mọi đường dẫn tới tệp phải mang tiền tố đó. Quy trình dựng tự điền tên
 * repo vào; chạy ở máy thì cứ là gốc.
 */
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    /*
      Đóng gói thành app cài được (PWA).

      Cần cho việc chạy trên Android: mở bằng Chrome rồi bấm *Cài đặt* là có
      icon ngoài màn hình chính, chạy toàn màn hình không thanh địa chỉ, và
      **dùng được khi mất mạng** vì toàn bộ mã đã nằm sẵn trong máy.

      Đóng gói được trọn vẹn vì app không phụ thuộc gì bên ngoài: tiếng đàn do
      Tone.js tự tổng hợp chứ không tải mẫu tiếng về, và bài hát lưu ở
      IndexedDB ngay trong máy.
    */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        name: 'KeyTrain — luyện piano',
        short_name: 'KeyTrain',
        description:
          'Tái hoà âm theo phong cách đệm hát và luyện đàn theo phần đệm đã dựng.',
        lang: 'vi',
        // Toàn màn hình: bàn phím đàn và bản nhạc cần từng điểm ảnh chiều cao.
        display: 'standalone',
        /*
          Không khoá chiều màn hình. Dựng bài thì cầm dọc đọc lời tiện hơn, còn
          lúc tập với bàn phím ảo thì xoay ngang cho phím rộng ra — để người
          dùng tự xoay theo việc đang làm.
        */
        background_color: '#1c1917',
        theme_color: '#1c1917',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            // Android tự bo tròn icon, bản này đã chừa lề để khỏi bị cắt mất
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Gói sẵn mọi thứ app cần, để lần mở sau không đụng tới mạng nữa.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    watch: {
      /*
        Không theo dõi thư mục tài liệu tham khảo.

        Đó là chỗ để tài liệu và bản nhạc, không phải mã nguồn, nên Vite không
        cần biết tới. Quan trọng hơn: file đang tải về bị Windows khoá lại, mà
        Vite cố theo dõi file bị khoá thì nhận lỗi EBUSY và **sập cả máy chủ**.
        Chuyện này đã xảy ra hai lần khi có người lưu tài liệu vào thẳng đây.
      */
      ignored: [
        '**/Reference/**',
        '**/*.crdownload',
        '**/*.part',
        '**/*.tmp',
      ],
    },
  },
})

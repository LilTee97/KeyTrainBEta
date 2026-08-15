import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

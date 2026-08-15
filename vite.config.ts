import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      /*
        Bỏ qua file tải dở của trình duyệt.

        Chrome tạo file `.crdownload` trong lúc tải, và Windows khoá file đó
        lại. Vite cố theo dõi nó thì nhận lỗi EBUSY và **sập cả máy chủ** —
        chuyện đã xảy ra khi có người lưu tài liệu vào thẳng thư mục dự án.
      */
      ignored: ['**/*.crdownload', '**/*.part', '**/*.tmp'],
    },
  },
})

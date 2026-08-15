import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      /*
        Dùng biến trước khi khai báo.

        Bật luật này vì đúng loại lỗi đó đã làm trắng trang Tái hoà âm **hai
        lần**, và cả hai lần `tsc` đều không bắt được: biến `const` khai báo
        sau nhưng được tham chiếu trong một hàm hoặc trong mảng phụ thuộc của
        `useMemo`, nên TypeScript coi là hợp lệ còn trình duyệt thì ném lỗi
        ngay lúc chạy. Bộ kiểm tra không có chỗ nào dựng thật cây component
        nên cũng không thấy.

        `functions: false` để vẫn khai báo hàm ở cuối file được — hàm được
        nâng lên đầu nên không có rủi ro này.
      */
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, variables: true, typedefs: false },
      ],
    },
  },
)

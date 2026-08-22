/**
 * Module ảo do `pianobrainPlugin.ts` sinh ra lúc dựng. Nội dung là kho
 * PianoBrain đọc từ repo bên cạnh — không có file nào được chép sang đây.
 */
declare module 'virtual:pianobrain-knowledge' {
  export const items: unknown[]
  export const sources: unknown[]
  export const coverage: { skipped: string[]; incomplete: string[] }
}

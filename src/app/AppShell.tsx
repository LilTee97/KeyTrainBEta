import { useEffect, useState } from 'react'
import { armAudioOnFirstGesture } from '../shared/audio/audioEngine'
import { MetronomePanel } from '../earTraining/metronomePanel/MetronomePanel'
import { PracticeHome } from '../reharm/PracticeHome'
import { ReharmHome } from '../reharm/ReharmHome'
import { MrHaiPanel } from '../reharm/brain/MrHaiPanel'
import { MidiDebugPanel } from './debug/MidiDebugPanel'

/**
 * Các tab của app.
 *
 * Phần luyện tai nghe hợp âm đã bỏ khỏi thanh tab — bốn tab *Luyện tai*, *Vòng
 * hợp âm*, *Ôn tập* và *Thống kê* vốn là một hệ khép kín: hai tab đầu nạp bài
 * vào hàng đợi ôn tập, tab thứ ba lấy bài từ hàng đợi đó ra, tab cuối ghi lại
 * câu trả lời của cả ba. Bỏ hai tab đầu mà giữ hai tab sau thì chúng vĩnh viễn
 * trống, nên bỏ cả cụm.
 *
 * Bảng nhịp ở lại: nó không thuộc hệ luyện tai mà là công cụ dùng chung, và
 * phần đệm hát lấy nhịp độ từ chính kho của nó.
 */
const TABS = [
  { id: 'reharm', label: 'Tái hòa âm' },
  { id: 'practice', label: 'Luyện đệm' },
  { id: 'mr-hai', label: 'Mr Hải' },
  { id: 'metronome', label: 'Nhịp' },
  { id: 'debug', label: 'Gỡ lỗi' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AppShell() {
  const [tab, setTab] = useState<TabId>('reharm')

  // Cú bấm đầu tiên vào bất cứ đâu cũng mở khoá tiếng, khỏi cần nút riêng.
  useEffect(armAudioOnFirstGesture, [])

  /*
    Lề hẹp lại trên màn nhỏ. Trên điện thoại mỗi điểm ảnh chiều ngang đều đáng
    giá cho bản nhạc và bàn phím đàn, mà lề rộng kiểu màn hình máy tính thì ăn
    mất gần một phần mười bề ngang.
  */
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-3 py-4 sm:px-4 sm:py-8">
      <header className="mb-4 sm:mb-6">
        <p className="mb-2 font-mono text-[10.5px] tracking-[0.16em] text-amber-key uppercase">
          Luyện piano · Jazz &amp; Pop
        </p>
        <h1 className="text-3xl font-bold">KeyTrain</h1>
      </header>

      <nav className="mb-5 flex flex-wrap gap-2 sm:mb-8">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-amber-key text-ink'
                : 'bg-white/7 text-dim hover:bg-white/12'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/*
        Tab Tái hoà âm **giữ nguyên trong cây** khi sang tab khác, chỉ ẩn đi.

        Mọi tab còn lại tháo ra khi rời đi, và đó là đúng — chúng không giữ gì
        đáng tiếc. Nhưng tab này giữ cả bài đang dựng: lời đã dán, cách chia
        đoạn, thứ tự chơi, mốc chuyển đoạn. Tháo ra là mất sạch, mà người dùng
        phải qua lại giữa nó và tab Luyện đệm suốt.
      */}
      <div hidden={tab !== 'reharm'}>
        <ReharmHome />
      </div>

      {tab === 'practice' && <PracticeHome />}
      {tab === 'mr-hai' && <MrHaiPanel />}
      {tab === 'metronome' && <MetronomePanel />}
      {tab === 'debug' && <MidiDebugPanel />}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { armAudioOnFirstGesture } from '../shared/audio/audioEngine'
import { readSetting, writeSetting } from '../shared/persistence/localSettings'
import { MetronomePanel } from '../earTraining/metronomePanel/MetronomePanel'
import { ChordDrillHome } from '../reharm/chordDrill/ChordDrillHome'
import { PracticeHome } from '../reharm/PracticeHome'
import { ReharmHome } from '../reharm/ReharmHome'
import { MrHaiPanel } from '../reharm/brain/MrHaiPanel'
import { HopAmPage } from '../thay/HopAmPage'
import { TeacherPage } from '../thay/TeacherPage'
import { TodayPage } from '../thay/TodayPage'
import { TEACHERS, type TeacherId } from '../thay/teachers'
import { MidiDebugPanel } from './debug/MidiDebugPanel'

/**
 * Các tab của trang Tái Hòa Âm — sáu tab cũ của app, gom thành một trang (người dùng 2/10/2026).
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
  { id: 'chords', label: 'Học hợp âm' },
  { id: 'mr-hai', label: 'Mr Hải' },
  { id: 'metronome', label: 'Nhịp' },
  { id: 'debug', label: 'Gỡ lỗi' },
] as const

type TabId = (typeof TABS)[number]['id']

/**
 * Các trang — ý người dùng 2/10/2026 (`Reference/KE-HOACH-LUYEN-TAP.md` mục 4c): một trang mỗi thầy (Cà Pháo · Linh Nhi ·
 * Tuấn · Blues), trang Hôm nay mở đầu, sáu tab cũ gom vào trang Tái Hòa Âm. Mở app luôn vào Hôm nay — buổi tập mỗi ngày bắt đầu
 * bằng lượt nguội ở đó; trong trang Tái Hòa Âm thì nhớ tab mở lần cuối.
 */
type PageId = 'hom-nay' | TeacherId | 'hop-am' | 'tai-hoa-am'

const PAGES: readonly { id: PageId; label: string }[] = [
  { id: 'hom-nay', label: 'Hôm nay' },
  ...TEACHERS.map(({ id, label }) => ({ id, label })),
  // Trang Hợp âm — chung cho mọi thầy (người dùng chốt 9/10/2026): chồng hợp âm, hợp âm màu, tái hòa âm vòng.
  { id: 'hop-am', label: 'Hợp âm' },
  { id: 'tai-hoa-am', label: 'Tái Hòa Âm' },
]

const savedTab = (): TabId => {
  const id = readSetting('taiHoaAmTab')
  return TABS.find((tab) => tab.id === id)?.id ?? 'reharm'
}

export function AppShell() {
  const [page, setPage] = useState<PageId>('hom-nay')
  /* Trang Hôm nay bấm "Tập" → mở trang thầy đúng bài, đúng bậc. Bấm hàng trang thì bỏ. */
  const [moBai, setMoBai] = useState<{ styleId: string; bac?: number } | null>(null)
  const moTrang = (id: PageId) => {
    setPage(id)
    setMoBai(null)
  }
  const [tab, setTab] = useState<TabId>(savedTab)
  const openTab = (id: TabId) => {
    setTab(id)
    writeSetting('taiHoaAmTab', id)
  }
  const teacher = TEACHERS.find((one) => one.id === page)

  // Cú bấm đầu tiên vào bất cứ đâu cũng mở khoá tiếng, khỏi cần nút riêng.
  useEffect(armAudioOnFirstGesture, [])

  /*
    Lề hẹp lại trên màn nhỏ. Trên điện thoại mỗi điểm ảnh chiều ngang đều đáng
    giá cho bản nhạc và bàn phím đàn, mà lề rộng kiểu màn hình máy tính thì ăn
    mất gần một phần mười bề ngang.

    Trang tập (Hôm nay, trang thầy) và tab Luyện đệm rộng gần hết màn (tối đa 1800 px) — người dùng 2/10/2026: "khung phím
    đàn còn quá bé", "Mỗi một trang của từng thầy đều có khung nốt rơi ... kích cỡ như của tab Luyện đệm". Các tab chữ khác
    giữ 768 px (max-w-3xl) cho dòng chữ dễ đọc.
  */
  const wide = page !== 'tai-hoa-am' || tab === 'practice'

  return (
    <div
      className={`mx-auto flex min-h-full w-full flex-col px-3 py-4 sm:px-4 sm:py-8 ${
        wide ? 'max-w-[1800px]' : 'max-w-3xl'
      }`}
    >
      <header className="mb-4 sm:mb-6">
        <p className="mb-2 font-mono text-[10.5px] tracking-[0.16em] text-amber-key uppercase">
          Luyện piano · Jazz &amp; Pop
        </p>
        <h1 className="text-3xl font-bold">KeyTrain</h1>
      </header>

      {/* Hàng trang — điện thoại hẹp thì vuốt ngang. */}
      <nav className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {PAGES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => moTrang(id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              page === id ? 'bg-amber-key text-ink' : 'bg-white/7 text-dim hover:bg-white/12'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {page === 'tai-hoa-am' && (
        <nav className="mb-5 flex flex-wrap gap-1.5 sm:mb-8">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => openTab(id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === id
                  ? 'border-amber-key bg-amber-key/15 text-amber-key'
                  : 'border-line bg-white/4 text-dim hover:bg-white/8'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      {/*
        Tab Tái hoà âm **giữ nguyên trong cây** khi sang tab hay trang khác, chỉ ẩn đi.

        Mọi tab còn lại tháo ra khi rời đi, và đó là đúng — chúng không giữ gì
        đáng tiếc. Nhưng tab này giữ cả bài đang dựng: lời đã dán, cách chia
        đoạn, thứ tự chơi, mốc chuyển đoạn. Tháo ra là mất sạch, mà người dùng
        phải qua lại giữa nó và tab Luyện đệm suốt — và tab Luyện đệm nhờ nó dựng bài.
      */}
      <div hidden={!(page === 'tai-hoa-am' && tab === 'reharm')}>
        <ReharmHome />
      </div>

      {page === 'hom-nay' && (
        <TodayPage
          onTap={(thay, styleId, bac) => {
            setMoBai({ styleId, bac })
            setPage(thay)
          }}
        />
      )}
      {teacher && <TeacherPage key={teacher.id} teacher={teacher} moBai={moBai} />}
      {page === 'hop-am' && <HopAmPage />}

      {page === 'tai-hoa-am' && (
        <>
          {tab === 'practice' && <PracticeHome />}
          {tab === 'chords' && <ChordDrillHome />}
          {tab === 'mr-hai' && <MrHaiPanel />}
          {tab === 'metronome' && <MetronomePanel />}
          {tab === 'debug' && <MidiDebugPanel />}
        </>
      )}
    </div>
  )
}

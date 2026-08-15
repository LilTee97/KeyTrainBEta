import { useState } from 'react'
import { ChordRecognitionDrill } from '../earTraining/chordRecognition/ChordRecognitionDrill'
import { MetronomePanel } from '../earTraining/metronomePanel/MetronomePanel'
import { ProgressionTrainer } from '../earTraining/progressionTrainer/ProgressionTrainer'
import { ReviewSessionPage } from '../earTraining/srs/ReviewSessionPage'
import { StatsPage } from '../earTraining/stats/StatsPage'
import { ReharmHome } from '../reharm/ReharmHome'
import { MidiDebugPanel } from './debug/MidiDebugPanel'

const TABS = [
  { id: 'ear', label: 'Luyện tai' },
  { id: 'progression', label: 'Vòng hợp âm' },
  { id: 'review', label: 'Ôn tập' },
  { id: 'metronome', label: 'Nhịp' },
  { id: 'reharm', label: 'Tái hòa âm' },
  { id: 'stats', label: 'Thống kê' },
  { id: 'debug', label: 'Gỡ lỗi' },
] as const

type TabId = (typeof TABS)[number]['id']

export function AppShell() {
  const [tab, setTab] = useState<TabId>('ear')

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-8">
      <header className="mb-6">
        <p className="mb-2 font-mono text-[10.5px] tracking-[0.16em] text-amber-key uppercase">
          Luyện piano · Jazz &amp; Pop
        </p>
        <h1 className="text-3xl font-bold">KeyTrain</h1>
      </header>

      <nav className="mb-8 flex flex-wrap gap-2">
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

      {tab === 'ear' && <ChordRecognitionDrill />}
      {tab === 'progression' && <ProgressionTrainer />}
      {tab === 'review' && <ReviewSessionPage />}
      {tab === 'metronome' && <MetronomePanel />}
      {tab === 'reharm' && <ReharmHome />}
      {tab === 'stats' && <StatsPage />}
      {tab === 'debug' && <MidiDebugPanel />}
    </div>
  )
}

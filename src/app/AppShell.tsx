const SECTIONS = ['Luyện tai', 'Tái hòa âm', 'Thống kê'] as const

export function AppShell() {
  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-8">
      <header className="mb-6">
        <p className="mb-2 font-mono text-[10.5px] tracking-[0.16em] text-amber-key uppercase">
          Luyện piano · Jazz &amp; Pop
        </p>
        <h1 className="text-3xl font-bold">KeyTrain</h1>
      </header>

      <nav className="mb-8 flex gap-2">
        {SECTIONS.map((name) => (
          <span
            key={name}
            className="rounded-lg bg-white/7 px-4 py-2 text-sm font-semibold text-dim"
          >
            {name}
          </span>
        ))}
      </nav>

      <p className="text-sm leading-relaxed text-dim">
        Scaffold đã chạy. Các mục ở trên là chỗ dành sẵn — chưa nối vào tính
        năng nào.
      </p>
    </div>
  )
}

function PageIntro({ eyebrow, title, description, aside, actions, stats = [] }) {
  return (
    <section className="section-space pb-8 sm:pb-10">
      <div className="shell">
        <div className="panel relative grid gap-10 overflow-hidden px-6 py-10 sm:px-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(240,178,75,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(213,91,54,0.08),transparent_24%)]" />
          <div className="relative space-y-6">
            <span className="eyebrow">{eyebrow}</span>
            <div className="space-y-4">
              <h1 className="page-title">{title}</h1>
              <p className="page-copy max-w-2xl">{description}</p>
            </div>
            {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
            {stats.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="metric-card">
                    <p className="text-xl font-extrabold text-[color:var(--brand)]">{item.value}</p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{item.label}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="panel-soft relative flex min-h-56 items-center justify-center p-8 text-center text-sm leading-7 text-[color:var(--muted)]">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[color:var(--line)] to-transparent" />
            {aside}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageIntro;

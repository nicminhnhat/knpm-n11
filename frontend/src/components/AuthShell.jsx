function AuthShell({ badge, title, description, highlights = [], aside, children }) {
  return (
    <div className="panel overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative overflow-hidden bg-[color:var(--ink)] px-6 py-8 text-white sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(240,178,75,0.25),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" />
          <div className="relative space-y-6">
            <span className="pill-tag border-white/10 bg-white/10 text-white">{badge}</span>
            <div className="space-y-4">
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">{title}</h2>
              <p className="text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
            </div>
            {highlights.length > 0 ? (
              <div className="grid gap-3">
                {highlights.map((item) => (
                  <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            ) : null}
            {aside}
          </div>
        </aside>

        <div className="bg-[color:var(--surface-strong)] px-6 py-8 sm:px-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}

export default AuthShell;

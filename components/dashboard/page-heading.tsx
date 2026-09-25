import type { ReactNode } from "react"

export function PageHeading({ eyebrow, title, description, icon, actions }: { eyebrow?: string; title: string; description: string; icon?: ReactNode; actions?: ReactNode }) {
  return <section className="flex flex-col gap-4 border-b border-primary/20 pb-5 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-3">
      {icon && <div className="rounded border border-teal-400/20 bg-teal-400/10 p-2 text-teal-200">{icon}</div>}
      <div>
        {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary/80">{eyebrow}</p>}
        <h1 className="font-mono text-2xl font-semibold text-teal-50">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    {actions}
  </section>
}

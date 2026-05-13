import { Link } from "react-router-dom";
import { normalizeRoom } from "../lib/api.js";
import { Icon } from "./Icons.jsx";

function statusBadgeClass(status) {
  const classes = {
    AVAILABLE: "bg-emerald-500/95 text-white ring-emerald-200/70",
    RENTED: "bg-rose-500/95 text-white ring-rose-200/70",
    HIDDEN: "bg-slate-600/95 text-white ring-slate-200/70",
    PENDING: "bg-amber-500/95 text-white ring-amber-200/70",
    APPROVED: "bg-sky-500/95 text-white ring-sky-200/70",
    REJECTED: "bg-orange-500/95 text-white ring-orange-200/70"
  };
  return classes[status] || "bg-[color:var(--ink)]/90 text-white ring-white/50";
}

function RoomCard({ room }) {
  const item = normalizeRoom(room);
  if (!item) return null;

  return (
    <Link
      to={`/rooms/${item.id}`}
      className="group panel-soft overflow-hidden transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(23,50,77,0.12)]"
    >
      <div className="relative overflow-hidden">
        <img
          alt={item.title}
          className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
          src={item.image}
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs font-bold text-[color:var(--ink)]">
          {item.category}
        </div>
        <div className={`absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] ring-2 backdrop-blur ${statusBadgeClass(item.status)}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
          <span>{item.statusLabel || "Trang thai"}</span>
        </div>
        <div className="absolute bottom-4 left-4 rounded-full bg-white/88 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand)] backdrop-blur">
          {item.priceLabel}
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h3 className="text-lg font-bold leading-7 text-[color:var(--ink)]">{item.title}</h3>
          <div className="flex items-start gap-2 text-sm leading-6 text-[color:var(--muted)]">
            <Icon className="mt-0.5 h-4 w-4 text-[color:var(--brand)]" name="pin" />
            <span>{item.address}</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">{item.postedDateLabel}</p>
        </div>
        <div className="flex items-center justify-between border-t border-[color:var(--line)] pt-4">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <Icon className="h-4 w-4 text-[color:var(--ink)]" name="ruler" />
            <span>{item.areaLabel}</span>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[color:var(--brand)]">
            <span>Xem chi tiết</span>
            <Icon className="h-4 w-4" name="arrow-right" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default RoomCard;

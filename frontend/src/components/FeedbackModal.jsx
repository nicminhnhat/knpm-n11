function FeedbackModal({ dialog, onClose, onConfirm, onSubmitText }) {
  if (!dialog) return null;

  const typeStyle = {
    success: {
      badge: "bg-emerald-100 text-emerald-700",
      icon: "✓",
      title: dialog.title || "Thành công"
    },
    error: {
      badge: "bg-red-100 text-red-700",
      icon: "!",
      title: dialog.title || "Không thể thực hiện"
    },
    warning: {
      badge: "bg-amber-100 text-amber-700",
      icon: "!",
      title: dialog.title || "Cần bổ sung thông tin"
    },
    confirm: {
      badge: "bg-orange-100 text-[color:var(--brand)]",
      icon: "?",
      title: dialog.title || "Xác nhận thao tác"
    },
    input: {
      badge: "bg-orange-100 text-[color:var(--brand)]",
      icon: "i",
      title: dialog.title || "Nhập thông tin"
    },
    select: {
      badge: "bg-orange-100 text-[color:var(--brand)]",
      icon: "i",
      title: dialog.title || "Lựa chọn"
    }
  }[dialog.type || "success"];

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("value") || "").trim();
    if (dialog.required && !value) return;
    onSubmitText?.(value);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.25)]">
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold ${typeStyle.badge}`}>
            {typeStyle.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-extrabold text-[color:var(--ink)]">{typeStyle.title}</h3>
            {dialog.message ? <p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{dialog.message}</p> : null}
          </div>
        </div>

        {dialog.type === "input" || dialog.type === "select" ? (
          <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
            {dialog.type === "select" ? (
              <select className="input-shell" name="value" defaultValue={dialog.defaultValue || ""}>
                {dialog.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : dialog.multiline ? (
              <textarea
                autoFocus
                className="input-shell min-h-28"
                defaultValue={dialog.defaultValue || ""}
                name="value"
                placeholder={dialog.placeholder || "Nhập nội dung"}
              />
            ) : (
              <input
                autoFocus
                className="input-shell"
                defaultValue={dialog.defaultValue || ""}
                name="value"
                placeholder={dialog.placeholder || "Nhập nội dung"}
              />
            )}
            {dialog.required ? <p className="text-xs font-semibold text-red-600">Vui lòng nhập nội dung trước khi xác nhận.</p> : null}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="button-secondary" type="button" onClick={onClose}>
                {dialog.cancelLabel || "Hủy"}
              </button>
              <button className="button-primary" type="submit">
                {dialog.confirmLabel || "Xác nhận"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            {dialog.type === "confirm" ? (
              <>
                <button className="button-secondary" type="button" onClick={onClose}>
                  {dialog.cancelLabel || "Hủy"}
                </button>
                <button className="button-primary" type="button" onClick={onConfirm}>
                  {dialog.confirmLabel || "Xác nhận"}
                </button>
              </>
            ) : (
              <button className="button-primary sm:min-w-32" type="button" onClick={onClose}>
                Đóng
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;

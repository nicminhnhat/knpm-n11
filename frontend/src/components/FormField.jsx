function FormField({
  icon,
  label,
  note,
  placeholder,
  type = "text",
  textarea = false,
  wrapperClassName = "",
  className = "",
  ...props
}) {
  const controlClassName = [
    "input-shell",
    icon ? "pl-11" : "",
    textarea ? "min-h-36 resize-none" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={["field-label", wrapperClassName].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
            {icon}
          </span>
        ) : null}
        {textarea ? (
          <textarea className={controlClassName} placeholder={placeholder} {...props} />
        ) : (
          <input className={controlClassName} placeholder={placeholder} type={type} {...props} />
        )}
      </div>
      {note ? <span className="field-note">{note}</span> : null}
    </label>
  );
}

export default FormField;

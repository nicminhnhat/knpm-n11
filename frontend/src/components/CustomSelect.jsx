import { Children, useEffect, useMemo, useRef, useState } from "react";

function normalizeChildren(children) {
  return Children.toArray(children)
    .filter((child) => child?.props)
    .map((child) => ({
      value: String(child.props.value ?? ""),
      label: child.props.children,
      disabled: Boolean(child.props.disabled)
    }));
}

function CustomSelect({
  value,
  onChange,
  onValueChange,
  options,
  children,
  placeholder = "Chọn mục",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  name
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectOptions = useMemo(() => {
    if (Array.isArray(options)) {
      return options.map((option) => ({
        value: String(option.value ?? ""),
        label: option.label ?? option.value,
        disabled: Boolean(option.disabled)
      }));
    }
    return normalizeChildren(children);
  }, [children, options]);
  const current = selectOptions.find((option) => option.value === String(value ?? ""));

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function choose(option) {
    if (option.disabled) return;
    onValueChange?.(option.value);
    onChange?.({ target: { name, value: option.value } });
    setIsOpen(false);
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        className={`input-shell flex min-h-14 w-full items-center justify-between gap-3 bg-white pr-4 text-left font-semibold leading-6 transition hover:border-[color:var(--brand)] focus:-translate-y-0.5 focus:shadow-[0_14px_35px_rgba(22,50,74,0.08)] ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${buttonClassName}`}
        disabled={disabled}
        onClick={() => setIsOpen((currentOpen) => !currentOpen)}
        type="button"
      >
        <span className={current ? "truncate text-[color:var(--ink)]" : "truncate text-[color:var(--muted)]"}>{current?.label || placeholder}</span>
        <span className={`shrink-0 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {isOpen ? (
        <div className={`absolute left-0 right-0 top-[calc(100%+0.55rem)] z-[1200] max-h-64 overflow-y-auto rounded-[1.35rem] border border-[color:var(--line)] bg-white p-2 shadow-[0_22px_60px_rgba(22,50,74,0.18)] ${menuClassName}`}>
          {selectOptions.map((option) => (
            <button
              className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-extrabold transition ${String(value ?? "") === option.value ? "bg-[color:var(--accent-soft)] text-[color:var(--brand)]" : "text-[color:var(--ink)] hover:bg-[color:var(--surface)] hover:text-[color:var(--brand)]"} ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={option.disabled}
              key={option.value || String(option.label)}
              onClick={() => choose(option)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default CustomSelect;

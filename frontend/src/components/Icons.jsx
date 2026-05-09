function wrap(path, className = "h-5 w-5") {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {path}
    </svg>
  );
}

export function Icon({ name, className }) {
  switch (name) {
    case "menu":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />, className);
    case "close":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />, className);
    case "phone":
      return wrap(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 4.5c0 9.113 7.387 16.5 16.5 16.5h1.5a1.5 1.5 0 001.5-1.5v-2.758a1.5 1.5 0 00-1.114-1.449l-2.958-.74a1.5 1.5 0 00-1.539.53l-.65.867a1.5 1.5 0 01-1.794.494 13.498 13.498 0 01-6.138-6.138 1.5 1.5 0 01.494-1.794l.867-.65a1.5 1.5 0 00.53-1.539l-.74-2.958A1.5 1.5 0 007.258 2.25H4.5A1.5 1.5 0 003 3.75v.75z"
        />,
        className
      );
    case "mail":
      return wrap(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 7.5v9A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5v-9m19.5 0A2.25 2.25 0 0019.5 5.25h-15A2.25 2.25 0 002.25 7.5m19.5 0l-8.69 5.52a2.25 2.25 0 01-2.12 0L2.25 7.5"
        />,
        className
      );
    case "map":
      return wrap(
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25l-5.25-2.625V5.625L9 3l6 2.625L20.25 3v12l-5.25 2.625L9 15l-6 2.625" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v12m6-9.375v12" />
        </>,
        className
      );
    case "pin":
      return wrap(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm0 0c0 5.25-3 8.25-3 8.25s-3-3-3-8.25a3 3 0 116 0z"
        />,
        className
      );
    case "ruler":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75L3.75 7.5l12.75 12.75 3.75-3.75L7.5 3.75zm3 3l1.5 1.5m-3 0l1.5 1.5m-3 0L9 12m4.5-1.5L15 12m-3 0l1.5 1.5" />, className);
    case "search":
      return wrap(
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
          <circle cx="11" cy="11" r="6" />
        </>,
        className
      );
    case "shield":
      return wrap(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7.5 3v5.25c0 4.424-3.14 8.37-7.5 9.75-4.36-1.38-7.5-5.326-7.5-9.75V6L12 3z"
        />,
        className
      );
    case "spark":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18l-.813-2.096a4.5 4.5 0 00-2.591-2.591L3.5 12l2.096-.813a4.5 4.5 0 002.591-2.591L9 6.5l.813 2.096a4.5 4.5 0 002.591 2.591L14.5 12l-2.096.813a4.5 4.5 0 00-2.591 2.591zM18 9l.375.75L19.125 10l-.75.375L18 11.125l-.375-.75L16.875 10l.75-.25L18 9zm0 6l.375.75L19.125 16l-.75.375L18 17.125l-.375-.75L16.875 16l.75-.25L18 15z" />, className);
    case "handshake":
      return wrap(
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 12l2.25 2.25a2.121 2.121 0 003 0l1.5-1.5a2.121 2.121 0 013 0L21 15.75m-16.5-8.25l3-3a2.121 2.121 0 013 0l1.5 1.5a2.121 2.121 0 003 0L18 3.75m-13.5 18V9.75"
        />,
        className
      );
    case "arrow-right":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6-6m6 6l-6 6" />, className);
    case "arrow-up":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0L6.75 9.75M12 4.5l5.25 5.25" />, className);
    case "user":
      return wrap(
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a7.5 7.5 0 0115 0" />
        </>,
        className
      );
    case "lock":
      return wrap(
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.875a4.5 4.5 0 10-9 0V10.5" />
          <rect x="5.25" y="10.5" width="13.5" height="9.75" rx="2.25" />
        </>,
        className
      );
    case "check":
      return wrap(<path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l4.5 4.5 10.5-10.5" />, className);
    default:
      return wrap(<circle cx="12" cy="12" r="8" />, className);
  }
}

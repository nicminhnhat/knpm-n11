function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-3">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <div className="space-y-3">
          <h2 className="section-heading">{title}</h2>
          {description ? <p className="page-copy max-w-2xl">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default SectionHeader;

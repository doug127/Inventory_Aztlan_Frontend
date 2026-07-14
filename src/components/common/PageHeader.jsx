export function PageHeader({
  title,
  description,
  actions,
  className = "",
  actionsClassName = "",
  actionsPosition = "center",
}) {
  const actionItems = Array.isArray(actions)
    ? actions
    : actions
      ? [actions]
      : [];

  const positionClass =
    {
      top: "self-start",
      center: "self-center",
      bottom: "self-end",
    }[actionsPosition] || "self-center";

  return (
    <div
      className={[
        "mb-6 flex justify-between gap-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actionItems.length > 0 && (
        <div
          className={[
            "flex shrink-0 items-center gap-2",
            positionClass,
            actionsClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {actionItems.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      )}
    </div>
  );
}
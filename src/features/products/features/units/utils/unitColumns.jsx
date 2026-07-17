export const unitColumns = [
  {
    key: "name",
    title: "Unidad",
    width: "w-[28%] min-w-[220px]",
    field: "name",
    className: "text-sm font-medium text-gray-900",
  },
  {
    key: "code",
    title: "Código",
    width: "w-[12%] min-w-[110px]",
    field: "code",
    className: "text-xs font-mono text-gray-500",
  },
  {
    key: "base_unit",
    title: "Unidad Base",
    width: "w-[28%] min-w-[220px]",
    field: "base_unit.name",
    className: "text-sm text-gray-700",
    render: (row) => {
      const value = row?.base_unit?.name ?? row?.base_unit?.code ?? null;
      return value ?? 'Und.Base';
    },
  },
  {
    key: "conversion_factor",
    title: "Factor",
    width: "w-[16%] min-w-[140px]",
    field: "conversion_factor",
    className: "text-sm text-gray-700",
  },
];
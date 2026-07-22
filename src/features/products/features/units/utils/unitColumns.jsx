export const unitColumns = [
  {
    key: "name",
    title: "Unidad",
    width: "w-[15%] min-w-[180px] min-[1440px]:min-w-0",
    field: "name",
    className: "text-sm font-medium text-gray-900",
  },
  {
    key: "code",
    title: "Código",
    width: "w-[8%] min-w-[110px] min-[1440px]:min-w-0",
    field: "code",
    className: "text-xs font-mono text-gray-500",
  },
  {
    key: "base_unit",
    title: "Unidad Base",
    width: "w-[10%] min-w-[220px] min-[1440px]:min-w-0",
    field: "base_unit.name",
    className: "text-sm text-gray-700",
    render: (row) => row?.base_unit?.name ?? row?.base_unit?.code ?? 'Und.Base',
  },
  {
    key: "conversion_factor",
    title: "Factor",
    width: "w-[10%] min-w-[140px] min-[1440px]:min-w-0",
    field: "conversion_factor",
    className: "text-sm text-gray-700",
  },
  {
    key: "is_active",
    title: "Estado",
    width: "w-[12%] min-w-[140px] min-[1440px]:min-w-0",
    field: "conversion_factor",
    className: "text-sm text-gray-500",
    render: (unit) => (unit.is_active ? 'Activo' : 'Eliminado'),
  },
];
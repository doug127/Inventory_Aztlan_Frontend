// Paleta Agrícola Aztlan. Fuente para JS (gráficos, animaciones con framer-motion); en CSS los mismos
// valores son tokens de src/index.css (bg-bosque, text-gris-vegetal… y la escala forest/ink/sand/line).
export const palette = {
  bosque: { hex: '#285C45', use: 'Marca · acción principal' },
  hoja: { hex: '#477A59', use: 'Apoyo · estados positivos' },
  cana: { hex: '#8EBA43', use: 'Acento · acción en oscuro' },
  menta: { hex: '#DDEAD9', use: 'Selección · fondos suaves' },
  cosecha: { hex: '#BE9659', use: 'Atención · acento cálido' },
  arena: { hex: '#EEE6D7', use: 'Avisos · superficies cálidas' },
  niebla: { hex: '#F4F7F2', use: 'Fondo claro · texto oscuro' },
  blanco: { hex: '#FFFFFF', use: 'Tarjetas en modo claro' },
  grafito: { hex: '#17261F', use: 'Fondo oscuro · texto claro' },
  pizarra: { hex: '#263A30', use: 'Tarjetas en modo oscuro' },
  salvia: { hex: '#A8B8AC', use: 'Texto secundario oscuro' },
  grisVegetal: { hex: '#58695E', use: 'Texto secundario claro' },
}

/** Roles de la interfaz (modo claro). */
export const colors = {
  primary: palette.bosque.hex,
  secondary: palette.hoja.hex,
  accent: palette.cana.hex,
  support: palette.cosecha.hex,
  cta: palette.bosque.hex,
  background: palette.niebla.hex,
  surface: palette.blanco.hex,
  border: '#D5DED2',
  textPrimary: palette.grafito.hex,
  textSecondary: palette.grisVegetal.hex,
  error: '#DC2626',
  warning: palette.cosecha.hex,
  success: palette.hoja.hex,
  sidebar: palette.bosque.hex,
}

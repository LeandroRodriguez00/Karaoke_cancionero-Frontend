// Normaliza texto para hacer búsqueda insensible a mayúsculas/acentos
export const normalizeText = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita diacríticos
    .trim()

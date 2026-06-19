export interface Variante {
  id: number;
  talle: string;
  color: string;
  stock: number;
  codigoBarras: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Product {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  imagenUrl: string;
  activo: boolean;
  categoria: Categoria;
  variantes: Variante[];
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ProductoRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  marca: string;
  imagenUrl?: string;
  categoriaId: number;
  variantes?: VarianteRequest[];
}

export interface VarianteRequest {
  talle: string;
  color: string;
  stock: number;
  codigoBarras?: string;
}

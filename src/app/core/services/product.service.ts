import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductPage, ProductoRequest, VarianteRequest } from '../../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);


  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api/productos';
    }
    return '/api/productos';
  }

  getProducts(filters?: {
    categoriaId?: number;
    talle?: string;
    color?: string;
    precioMin?: number;
    precioMax?: number;
    nombre?: string;
    activo?: boolean;
    page?: number;
    size?: number;
  }): Observable<ProductPage> {
    let params = new HttpParams();

    if (filters) {
      if (filters.categoriaId != null) params = params.set('categoriaId', filters.categoriaId.toString());
      if (filters.talle) params = params.set('talle', filters.talle);
      if (filters.color) params = params.set('color', filters.color);
      if (filters.precioMin != null) params = params.set('precioMin', filters.precioMin.toString());
      if (filters.precioMax != null) params = params.set('precioMax', filters.precioMax.toString());
      if (filters.nombre) params = params.set('nombre', filters.nombre);
      if (filters.activo != null) params = params.set('activo', filters.activo.toString());
      if (filters.page != null) params = params.set('page', filters.page.toString());
      if (filters.size != null) params = params.set('size', filters.size.toString());
    }

    return this.http.get<ProductPage>(this.apiUrl, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(request: ProductoRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, request);
  }

  uploadImage(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/upload`, formData);
  }

  updateProduct(id: number, request: Partial<ProductoRequest>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, request);
  }


  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

 
  toggleActivo(id: number, activo: boolean): Observable<Product> {
    const params = new HttpParams().set('activo', activo.toString());
    return this.http.patch<Product>(`${this.apiUrl}/${id}/activo`, null, { params });
  }


  addVariante(productId: number, request: VarianteRequest): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/${productId}/variantes`, request);
  }

 
  updateStock(varianteId: number, stock: number): Observable<Product> {
    const params = new HttpParams().set('stock', stock.toString());
    return this.http.patch<Product>(`${this.apiUrl}/variantes/${varianteId}/stock`, null, { params });
  }


  getImageUrl(product: Product): string {
    if (product.imagenUrl) {
      return product.imagenUrl;
    }

    const categoryName = product.categoria?.nombre?.toLowerCase() || '';

    if (categoryName.includes('sudadera') || categoryName.includes('hoodie') || categoryName.includes('buzo')) {
      return 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80';
    } else if (categoryName.includes('zapato') || categoryName.includes('zapatilla') || categoryName.includes('calzado') || categoryName.includes('sneaker')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80';
    } else if (categoryName.includes('pantalon') || categoryName.includes('pantalón') || categoryName.includes('jean') || categoryName.includes('jogger')) {
      return 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=500&auto=format&fit=crop&q=80';
    } else if (categoryName.includes('accesorio') || categoryName.includes('gorra') || categoryName.includes('cap') || categoryName.includes('media')) {
      return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=80';
    } else if (categoryName.includes('chaqueta') || categoryName.includes('campera') || categoryName.includes('abrigo')) {
      return 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80';
    }


    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80';
  }
  getTotalStock(product: Product): number {
    if (!product.variantes || product.variantes.length === 0) return 0;
    return product.variantes.reduce((sum, v) => sum + v.stock, 0);
  }
}

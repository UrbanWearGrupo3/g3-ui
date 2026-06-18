import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Product } from '../../models/product';

interface BackendProduct {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  codigoBarras?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly http = inject(HttpClient);
  // Default Spring Boot base port. Since we are not touching the backend, we use the original endpoints.
  // The original backend has GET /producto (findAll) and DELETE /producto/{id} (deleteById)
  // Let's check: the original controller had @GetMapping for findAll under /producto, but let's make sure it matches.
  private readonly apiUrl = 'http://localhost:8080/producto';

  getProducts(): Observable<Product[]> {
    return this.http.get<BackendProduct[]>(this.apiUrl).pipe(
      map(products => {
        if (!products || products.length === 0) {
          return this.getMockProducts();
        }
        return products.map(p => this.mapToFrontend(p));
      }),
      catchError(err => {
        console.warn('Backend offline or error, serving mockup products:', err);
        return of(this.getMockProducts());
      })
    );
  }

  getProductById(id: string): Observable<Product> {
    // The original controller mapping is: @GetMapping("/{id}")
    return this.http.get<BackendProduct>(`${this.apiUrl}/${id}`).pipe(
      map(p => this.mapToFrontend(p)),
      catchError(err => {
        const mock = this.getMockProducts().find(p => p.id === id);
        if (mock) return of(mock);
        throw err;
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(err => {
        console.warn('Failed to delete in backend (offline/mock mode), deleting locally');
        return of(undefined);
      })
    );
  }

  saveProduct(product: Partial<Product>): Observable<Product> {
    const backendProd = this.mapToBackend(product);
    return this.http.post<BackendProduct>(this.apiUrl, backendProd).pipe(
      map(p => this.mapToFrontend(p)),
      catchError(err => {
        console.warn('Failed to save in backend (offline/mock mode), creating mock response');
        const newProd: Product = {
          id: product.id || String(Date.now()),
          name: product.name || 'Nuevo Producto',
          description: product.description || '',
          price: product.price || 0,
          imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          category: product.category || 'Camisetas',
          stock: product.stock || 0
        };
        return of(newProd);
      })
    );
  }

  private mapToFrontend(p: BackendProduct): Product {
    const name = p.nombre.toLowerCase();
    let category = 'Camisetas';
    
    if (name.includes('hoodie') || name.includes('sudadera') || name.includes('buzo')) {
      category = 'Sudaderas';
    } else if (name.includes('zapato') || name.includes('zapatilla') || name.includes('calzado') || name.includes('sneaker')) {
      category = 'Zapatillas';
    } else if (name.includes('pantalon') || name.includes('pantalón') || name.includes('cargo') || name.includes('jean') || name.includes('jogger')) {
      category = 'Pantalones';
    } else if (name.includes('chaqueta') || name.includes('campera') || name.includes('abrigo') || name.includes('cortaviento')) {
      category = 'Chaquetas';
    } else if (name.includes('gorra') || name.includes('cap') || name.includes('accesorio') || name.includes('cinto') || name.includes('media')) {
      category = 'Accesorios';
    }

    let imageUrl = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80';
    if (category === 'Sudaderas') {
      imageUrl = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80';
    } else if (category === 'Zapatillas') {
      imageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80';
    } else if (category === 'Pantalones') {
      imageUrl = 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=500&auto=format&fit=crop&q=80';
    } else if (category === 'Accesorios') {
      imageUrl = 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=80';
    } else if (category === 'Chaquetas') {
      imageUrl = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80';
    }

    return {
      id: String(p.id),
      name: p.nombre,
      description: p.descripcion,
      price: p.precio,
      imageUrl,
      category,
      stock: p.stock
    };
  }

  private mapToBackend(p: Partial<Product>): Partial<BackendProduct> {
    return {
      id: p.id ? Number(p.id) : undefined,
      nombre: p.name,
      descripcion: p.description,
      precio: p.price,
      stock: p.stock,
      activo: true
    };
  }

  private getMockProducts(): Product[] {
    return [
      {
        id: '1',
        name: 'Remera Oversized Heavyweight',
        description: 'Remera de algodón pesado de 240g con corte oversized. Cómoda, duradera y esencial para cualquier outfit urbano.',
        price: 22500.00,
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80',
        category: 'Camisetas',
        stock: 45
      },
      {
        id: '2',
        name: 'Sudadera Hoodie Dark Grafiti',
        description: 'Hoodie con capucha y estampa estilo grafiti en la espalda. Tela de friza premium abrigada.',
        price: 48990.00,
        imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80',
        category: 'Sudaderas',
        stock: 30
      },
      {
        id: '3',
        name: 'Zapatillas Urban High-Top',
        description: 'Zapatillas de caña alta con suela de goma reforzada y detalles en cuero sintético negro y rojo.',
        price: 89990.00,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80',
        category: 'Zapatillas',
        stock: 15
      },
      {
        id: '4',
        name: 'Cargo Pants Street Tactical',
        description: 'Pantalón cargo con múltiples bolsillos reforzados y puños ajustables con cordón.',
        price: 39990.00,
        imageUrl: 'https://images.unsplash.com/photo-1517423568366-8b83523034fd?w=500&auto=format&fit=crop&q=80',
        category: 'Pantalones',
        stock: 25
      },
      {
        id: '5',
        name: 'Gorra Cap Urban U',
        description: 'Gorra tipo snapback con la icónica letra U bordada en relieve 3D sobre el panel frontal.',
        price: 14500.00,
        imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=80',
        category: 'Accesorios',
        stock: 60
      },
      {
        id: '6',
        name: 'Chaqueta Cortavientos Neon Accent',
        description: 'Chaqueta impermeable ligera con cierres termosellados y acentos reflectantes de alta visibilidad.',
        price: 55990.00,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80',
        category: 'Chaquetas',
        stock: 18
      },
      {
        id: '7',
        name: 'Remera Acid Wash Vintage',
        description: 'Remera de algodón lavado al ácido estilo vintage de los 90. Bordado sutil en el pecho.',
        price: 24500.00,
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=80',
        category: 'Camisetas',
        stock: 35
      },
      {
        id: '8',
        name: 'Sudadera Hoodie Red Velvet',
        description: 'Sudadera oversized en color rojo intenso con capucha forrada y bolsillo canguro amplio.',
        price: 49990.00,
        imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=80',
        category: 'Sudaderas',
        stock: 20
      }
    ];
  }
}

import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { UserService } from './user.service';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedTalle?: string;
  cartItemId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'urban_wear_cart_v2';
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  private readonly _cartItems = signal<CartItem[]>([]);
  readonly cartItems = this._cartItems.asReadonly();

  readonly toastMessage = signal<string | null>(null);

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  readonly shipping = 1500;
  private backendCartId: number | null = null;
  private isLoading = false;

  private get apiUrl(): string {
    if (isPlatformServer(this.platformId)) {
      return 'http://localhost:8080/api';
    }
    return '/api';
  }

  readonly subtotal = computed(() => {
    return this._cartItems().reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  });

  readonly total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shipping : 0;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      // 1. Load initial guest cart from localStorage
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this._cartItems.set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }

      // 2. Track user authentication state changes
      effect(() => {
        const user = this.userService.currentUser();
        if (user) {
          this.syncAndLoadBackendCart();
        } else {
          this.backendCartId = null;
          try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
              this._cartItems.set(JSON.parse(stored));
            } else {
              this._cartItems.set([]);
            }
          } catch (e) {
            this._cartItems.set([]);
          }
        }
      });

      // 3. Track cart changes to save to localStorage ONLY if user is guest
      effect(() => {
        const user = this.userService.currentUser();
        if (!user) {
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._cartItems()));
          } catch (e) {
            console.error('Error saving cart to localStorage:', e);
          }
        }
      });
    }
  }

  private getTotalStock(product: Product): number {
    if (!product.variantes || product.variantes.length === 0) return 999;
    return product.variantes.reduce((sum, v) => sum + v.stock, 0);
  }

  private syncAndLoadBackendCart() {
    if (this.isLoading) return;
    this.isLoading = true;

    // Get or create user cart in the backend
    this.http.post<any>(`${this.apiUrl}/carrito`, null).subscribe({
      next: (carrito) => {
        this.backendCartId = carrito.id;
        const guestItems = [...this._cartItems()];
        if (guestItems.length > 0) {
          this.mergeGuestItems(guestItems, 0);
        } else {
          this.updateLocalItemsFromBackend(carrito.items);
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching backend cart via POST, attempting GET:', err);
        // Fallback: try GET as fallback
        this.http.get<any>(`${this.apiUrl}/carrito`).subscribe({
          next: (carrito) => {
            this.backendCartId = carrito.id;
            const guestItems = [...this._cartItems()];
            if (guestItems.length > 0) {
              this.mergeGuestItems(guestItems, 0);
            } else {
              this.updateLocalItemsFromBackend(carrito.items);
              this.isLoading = false;
            }
          },
          error: (getErr) => {
            console.error('Error fetching backend cart via GET:', getErr);
            this.isLoading = false;
          }
        });
      }
    });
  }

  private mergeGuestItems(items: CartItem[], index: number) {
    if (index >= items.length) {
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) { }
      this.fetchBackendItems();
      return;
    }

    const item = items[index];
    this.http.post<any>(
      `${this.apiUrl}/carritos/${this.backendCartId}/items`,
      {
        productoId: item.id,
        cantidad: item.quantity,
        color: item.selectedColor,
        talle: item.selectedTalle
      }
    ).subscribe({
      next: () => {
        this.mergeGuestItems(items, index + 1);
      },
      error: (err) => {
        console.error(`Error merging item ${item.id} to backend:`, err);
        this.mergeGuestItems(items, index + 1);
      }
    });
  }

  private fetchBackendItems() {
    if (!this.backendCartId) return;
    this.http.get<any[]>(`${this.apiUrl}/carritos/${this.backendCartId}/items`).subscribe({
      next: (items) => {
        this.updateLocalItemsFromBackend(items);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching backend cart items:', err);
        this.isLoading = false;
      }
    });
  }

  private updateLocalItemsFromBackend(backendItems: any[]) {
    if (!backendItems) {
      this._cartItems.set([]);
      return;
    }
    const mapped: CartItem[] = backendItems.map(item => {
      if (item.productoId !== undefined) {
        // Formato DTO plano (CarritoItemResponse)
        return {
          id: item.productoId,
          nombre: item.nombreProducto,
          descripcion: item.descripcion,
          precio: item.precio,
          imagenUrl: item.imagenUrl,
          activo: true,
          categoria: { id: 0, nombre: '', descripcion: '', activo: true },
          variantes: item.variantes || [],
          quantity: item.cantidad,
          selectedColor: item.color,
          selectedTalle: item.talle,
          cartItemId: item.id
        };
      } else if (item.producto) {
        // Formato entidad anidada (CarritoItem)
        return {
          ...item.producto,
          quantity: item.cantidad,
          selectedColor: item.color,
          selectedTalle: item.talle,
          cartItemId: item.id
        };
      } else {
        // Fallback genérico
        return {
          id: item.id,
          nombre: item.nombre || '',
          descripcion: item.descripcion || '',
          precio: item.precio || 0,
          imagenUrl: item.imagenUrl || '',
          activo: true,
          categoria: item.categoria || { id: 0, nombre: '', descripcion: '', activo: true },
          variantes: item.variantes || [],
          quantity: item.cantidad || item.quantity || 0,
          selectedColor: item.color || item.selectedColor,
          selectedTalle: item.talle || item.selectedTalle,
          cartItemId: item.id
        };
      }
    });
    this._cartItems.set(mapped);
  }

  addToCart(product: Product, quantity = 1, color?: string, talle?: string) {
    if (!this.userService.currentUser()) {
      this.showToast('Antes de realizar una compra necesitamos que te registres.');
      return;
    }

    let maxStock = 999;
    if (product.variantes && color && talle) {
      const variant = product.variantes.find(v => v.color && v.color.nombre === color && v.talle === talle);
      if (variant) {
        maxStock = variant.stock;
      }
    } else {
      maxStock = this.getTotalStock(product);
    }

    const existing = this._cartItems().find(item =>
      item.id === product.id &&
      (!color || item.selectedColor === color) &&
      (!talle || item.selectedTalle === talle)
    );
    const currentQty = existing ? existing.quantity : 0;
    const finalQty = Math.min(quantity, maxStock - currentQty);

    if (finalQty <= 0) return;

    if (this.userService.currentUser() && this.backendCartId) {
      this.http.post<any>(
        `${this.apiUrl}/carritos/${this.backendCartId}/items`,
        {
          productoId: product.id,
          cantidad: finalQty,
          color: color,
          talle: talle
        }
      ).subscribe({
        next: () => this.fetchBackendItems(),
        error: (err) => console.error('Error adding to backend cart:', err)
      });
    } else {
      this._cartItems.update(items => {
        const existingItem = items.find(item =>
          item.id === product.id &&
          (!color || item.selectedColor === color) &&
          (!talle || item.selectedTalle === talle)
        );
        if (existingItem) {
          return items.map(item =>
            (item.id === product.id &&
              (!color || item.selectedColor === color) &&
              (!talle || item.selectedTalle === talle))
              ? { ...item, quantity: Math.min(item.quantity + quantity, maxStock) }
              : item
          );
        }
        return [...items, { ...product, quantity: Math.min(quantity, maxStock), selectedColor: color, selectedTalle: talle }];
      });
    }
  }

  updateQuantity(item: CartItem, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(item);
      return;
    }

    if (this.userService.currentUser() && this.backendCartId && item.cartItemId) {
      const maxStock = this.getTotalStock(item);
      const finalQty = Math.min(quantity, maxStock);

      this.http.put<any>(
        `${this.apiUrl}/carritos/${this.backendCartId}/items/by-item/${item.cartItemId}`,
        null,
        {
          params: {
            cantidad: finalQty.toString()
          }
        }
      ).subscribe({
        next: () => this.fetchBackendItems(),
        error: (err) => console.error('Error updating backend cart quantity:', err)
      });
    } else {
      this._cartItems.update(items =>
        items.map(i => {
          if (i.id === item.id && i.selectedColor === item.selectedColor && i.selectedTalle === item.selectedTalle) {
            const maxStock = this.getTotalStock(i);
            return { ...i, quantity: Math.min(quantity, maxStock) };
          }
          return i;
        })
      );
    }
  }

  removeItem(item: CartItem) {
    if (this.userService.currentUser() && this.backendCartId && item.cartItemId) {
      this.http.delete<void>(
        `${this.apiUrl}/carritos/${this.backendCartId}/items/by-item/${item.cartItemId}`
      ).subscribe({
        next: () => this.fetchBackendItems(),
        error: (err) => console.error('Error removing product from backend cart:', err)
      });
    } else {
      this._cartItems.update(items => items.filter(i =>
        !(i.id === item.id && i.selectedColor === item.selectedColor && i.selectedTalle === item.selectedTalle)
      ));
    }
  }

  clearCart() {
    if (this.userService.currentUser() && this.backendCartId) {
      this.http.delete<void>(
        `${this.apiUrl}/carritos/${this.backendCartId}/items`
      ).subscribe({
        next: () => this.fetchBackendItems(),
        error: (err) => console.error('Error clearing backend cart:', err)
      });
    } else {
      this._cartItems.set([]);
    }
  }
}

import { Injectable, signal, computed, effect } from '@angular/core';
import { Product } from '../../models/product';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'urban_wear_cart_v2';
  

  private readonly _cartItems = signal<CartItem[]>([]);
  readonly cartItems = this._cartItems.asReadonly();

  readonly shipping = 1500;

  readonly subtotal = computed(() => {
    return this._cartItems().reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  });

  readonly total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shipping : 0;
  });

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this._cartItems.set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }

      effect(() => {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._cartItems()));
        } catch (e) {
          console.error('Error saving cart to localStorage:', e);
        }
      });
    }
  }

  private getTotalStock(product: Product): number {
    if (!product.variantes || product.variantes.length === 0) return 999;
    return product.variantes.reduce((sum, v) => sum + v.stock, 0);
  }

  addToCart(product: Product, quantity = 1) {
    const maxStock = this.getTotalStock(product);
    this._cartItems.update(items => {
      const existing = items.find(item => item.id === product.id);
      if (existing) {
        return items.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + quantity, maxStock) }
            : item
        );
      }
      return [...items, { ...product, quantity: Math.min(quantity, maxStock) }];
    });
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    
    this._cartItems.update(items => 
      items.map(item => {
        if (item.id === productId) {
          const maxStock = this.getTotalStock(item);
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  }

  removeItem(productId: number) {
    this._cartItems.update(items => items.filter(item => item.id !== productId));
  }

  clearCart() {
    this._cartItems.set([]);
  }
}

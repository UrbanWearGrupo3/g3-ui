import { Injectable, signal, computed, effect } from '@angular/core';
import { Product } from '../../models/product';

export interface CartItem extends Product {
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'urban_wear_cart';
  
  // Cart items signal
  private readonly _cartItems = signal<CartItem[]>([]);
  readonly cartItems = this._cartItems.asReadonly();

  // Shipping rate: Flat rate of $1500
  readonly shipping = 1500;

  // Computed subtotal
  readonly subtotal = computed(() => {
    return this._cartItems().reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  // Computed total
  readonly total = computed(() => {
    const sub = this.subtotal();
    return sub > 0 ? sub + this.shipping : 0;
  });

  constructor() {
    // Load initial cart from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          this._cartItems.set(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading cart from localStorage:', e);
      }

      // Automatically persist to localStorage whenever cart changes
      effect(() => {
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._cartItems()));
        } catch (e) {
          console.error('Error saving cart to localStorage:', e);
        }
      });
    }
  }

  addToCart(product: Product, quantity = 1) {
    this._cartItems.update(items => {
      const existing = items.find(item => item.id === product.id);
      if (existing) {
        return items.map(item => 
          item.id === product.id 
            ? { ...item, quantity: Math.min(item.quantity + quantity, item.stock) }
            : item
        );
      }
      return [...items, { ...product, quantity: Math.min(quantity, product.stock) }];
    });
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    
    this._cartItems.update(items => 
      items.map(item => 
        item.id === productId 
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    );
  }

  removeItem(productId: string) {
    this._cartItems.update(items => items.filter(item => item.id !== productId));
  }

  clearCart() {
    this._cartItems.set([]);
  }
}

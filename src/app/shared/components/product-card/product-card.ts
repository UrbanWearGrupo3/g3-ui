import { Component, input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Product } from '../../../models/product';
import { CartService } from '../../../core/services/cart.service';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  product = input.required<Product>();
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService);

  get imageUrl(): string {
    return this.productService.getImageUrl(this.product());
  }

  get categoryName(): string {
    return this.product().categoria?.nombre || 'Sin categoría';
  }

  get totalStock(): number {
    return this.productService.getTotalStock(this.product());
  }

  addToCart() {
    this.cartService.addToCart(this.product());
  }
}

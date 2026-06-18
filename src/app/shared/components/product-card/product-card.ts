import { Component, input, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Product } from '../../../models/product';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-product-card',
  imports: [DecimalPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCard {
  product = input.required<Product>();
  private readonly cartService = inject(CartService);

  addToCart() {
    this.cartService.addToCart(this.product());
  }
}

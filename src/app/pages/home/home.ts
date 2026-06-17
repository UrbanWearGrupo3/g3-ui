import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly productService = inject(ProductService);
  featuredProducts = signal<Product[]>([]);

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (prods) => this.featuredProducts.set(prods.slice(0, 4)),
      error: (err) => console.error('Error loading products from Java backend:', err)
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService } from '../../core/services/product.service';
import { UserService } from '../../core/services/user.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly productService = inject(ProductService);
  protected readonly userService = inject(UserService);
  featuredProducts = signal<Product[]>([]);

  ngOnInit(): void {
    this.productService.getProducts({ activo: true, size: 4 }).subscribe({
      next: (page) => this.featuredProducts.set(page.content),
      error: (err) => console.error('Error loading products from backend:', err)
    });
  }
}

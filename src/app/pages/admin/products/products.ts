import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../models/product';

@Component({
  selector: 'app-products',
  imports: [DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  products = signal<Product[]>([]);

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: (err) => console.error('Error fetching admin products from Java backend:', err)
    });
  }

  deleteProduct(id: string): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update(items => items.filter(p => p.id !== id));
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }
}

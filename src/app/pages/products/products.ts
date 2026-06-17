import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../models/product';

@Component({
  selector: 'app-products',
  imports: [ProductCard],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  products = signal<Product[]>([]);

  selectedCategory = signal<string>('Todas');
  categories = ['Todas', 'Camisetas', 'Sudaderas', 'Zapatillas', 'Accesorios', 'Pantalones', 'Chaquetas'];

  filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'Todas') {
      return this.products();
    }
    return this.products().filter(p => p.category === cat);
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: (err) => console.error('Error fetching catalog from Java backend:', err)
    });
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }
}

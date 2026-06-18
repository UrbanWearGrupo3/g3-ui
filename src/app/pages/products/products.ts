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
  searchQuery = signal<string>('');

  filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();
    
    let result = this.products();
    
    if (cat !== 'Todas') {
      result = result.filter(p => p.category === cat);
    }
    
    if (query) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    return result;
  });

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (prods) => this.products.set(prods),
      error: (err) => console.error('Error fetching catalog:', err)
    });
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}

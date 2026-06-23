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
  categories = ['Todas', 'Remera', 'Pantalones', 'Gorras', 'Camperas', 'Accesorios'];
  searchQuery = signal<string>('');

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);

  filteredProducts = computed(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().toLowerCase().trim();

    let result = this.products();

    if (cat !== 'Todas') {
      result = result.filter(p => {
        const catName = p.categoria?.nombre || '';
        return catName.toLowerCase().includes(cat.toLowerCase());
      });
    }

    if (query) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(query) ||
        (p.descripcion || '').toLowerCase().includes(query)
      );
    }

    return result;
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productService.getProducts({
      activo: true,
      page: this.currentPage(),
      size: 50
    }).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching catalog:', err);
        this.isLoading.set(false);
      }
    });
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadProducts();
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadProducts();
    }
  }
}

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

  categoryMap: { [key: string]: number } = {
    'Remera': 1,
    'Pantalones': 2,
    'Camperas': 3,
    'Gorras': 4,
    'Accesorios': 5
  };

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);

  filteredProducts = computed(() => {
    return this.products();
  });

  pageNumbers = computed(() => {
    const pages = [];
    for (let i = 0; i < this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    const filters: any = {
      activo: true,
      page: this.currentPage(),
      size: 12
    };

    const cat = this.selectedCategory();
    if (cat !== 'Todas' && this.categoryMap[cat]) {
      filters.categoriaId = this.categoryMap[cat];
    }

    const query = this.searchQuery().trim();
    if (query) {
      filters.nombre = query;
    }

    this.productService.getProducts(filters).subscribe({
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
    this.currentPage.set(0);
    this.loadProducts();
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.currentPage.set(0);
    this.loadProducts();
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

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }
}

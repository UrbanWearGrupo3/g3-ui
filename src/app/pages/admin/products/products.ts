import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductoRequest, VarianteRequest } from '../../../models/product';

@Component({
  selector: 'app-products',
  imports: [DecimalPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);

  // Add product form states
  isFormOpen = signal<boolean>(false);
  nameField = signal<string>('');
  descField = signal<string>('');
  priceField = signal<number>(0);
  brandField = signal<string>('');
  categoryIdField = signal<number>(1);
  imageField = signal<string>('');

  // Variante fields
  varTalle = signal<string>('');
  varColor = signal<string>('');
  varStock = signal<number>(0);
  variantes = signal<VarianteRequest[]>([]);

  // Form feedback
  formError = signal<string>('');
  formSuccess = signal<string>('');

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    this.productService.getProducts({
      page: this.currentPage(),
      size: 20
    }).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching admin products:', err);
        this.isLoading.set(false);
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.products.update(items => items.filter(p => p.id !== id));
        },
        error: (err) => console.error('Error deleting product:', err)
      });
    }
  }

  toggleActivo(id: number, currentActivo: boolean): void {
    this.productService.toggleActivo(id, !currentActivo).subscribe({
      next: (updated) => {
        this.products.update(items =>
          items.map(p => p.id === id ? updated : p)
        );
      },
      error: (err) => console.error('Error toggling active:', err)
    });
  }

  toggleForm(isOpen: boolean) {
    this.isFormOpen.set(isOpen);
    if (!isOpen) {
      this.clearForm();
    }
  }

  clearForm() {
    this.nameField.set('');
    this.descField.set('');
    this.priceField.set(0);
    this.brandField.set('');
    this.categoryIdField.set(1);
    this.imageField.set('');
    this.varTalle.set('');
    this.varColor.set('');
    this.varStock.set(0);
    this.variantes.set([]);
    this.formError.set('');
    this.formSuccess.set('');
  }

  updateFormField(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const val = target.value;

    if (field === 'name') this.nameField.set(val);
    else if (field === 'desc') this.descField.set(val);
    else if (field === 'price') this.priceField.set(Number(val));
    else if (field === 'brand') this.brandField.set(val);
    else if (field === 'categoryId') this.categoryIdField.set(Number(val));
    else if (field === 'image') this.imageField.set(val);
    else if (field === 'varTalle') this.varTalle.set(val);
    else if (field === 'varColor') this.varColor.set(val);
    else if (field === 'varStock') this.varStock.set(Number(val));
  }

  addVariante() {
    const talle = this.varTalle().trim();
    const color = this.varColor().trim();
    const stock = this.varStock();

    if (!talle || !color) {
      this.formError.set('Talle y color son obligatorios para la variante.');
      return;
    }

    this.variantes.update(list => [...list, { talle, color, stock }]);
    this.varTalle.set('');
    this.varColor.set('');
    this.varStock.set(0);
    this.formError.set('');
  }

  removeVariante(index: number) {
    this.variantes.update(list => list.filter((_, i) => i !== index));
  }

  onSubmitProduct(event: Event) {
    event.preventDefault();
    this.formError.set('');
    this.formSuccess.set('');

    const request: ProductoRequest = {
      nombre: this.nameField(),
      descripcion: this.descField(),
      precio: this.priceField(),
      marca: this.brandField(),
      imagenUrl: this.imageField() || undefined,
      categoriaId: this.categoryIdField(),
      variantes: this.variantes().length > 0 ? this.variantes() : undefined
    };

    this.productService.createProduct(request).subscribe({
      next: (savedProd) => {
        this.products.update(items => [savedProd, ...items]);
        this.formSuccess.set(`Producto "${savedProd.nombre}" creado exitosamente.`);
        setTimeout(() => this.toggleForm(false), 1500);
      },
      error: (err) => {
        console.error('Error saving product:', err);
        const message = err.error?.message || err.error?.detail || 'Error al guardar el producto. Verifica los datos.';
        this.formError.set(message);
      }
    });
  }

  getTotalStock(product: Product): number {
    return this.productService.getTotalStock(product);
  }

  getImageUrl(product: Product): string {
    return this.productService.getImageUrl(product);
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

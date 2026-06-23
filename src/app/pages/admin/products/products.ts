import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductoRequest, VarianteRequest } from '../../../models/product';

@Component({
  selector: 'app-products',
  imports: [DecimalPipe, CommonModule, FormsModule],
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
  editingProductId = signal<number | null>(null);

  // Image Upload States
  selectedFile = signal<File | null>(null);
  imagePreviewUrl = signal<string>('');
  isUploadingImage = signal<boolean>(false);

  // Variante fields
  varTalle = signal<string>('');
  varColorId = signal<number>(1);
  varStock = signal<number>(0);
  variantes = signal<VarianteRequest[]>([]);

  // Form feedback
  formError = signal<string>('');
  formSuccess = signal<string>('');

  // Pagination
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);

  // Product Filter States
  searchQuery = signal<string>('');
  categoryFilter = signal<string>('');
  statusFilter = signal<string>('');

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading.set(true);
    const filters: any = {
      page: this.currentPage(),
      size: 20
    };

    const query = this.searchQuery().trim();
    if (query) filters.nombre = query;

    const catId = this.categoryFilter();
    if (catId) filters.categoriaId = Number(catId);

    const activo = this.statusFilter();
    if (activo !== '') {
      filters.activo = activo === 'true';
    }

    this.productService.getProducts(filters).subscribe({
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
    throw new Error('No está permitido eliminar productos. Utilice la desactivación en su lugar.');
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

  onFilterChange(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    if (field === 'search') {
      this.searchQuery.set(val);
    } else if (field === 'category') {
      this.categoryFilter.set(val);
    } else if (field === 'status') {
      this.statusFilter.set(val);
    }
    this.currentPage.set(0);
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.categoryFilter.set('');
    this.statusFilter.set('');
    this.currentPage.set(0);
    this.loadProducts();
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
    this.varColorId.set(1);
    this.varStock.set(0);
    this.variantes.set([]);
    this.formError.set('');
    this.formSuccess.set('');
    this.selectedFile.set(null);
    this.imagePreviewUrl.set('');
    this.isUploadingImage.set(false);
    this.editingProductId.set(null);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.selectedFile.set(file);

      // Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedFile() {
    this.selectedFile.set(null);
    this.imagePreviewUrl.set('');
  }

  editProduct(product: Product) {
    this.editingProductId.set(product.id);
    this.nameField.set(product.nombre);
    this.descField.set(product.descripcion || '');
    this.priceField.set(product.precio);
    this.brandField.set(product.marca || '');
    this.categoryIdField.set(product.categoria?.id || 1);
    this.imageField.set(product.imagenUrl || '');
    this.imagePreviewUrl.set(product.imagenUrl || '');
    this.selectedFile.set(null);
    if (product.variantes) {
      this.variantes.set(product.variantes.map(v => ({
        talle: v.talle,
        colorId: (v.color as any)?.id || 1,
        stock: v.stock,
        codigoBarras: v.codigoBarras
      })));
    } else {
      this.variantes.set([]);
    }
    this.formError.set('');
    this.formSuccess.set('');
    this.isFormOpen.set(true);
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
    else if (field === 'varColorId') this.varColorId.set(Number(val));
    else if (field === 'varStock') this.varStock.set(Number(val));
  }

  addVariante() {
    const talle = this.varTalle().trim();
    const colorId = this.varColorId();
    const stock = this.varStock();

    if (!talle || !colorId) {
      this.formError.set('Talle y color son obligatorios para la variante.');
      return;
    }

    this.variantes.update(list => [...list, { talle, colorId, stock }]);
    this.varTalle.set('');
    this.varColorId.set(1);
    this.varStock.set(0);
    this.formError.set('');
  }

  removeVariante(index: number) {
    this.variantes.update(list => list.filter((_, i) => i !== index));
  }

  async onSubmitProduct(event: Event) {
    event.preventDefault();
    this.formError.set('');
    this.formSuccess.set('');
    this.isLoading.set(true);

    let finalImageUrl = this.imageField();

    const file = this.selectedFile();
    if (file) {
      this.isUploadingImage.set(true);
      try {
        const uploadRes = await firstValueFrom(this.productService.uploadImage(file));
        finalImageUrl = uploadRes.url;
        this.isUploadingImage.set(false);
      } catch (err: any) {
        console.error('Error uploading image to backend proxy:', err);
        this.formError.set('Error al subir la imagen al backend: ' + (err.message || err.error?.error || err.error || err));
        this.isUploadingImage.set(false);
        this.isLoading.set(false);
        return;
      }
    }

    const request: ProductoRequest = {
      nombre: this.nameField(),
      descripcion: this.descField(),
      precio: this.priceField(),
      marca: 'UrbanWear',
      imagenUrl: finalImageUrl || undefined,
      categoriaId: this.categoryIdField(),
      variantes: this.variantes().length > 0 ? this.variantes() : undefined
    };

    const editId = this.editingProductId();
    if (editId != null) {
      this.productService.updateProduct(editId, request).subscribe({
        next: (updatedProd) => {
          this.products.update(items =>
            items.map(p => p.id === editId ? updatedProd : p)
          );
          this.formSuccess.set(`Producto "${updatedProd.nombre}" actualizado exitosamente.`);
          this.isLoading.set(false);
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err) => {
          console.error('Error updating product:', err);
          const message = err.error?.message || err.error?.detail || 'Error al actualizar el producto. Verifica los datos.';
          this.formError.set(message);
          this.isLoading.set(false);
        }
      });
    } else {
      this.productService.createProduct(request).subscribe({
        next: (savedProd) => {
          this.products.update(items => [savedProd, ...items]);
          this.formSuccess.set(`Producto "${savedProd.nombre}" creado exitosamente.`);
          this.isLoading.set(false);
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err) => {
          console.error('Error saving product:', err);
          const message = err.error?.message || err.error?.detail || 'Error al guardar el producto. Verifica los datos.';
          this.formError.set(message);
          this.isLoading.set(false);
        }
      });
    }
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

  getColorName(colorId: number): string {
    const colors: { [key: number]: string } = {
      1: 'Negro',
      2: 'Blanco',
      3: 'Rojo',
      4: 'Azul',
      5: 'Verde',
      6: 'Gris',
      7: 'Beige',
      8: 'Bordó',
      9: 'Celeste',
      10: 'Rosa'
    };
    return colors[colorId] || 'Desconocido';
  }
}

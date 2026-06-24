import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-users',
  imports: [DatePipe, CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  users = signal<User[]>([]);

  // Add/Edit user form states
  isFormOpen = signal<boolean>(false);
  firstNameField = signal<string>('');
  lastNameField = signal<string>('');
  emailField = signal<string>('');
  passwordField = signal<string>('');
  roleField = signal<'super_user' | 'admin' | 'user'>('user');
  activoField = signal<boolean>(true);
  editingUserId = signal<string | null>(null);

  formError = signal<string>('');
  formSuccess = signal<string>('');

  // User Filter states
  searchQuery = signal<string>('');
  roleFilter = signal<string>('');
  activoFilter = signal<string>('');

  // Pagination states
  currentPage = signal<number>(0);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  pageSize = signal<number>(10);

  pageNumbers = computed(() => {
    const pages = [];
    for (let i = 0; i < this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const filters: any = {
      page: this.currentPage(),
      size: this.pageSize()
    };
    const query = this.searchQuery().trim();
    if (query) filters.search = query;

    const rol = this.roleFilter();
    if (rol) filters.rol = rol;

    const activo = this.activoFilter();
    if (activo !== '') {
      filters.activo = activo === 'true';
    }

    this.userService.getUsers(filters).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalPages.set(page.totalPages);
        this.totalElements.set(page.totalElements);
      },
      error: (err) => console.error('Error fetching admin users from Java backend:', err)
    });
  }

  onFilterChange(field: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    if (field === 'search') {
      this.searchQuery.set(val);
    } else if (field === 'role') {
      this.roleFilter.set(val);
    } else if (field === 'activo') {
      this.activoFilter.set(val);
    }
    this.currentPage.set(0);
    this.loadUsers();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilter.set('');
    this.activoFilter.set('');
    this.currentPage.set(0);
    this.loadUsers();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
      this.loadUsers();
    }
  }

  goToPage(page: number) {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadUsers();
    }
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize.set(Number(target.value));
    this.currentPage.set(0);
    this.loadUsers();
  }

  toggleForm(isOpen: boolean) {
    this.isFormOpen.set(isOpen);
    if (!isOpen) {
      this.clearForm();
    }
  }

  clearForm() {
    this.firstNameField.set('');
    this.lastNameField.set('');
    this.emailField.set('');
    this.passwordField.set('');
    this.roleField.set('user');
    this.activoField.set(true);
    this.editingUserId.set(null);
    this.formError.set('');
    this.formSuccess.set('');
  }

  editUser(user: User) {
    this.editingUserId.set(user.id);
    this.firstNameField.set(user.firstName);
    this.lastNameField.set(user.lastName);
    this.emailField.set(user.email);
    this.passwordField.set(''); // Vacio por defecto al editar
    this.roleField.set(user.role);
    this.activoField.set(user.activo);
    this.formError.set('');
    this.formSuccess.set('');
    this.isFormOpen.set(true);
  }

  updateFormField(field: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const val = target.value;
    if (field === 'firstName') this.firstNameField.set(val);
    else if (field === 'lastName') this.lastNameField.set(val);
    else if (field === 'email') this.emailField.set(val);
    else if (field === 'password') this.passwordField.set(val);
    else if (field === 'role') this.roleField.set(val as 'super_user' | 'admin' | 'user');
    else if (field === 'activo') {
      const checkbox = target as HTMLInputElement;
      this.activoField.set(checkbox.checked);
    }
  }

  onSubmitUser(event: Event) {
    event.preventDefault();
    this.formError.set('');
    this.formSuccess.set('');

    const email = this.emailField().trim();
    const firstName = this.firstNameField().trim();
    const lastName = this.lastNameField().trim();
    const password = this.passwordField();
    const role = this.roleField();
    const activo = this.activoField();

    if (!email || !firstName || !lastName) {
      this.formError.set('Nombre, apellido y correo electrónico son obligatorios.');
      return;
    }

    const editId = this.editingUserId();
    if (editId) {
      this.userService.updateUser(editId, {
        firstName,
        lastName,
        email,
        role,
        activo,
        password: password || undefined
      }).subscribe({
        next: (updatedUser) => {
          this.formSuccess.set('Usuario actualizado exitosamente.');
          this.loadUsers();
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err: any) => {
          console.error('Error updating user:', err);
          const errMsg = err.error?.message || err.error?.detail || 'Error al actualizar el usuario.';
          this.formError.set(errMsg);
        }
      });
    } else {
      if (!password || password.length < 6) {
        this.formError.set('La contraseña es obligatoria y debe tener al menos 6 caracteres.');
        return;
      }

      this.userService.createUser({
        firstName,
        lastName,
        email,
        role,
        activo,
        password
      }).subscribe({
        next: (savedUser) => {
          this.formSuccess.set('Usuario creado exitosamente.');
          this.loadUsers();
          setTimeout(() => this.toggleForm(false), 1500);
        },
        error: (err: any) => {
          console.error('Error creating user:', err);
          const errMsg = err.error?.message || err.error?.detail || 'Error al crear el usuario.';
          this.formError.set(errMsg);
        }
      });
    }
  }

  toggleActivo(id: string, currentActivo: boolean): void {
    this.userService.toggleActivo(id, !currentActivo).subscribe({
      next: (updated) => {
        this.loadUsers();
      },
      error: (err) => console.error('Error toggling user active state:', err)
    });
  }
}

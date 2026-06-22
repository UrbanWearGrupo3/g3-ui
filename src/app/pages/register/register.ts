import { Component, inject, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class RegisterComponent {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  firstName = signal<string>('');
  lastName = signal<string>('');
  email = signal<string>('');
  password = signal<string>('');
  error = signal<string>('');

  updateField(field: 'firstName' | 'lastName' | 'email' | 'password', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'firstName') this.firstName.set(value);
    else if (field === 'lastName') this.lastName.set(value);
    else if (field === 'email') {
      this.email.set(value);
      this.error.set('');
    } else if (field === 'password') {
      this.password.set(value);
      this.error.set('');
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.userService.register(
      this.firstName(),
      this.lastName(),
      this.email(),
      this.password()
    ).subscribe({
      next: (success) => {
        if (success) {
          // If successful, log them in automatically
          this.userService.login(this.email(), this.password()).subscribe(() => {
            this.router.navigate(['/']);
          });
        } else {
          this.error.set('Este correo electrónico ya está registrado o los datos son inválidos.');
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        this.error.set('Error al conectar con el servidor. Inténtalo de nuevo.');
      }
    });
  }
}

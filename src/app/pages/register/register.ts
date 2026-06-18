import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  firstName = signal<string>('');
  lastName = signal<string>('');
  email = signal<string>('');
  error = signal<string>('');

  updateField(field: 'firstName' | 'lastName' | 'email', event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (field === 'firstName') this.firstName.set(value);
    else if (field === 'lastName') this.lastName.set(value);
    else if (field === 'email') {
      this.email.set(value);
      this.error.set('');
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const success = this.userService.register(
      this.firstName(),
      this.lastName(),
      this.email()
    );

    if (success) {
      this.router.navigate(['/']);
    } else {
      this.error.set('Este correo electrónico ya está registrado.');
    }
  }
}

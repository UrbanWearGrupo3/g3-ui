import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  email = signal<string>('');
  error = signal<string>('');

  updateEmail(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
    this.error.set('');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const success = this.userService.login(this.email());
    if (success) {
      const user = this.userService.currentUser();
      if (user?.role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/']);
      }
    } else {
      this.error.set('El correo no coincide con ningún usuario registrado. Prueba con "admin@urbanwear.com" o "sofia@gmail.com".');
    }
  }
}

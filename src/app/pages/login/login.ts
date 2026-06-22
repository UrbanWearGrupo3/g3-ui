import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  email = signal<string>('');
  password = signal<string>('');
  error = signal<string>('');

  updateEmail(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.email.set(value);
    this.error.set('');
  }

  updatePassword(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.password.set(value);
    this.error.set('');
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.userService.login(this.email(), this.password()).subscribe({
      next: (success) => {
        if (success) {
        const user = this.userService.currentUser();
        console.log('LoginComponent: logged in user', user);
        if (user?.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.error.set('El correo o la contraseña son incorrectos. Prueba con admin@urbanwear.com / admin123 o cliente@demo.com / cliente123.');
        }
      },
      error: (err) => {
        console.error('Error logging in:', err);
        this.error.set('Error de conexión con el servidor. Inténtalo de nuevo.');
      }
    });
  }
}

import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { UserService } from './core/services/user.service';
import { firstValueFrom } from 'rxjs';
import { AdminGuard } from './core/guards/admin.guard';

export function initializeApp(userService: UserService) {
  return () => firstValueFrom(userService.validateSession());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [UserService],
      multi: true
    }
  ]
};



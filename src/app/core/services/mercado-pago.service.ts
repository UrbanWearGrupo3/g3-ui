import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MercadoPagoService {
  private readonly http = inject(HttpClient);
  private mp: any;

  async init(): Promise<void> {
    await loadMercadoPago();
    this.mp = new (window as any).MercadoPago(environment.mercadoPagoPublicKey, {
      locale: 'es-AR',
    });
  }

  /** Llama al backend para crear la preferencia y devuelve el ID */
  crearPreference(pedidoId: number) {
    return this.http.post<{ preferenceId: string; initPoint: string; sandboxInitPoint?: string }>(
      `/api/pedidos/${pedidoId}/preference`,
      {}
    );
  }

  /** Renderiza el Brick (checkout) */
  renderCheckout(preferenceId: string, containerId: string) {
    if (!this.mp) {
      console.error('MercadoPago no inicializado');
      return;
    }
    this.mp.checkout({
      preference: { id: preferenceId },
      render: { container: `#${containerId}`, label: 'Pagar' },
    });
  }
}

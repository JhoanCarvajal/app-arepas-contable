import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  private syncService = inject(SyncService);

  constructor() {
    this.initializeApp();
  }

  async initializeApp() {
    await SplashScreen.show({
      showDuration: 1000,
      autoHide: true,
    });

    // Iniciar la sincronización de datos
    this.syncService.syncData();

    this.syncService.cleanDatesInLocalStorage();
  }
}
import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SplashScreen } from '@capacitor/splash-screen';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    this.initializeApp();
  };

  async initializeApp() {
    // Show the splash for two seconds and then automatically hide it:
    await SplashScreen.show({
      showDuration: 2000,
      autoHide: true,
    });
  }

}

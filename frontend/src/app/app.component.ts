import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent, OfflineBannerComponent, ToastHostComponent } from '@shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, LoadingBarComponent, OfflineBannerComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {}

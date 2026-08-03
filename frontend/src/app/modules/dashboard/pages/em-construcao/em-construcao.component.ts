import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { ButtonComponent } from '@shared/ui';

@Component({
  selector: 'app-em-construcao',
  standalone: true,
  imports: [LucideAngularModule, RouterLink, ButtonComponent],
  templateUrl: './em-construcao.component.html',
  styleUrl: './em-construcao.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmConstrucaoComponent {}

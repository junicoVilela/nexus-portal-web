import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPageComponent } from './form-page.component';

@Component({
  standalone: true,
  imports: [FormPageComponent],
  template: `
    <ui-form-page title="Novo usuário" [saving]="saving" (cancelled)="onCancel()" (saved)="onSave()">
      <div>Campos</div>
    </ui-form-page>
  `,
})
class HostComponent {
  saving = false;
  cancelCount = 0;
  saveCount = 0;
  onCancel() {
    this.cancelCount++;
  }
  onSave() {
    this.saveCount++;
  }
}

describe('FormPageComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders title and projected content', () => {
    const t = fixture.nativeElement.textContent;
    expect(t).toContain('Novo usuário');
    expect(t).toContain('Campos');
  });

  it('emits cancelled when cancel clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button');
    const cancel = Array.from(btns).find((b: unknown) =>
      (b as Element).textContent?.includes('Cancelar'),
    ) as HTMLButtonElement;
    cancel.click();
    expect(fixture.componentInstance.cancelCount).toBe(1);
  });

  it('emits saved when save clicked', () => {
    const btns = fixture.nativeElement.querySelectorAll('button');
    const save = Array.from(btns).find((b: unknown) =>
      (b as Element).textContent?.includes('Salvar'),
    ) as HTMLButtonElement;
    save.click();
    expect(fixture.componentInstance.saveCount).toBe(1);
  });
});

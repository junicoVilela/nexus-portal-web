import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PaginaMetaFieldsComponent } from './pagina-meta-fields.component';
import type { Modulo } from '../../models/modulo.model';
import type { Pagina } from '../../models/pagina.model';
import type { Projeto } from '../../models/projeto.model';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PaginaMetaFieldsComponent],
  template: `<app-pagina-meta-fields
    [form]="form"
    [projetos]="projetos"
    [modulos]="modulos"
    [parentOptions]="parentOptions"
    [paginaLabel]="paginaLabel"
    (projetoChange)="projetoChangeCount = projetoChangeCount + 1"
    (moduloChange)="moduloChangeCount = moduloChangeCount + 1"
  />`,
})
class HostComponent {
  private readonly fb = new FormBuilder();
  form = this.fb.group({ projetoId: [''], moduloId: [''], parentId: [''], tipo: ['ARTIGO'] });
  projetos: Projeto[] = [
    { id: 'p1', nome: 'Projeto Alfa', slug: 'alfa' } as Projeto,
    { id: 'p2', nome: 'Projeto Beta', slug: 'beta' } as Projeto,
  ];
  modulos: Modulo[] = [
    { id: 'm1', nome: 'Auth', projetoId: 'p1', projetoNome: 'Projeto Alfa', slug: 'auth' } as Modulo,
  ];
  parentOptions: Pagina[] = [{ id: 'pg1', titulo: 'Index' } as Pagina];
  paginaLabel = (p: Pagina): string => p.titulo;
  projetoChangeCount = 0;
  moduloChangeCount = 0;
}

describe('PaginaMetaFieldsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renderiza 4 selects (projeto, módulo, pai e tipo)', () => {
    expect(fixture.nativeElement.querySelectorAll('select').length).toBe(4);
  });

  it('lista projetos como options', () => {
    expect(fixture.nativeElement.textContent).toContain('Projeto Alfa');
    expect(fixture.nativeElement.textContent).toContain('Projeto Beta');
  });

  it('hint do módulo orienta selecionar projeto', () => {
    expect(fixture.nativeElement.textContent).toContain('Selecione um projeto primeiro');
  });

  it('hint do módulo muda quando projeto é selecionado', () => {
    fixture.componentInstance.form.controls.projetoId.setValue('p1');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Somente módulos do projeto selecionado');
  });

  it('chama paginaLabel para parent options', () => {
    expect(fixture.nativeElement.textContent).toContain('Index');
  });

  it('emite projetoChange ao mudar select de projeto', () => {
    const projetoSelect = fixture.nativeElement.querySelectorAll('select')[0] as HTMLSelectElement;
    projetoSelect.dispatchEvent(new Event('change'));
    expect(fixture.componentInstance.projetoChangeCount).toBe(1);
  });
});

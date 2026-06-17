import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { BuscaResultListComponent } from './busca-result-list.component';

interface Item {
  id: string;
  nome: string;
  slug: string;
}

@Component({
  standalone: true,
  imports: [BuscaResultListComponent],
  template: `<app-busca-result-list
    titulo="Clientes"
    subtitulo="Resultados por nome ou slug."
    emptyLabel="Sem clientes encontrados."
    [items]="items"
    [termo]="termo"
    [primaryFn]="primaryFn"
    [secondaryFn]="secondaryFn"
    (abrir)="aberto = $event"
  />`,
})
class HostComponent {
  items: Item[] = [
    { id: '1', nome: 'Acme Corp', slug: 'acme' },
    { id: '2', nome: 'Globex', slug: 'globex' },
  ];
  termo = '';
  primaryFn = (i: Item): string => i.nome;
  secondaryFn = (i: Item): string => i.slug;
  aberto: Item | null = null;
}

describe('BuscaResultListComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renderiza título e subtítulo', () => {
    expect(fixture.nativeElement.textContent).toContain('Clientes');
    expect(fixture.nativeElement.textContent).toContain('Resultados por nome ou slug.');
  });

  it('renderiza items via primary/secondary fn', () => {
    expect(fixture.nativeElement.textContent).toContain('Acme Corp');
    expect(fixture.nativeElement.textContent).toContain('acme');
  });

  it('mostra emptyLabel quando lista vazia', () => {
    fixture.componentInstance.items = [];
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sem clientes encontrados.');
  });

  it('emite abrir ao clicar em uma linha', () => {
    const linha = fixture.nativeElement.querySelector('.busca-rl__row') as HTMLButtonElement;
    linha.click();
    expect(fixture.componentInstance.aberto?.nome).toBe('Acme Corp');
  });

  it('aplica highlight ao termo', () => {
    fixture.componentInstance.termo = 'globex';
    fixture.detectChanges();
    const html = fixture.nativeElement.innerHTML as string;
    expect(html).toContain('<mark>');
  });
});

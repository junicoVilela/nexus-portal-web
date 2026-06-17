import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Usuários');
  });

  it('renders title and subtitle', () => {
    fixture.componentRef.setInput('subtitle', '128 contas ativas');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Usuários');
    expect(fixture.nativeElement.textContent).toContain('128 contas ativas');
  });
});

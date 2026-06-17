import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  it('renders line shape by default', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span');
    expect(el.classList.contains('ui-skel--line')).toBeTrue();
  });

  it('applies circle shape when shape="circle"', () => {
    fixture.componentRef.setInput('shape', 'circle');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('span').classList.contains('ui-skel--circle')).toBeTrue();
  });

  it('applies custom width and height', () => {
    fixture.componentRef.setInput('width', '120px');
    fixture.componentRef.setInput('height', '32px');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('span') as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
  });
});

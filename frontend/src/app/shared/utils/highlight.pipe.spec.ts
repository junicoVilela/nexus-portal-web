import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    pipe = TestBed.runInInjectionContext(() => new HighlightPipe());
    sanitizer = TestBed.inject(DomSanitizer);
  });

  function asHtml(safe: unknown): string {
    return sanitizer.sanitize(1 /* SecurityContext.HTML */, safe as never) ?? '';
  }

  it('retorna o texto puro quando o termo é vazio', () => {
    expect(asHtml(pipe.transform('Olá mundo', ''))).toBe('Olá mundo');
  });

  it('envolve a ocorrência em <mark>', () => {
    expect(asHtml(pipe.transform('Olá mundo', 'mundo'))).toContain('<mark>mundo</mark>');
  });

  it('é case-insensitive e preserva o casing original do texto', () => {
    expect(asHtml(pipe.transform('Release Orchestrator', 'orchestrator'))).toContain('<mark>Orchestrator</mark>');
  });

  it('escapa HTML do texto base', () => {
    const out = asHtml(pipe.transform('<script>alert(1)</script>', 'script'));
    expect(out).not.toContain('<script>');
    expect(out).toContain('&lt;');
  });

  it('escapa metacaracteres regex no termo', () => {
    expect(asHtml(pipe.transform('1+1=2', '+'))).toContain('<mark>+</mark>');
  });
});

import { TestBed } from '@angular/core/testing';
import { CommandPaletteService, PaletteCommand } from './command-palette.service';

describe('CommandPaletteService', () => {
  let svc: CommandPaletteService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CommandPaletteService] });
    svc = TestBed.inject(CommandPaletteService);
  });

  it('starts closed and with empty results', () => {
    expect(svc.isOpen()).toBeFalse();
    expect(svc.results().length).toBe(0);
  });

  it('open() + register() + filter()', () => {
    const cmds: PaletteCommand[] = [
      { id: 'home', label: 'Início', group: 'Navegação', route: '/' },
      { id: 'doc-flow', label: 'DocFlow', group: 'Navegação', route: '/doc-flow' },
      { id: 'release', label: 'Release Orchestrator', group: 'Navegação', route: '/release-orchestrator' },
    ];
    svc.register(cmds);
    svc.open();
    expect(svc.isOpen()).toBeTrue();
    expect(svc.results().length).toBe(3);

    svc.query.set('flow');
    expect(svc.results().map(c => c.id)).toEqual(['doc-flow', 'release']);
  });

  it('close() clears query and closes', () => {
    svc.register([{ id: 'home', label: 'Início', group: 'Navegação', route: '/' }]);
    svc.open();
    svc.query.set('hom');
    svc.close();
    expect(svc.isOpen()).toBeFalse();
    expect(svc.query()).toBe('');
  });

  it('registerMany merges commands by namespace id', () => {
    svc.registerMany('shell', [{ id: 'shell:home', label: 'Início', group: 'Navegação' }]);
    svc.registerMany('docflow', [{ id: 'docflow:new', label: 'Novo manual', group: 'DocFlow' }]);
    expect(svc.results().length).toBe(2);
    expect(
      svc
        .results()
        .map(c => c.id)
        .sort(),
    ).toEqual(['docflow:new', 'shell:home']);
  });

  it('registerMany with the same namespace replaces only that namespace', () => {
    svc.registerMany('shell', [{ id: 'shell:home', label: 'Início', group: 'Navegação' }]);
    svc.registerMany('docflow', [{ id: 'docflow:new', label: 'Novo manual', group: 'DocFlow' }]);
    svc.registerMany('shell', [{ id: 'shell:home2', label: 'Início v2', group: 'Navegação' }]);
    expect(svc.results().length).toBe(2);
    expect(
      svc
        .results()
        .map(c => c.id)
        .sort(),
    ).toEqual(['docflow:new', 'shell:home2']);
  });

  it('unregister removes only that namespace', () => {
    svc.registerMany('shell', [{ id: 'shell:home', label: 'X', group: 'Y' }]);
    svc.registerMany('docflow', [{ id: 'docflow:new', label: 'X', group: 'Y' }]);
    svc.unregister('shell');
    expect(svc.results().map(c => c.id)).toEqual(['docflow:new']);
  });

  it('legacy register() is preserved as namespace "_legacy"', () => {
    svc.register([{ id: 'home', label: 'X', group: 'Y' }]);
    svc.registerMany('docflow', [{ id: 'd', label: 'X', group: 'Y' }]);
    expect(
      svc
        .results()
        .map(c => c.id)
        .sort(),
    ).toEqual(['d', 'home']);
  });
});

import { TestBed } from '@angular/core/testing';
import { InstallPromptService } from './install-prompt.service';

interface MockEvent extends Event {
  prompt: jasmine.Spy;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function fireBeforeInstallPrompt(outcome: 'accepted' | 'dismissed' = 'accepted'): MockEvent {
  const evt = new Event('beforeinstallprompt') as MockEvent;
  evt.prompt = jasmine.createSpy('prompt').and.resolveTo(undefined);
  evt.userChoice = Promise.resolve({ outcome, platform: 'web' });
  spyOn(evt, 'preventDefault');
  window.dispatchEvent(evt);
  return evt;
}

describe('InstallPromptService', () => {
  let service: InstallPromptService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [InstallPromptService] });
    service = TestBed.inject(InstallPromptService);
  });

  afterAll(() => localStorage.clear());

  it('inicia indisponível e sem instalação em curso', () => {
    expect(service.available()).toBe(false);
    expect(service.installing()).toBe(false);
  });

  it('available passa a true quando beforeinstallprompt dispara', () => {
    fireBeforeInstallPrompt();
    expect(service.available()).toBe(true);
  });

  it('preventDefault é chamado pelo handler', () => {
    const evt = fireBeforeInstallPrompt();
    expect(evt.preventDefault).toHaveBeenCalled();
  });

  it('install() chama prompt() e oculta o banner em aceite', async () => {
    const evt = fireBeforeInstallPrompt('accepted');
    await service.install();
    expect(evt.prompt).toHaveBeenCalled();
    expect(service.available()).toBe(false);
  });

  it('install() registra snooze quando user dispensa', async () => {
    fireBeforeInstallPrompt('dismissed');
    await service.install();
    expect(localStorage.getItem('pwa-install-dismissed-at')).toBeTruthy();
    expect(service.available()).toBe(false);
  });

  it('dismiss() snooza e oculta', () => {
    fireBeforeInstallPrompt();
    service.dismiss();
    expect(localStorage.getItem('pwa-install-dismissed-at')).toBeTruthy();
    expect(service.available()).toBe(false);
  });

  it('appinstalled limpa o estado', () => {
    fireBeforeInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));
    expect(service.available()).toBe(false);
  });

  it('não exibe banner se foi dispensado recentemente', () => {
    localStorage.setItem('pwa-install-dismissed-at', String(Date.now()));
    fireBeforeInstallPrompt();
    expect(service.available()).toBe(false);
  });
});

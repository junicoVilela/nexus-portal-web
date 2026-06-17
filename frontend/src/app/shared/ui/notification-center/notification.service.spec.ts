import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    localStorage.clear();
    service = new NotificationService();
  });

  afterAll(() => localStorage.clear());

  it('starts empty when nothing is in localStorage', () => {
    expect(service.items()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  it('adds a notification with default unread state', () => {
    service.add('info', 'Olá');
    expect(service.items().length).toBe(1);
    expect(service.items()[0].read).toBe(false);
    expect(service.unreadCount()).toBe(1);
  });

  it('inserts newest item at the top and caps at 50', () => {
    for (let i = 0; i < 55; i++) service.add('info', `item ${i}`);
    const list = service.items();
    expect(list.length).toBe(50);
    expect(list[0].title).toBe('item 54');
  });

  it('markRead flips read flag for a single id', () => {
    service.add('info', 'a');
    const id = service.items()[0].id;
    service.markRead(id);
    expect(service.items()[0].read).toBe(true);
    expect(service.unreadCount()).toBe(0);
  });

  it('markAllRead clears the unread count', () => {
    service.add('info', 'a');
    service.add('warn', 'b');
    service.markAllRead();
    expect(service.unreadCount()).toBe(0);
  });

  it('remove() drops the matching id', () => {
    service.add('info', 'a');
    service.add('info', 'b');
    const id = service.items()[0].id;
    service.remove(id);
    expect(service.items().length).toBe(1);
  });

  it('clear() empties the list', () => {
    service.add('info', 'a');
    service.clear();
    expect(service.items()).toEqual([]);
  });

  it('persists across instances via localStorage', () => {
    service.add('info', 'persisted');
    const next = new NotificationService();
    expect(next.items()[0].title).toBe('persisted');
  });
});

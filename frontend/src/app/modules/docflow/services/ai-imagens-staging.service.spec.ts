import { AiImagensStagingService } from './ai-imagens-staging.service';

describe('AiImagensStagingService', () => {
  it('stash/consume esvazia o staging', () => {
    const svc = new AiImagensStagingService();
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    svc.stash([file]);
    expect(svc.peek()).toHaveSize(1);
    expect(svc.consume()).toEqual([file]);
    expect(svc.peek()).toHaveSize(0);
  });
});

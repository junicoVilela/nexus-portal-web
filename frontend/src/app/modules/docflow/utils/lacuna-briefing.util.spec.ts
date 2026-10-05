import { briefingDaLacuna } from './lacuna-briefing.util';

describe('briefingDaLacuna', () => {
  it('cita o termo e quantas vezes ele foi buscado', () => {
    const briefing = briefingDaLacuna('  nota fiscal ', 5);

    expect(briefing).toContain('buscaram "nota fiscal" 5 vezes');
    expect(briefing).toContain('o que é "nota fiscal"');
  });

  it('usa o singular para uma ocorrência', () => {
    expect(briefingDaLacuna('estorno', 1)).toContain('"estorno" 1 vez nos');
  });

  it('corta termos longos', () => {
    expect(briefingDaLacuna('x'.repeat(500), 2)).not.toContain('x'.repeat(121));
  });
});

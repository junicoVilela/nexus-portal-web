/** Contrato das chaves e dos sinônimos do manual com o OpenAPI gerado (checado na compilação). */
import type {
  AcessoResponse,
  CriadoResponse,
  CriarRequest,
  SinonimoRequest,
  SinonimoResponse,
} from '../../../api/generated/types.gen';
import type { ManualAcesso, ManualAcessoCriado, ManualAcessoPayload } from '../models/manual-acesso.model';
import type { ManualSinonimo, ManualSinonimoPayload } from '../models/manual-sinonimo.model';

type SoNoFront<Front, Api> = Exclude<keyof Front, keyof Api>;
type Vazio<T extends never> = T;
type SemNull<T> = { [K in keyof T]: Exclude<T[K], null> };
type Cabe<Payload, Request> = [SemNull<Payload>] extends [Request] ? true : false;
type Verdadeiro<T extends true> = T;

export type ContratoManualAcesso = [
  Vazio<SoNoFront<ManualAcesso, AcessoResponse>>,
  Vazio<SoNoFront<ManualAcessoCriado, CriadoResponse>>,
  Verdadeiro<Cabe<ManualAcessoPayload, CriarRequest>>,
  Vazio<SoNoFront<ManualSinonimo, SinonimoResponse>>,
  Verdadeiro<Cabe<ManualSinonimoPayload, SinonimoRequest>>,
];

describe('Contrato das chaves do manual com o OpenAPI', () => {
  it('é verificado na compilação (tipos acima)', () => {
    expect(true).toBeTrue();
  });
});

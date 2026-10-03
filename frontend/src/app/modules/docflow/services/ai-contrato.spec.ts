/**
 * Contrato do cliente AI (escrito à mão) contra o OpenAPI gerado (`npm run api:generate`).
 *
 * O cliente continua manual — SSE, FormData e modelos com uniões mais estreitas que o contrato —,
 * mas estes tipos falham na compilação (`tsc`/`ng test`/`api:check`) quando o backend renomeia ou
 * remove um campo que o front lê, ou quando um payload do front deixa de caber no request da API.
 */
import type {
  AiAjustePaginaRequest,
  AiAjustePaginaResponse,
  AiAplicacaoResponse,
  AiAtualizarComposicaoDocumentoRequest,
  AiConfirmarEstruturaDocumentoRequest,
  AiEstimativaLoteDocumentoResponse,
  AiImportacaoDocumentoResponse,
  AiImportacaoResumoResponse,
  AiJobResponse,
  AiMensagemRequest,
  AiMetricasResponse,
  AiPropostaResponse,
  AiReordenarEstruturaDocumentoRequest,
  AiSessaoResponse,
  AiStatusResponse,
  AiTemplateRecomendacaoRequest,
  AiTemplateRecomendacaoResponse,
  AiVincularPaginaRequest,
  CriarAiSessaoRequest,
  RejeitarAiPropostaRequest,
} from '../../../api/generated/types.gen';
import type {
  AiAtualizarComposicaoDocumentoPayload,
  AiConfirmarEstruturaDocumentoPayload,
  AiDocumentoImportacao,
  AiDocumentoSugestao,
  AiEstimativaLoteDocumento,
  AiImportacaoResumo,
  AiModuloDocumento,
  AiPaginaDocumento,
  AiReordenarEstruturaDocumentoPayload,
} from '../models/ai-documento-importacao.model';
import type {
  AiAjustePaginaPayload,
  AiAjustePaginaResposta,
  AiAplicacao,
  AiJob,
  AiPatchOperacao,
  AiProposta,
  AiQualidadeItem,
} from '../models/ai-proposta.model';
import type { AiMetricas, AiMetricasPrompt } from '../models/ai-metricas.model';
import type {
  AiMensagem,
  AiMensagemPayload,
  AiObjetivo,
  AiPergunta,
  AiSessao,
  AiSessaoStatus,
  CriarAiSessaoPayload,
} from '../models/ai-sessao.model';
import type { AiStatus } from '../models/ai-status.model';
import type {
  AiComponenteCandidato,
  AiTemplateCandidato,
  AiTemplateRecomendacao,
  AiTemplateRecomendacaoPayload,
} from '../models/ai-template-recomendacao.model';

type Item<T> = NonNullable<T> extends readonly (infer I)[] ? I : never;
/** Campos que o front lê mas a API não devolve (precisa ser `never`). */
type SoNoFront<Front, Api> = Exclude<keyof Front, keyof Api>;
type Vazio<T extends never> = T;
/** O Java recebe `null` como ausente; o contrato gerado só declara `undefined`. */
type SemNull<T> = { [K in keyof T]: Exclude<T[K], null> };
/** O payload do front cabe no request da API (erro de compilação aponta a linha do par). */
type Cabe<Payload, Request> = [SemNull<Payload>] extends [Request] ? true : false;
type Verdadeiro<T extends true> = T;
/** A união do front é subconjunto da enum da API. */
type Subconjunto<Front extends Api, Api> = Front;

type Importacao = AiImportacaoDocumentoResponse;
type ModuloImportacao = Item<Importacao['modulos']>;
type Sessao = AiSessaoResponse;
type Recomendacao = AiTemplateRecomendacaoResponse;

export type ContratoRespostas = [
  Vazio<SoNoFront<AiStatus, AiStatusResponse>>,
  Vazio<SoNoFront<AiSessao, Sessao>>,
  Vazio<SoNoFront<AiMensagem, Item<Sessao['mensagens']>>>,
  Vazio<SoNoFront<AiPergunta, Item<Item<Sessao['mensagens']>['perguntas']>>>,
  Subconjunto<AiSessaoStatus, NonNullable<Sessao['status']>>,
  Subconjunto<AiObjetivo, NonNullable<Sessao['objetivo']>>,
  Vazio<SoNoFront<AiProposta, AiPropostaResponse>>,
  Vazio<SoNoFront<AiQualidadeItem, Item<AiPropostaResponse['qualidade']>>>,
  Vazio<SoNoFront<AiPatchOperacao, Item<AiPropostaResponse['operacoes']>>>,
  Vazio<SoNoFront<AiJob, AiJobResponse>>,
  Vazio<SoNoFront<AiAplicacao, AiAplicacaoResponse>>,
  Vazio<SoNoFront<AiAjustePaginaResposta, AiAjustePaginaResponse>>,
  Vazio<SoNoFront<AiMetricas, AiMetricasResponse>>,
  Vazio<SoNoFront<AiMetricasPrompt, Item<AiMetricasResponse['porPrompt']>>>,
  Vazio<SoNoFront<AiTemplateRecomendacao, Recomendacao>>,
  Vazio<SoNoFront<AiTemplateCandidato, Item<Recomendacao['candidatos']>>>,
  Vazio<SoNoFront<AiComponenteCandidato, Item<Recomendacao['componentes']>>>,
  Vazio<SoNoFront<AiDocumentoImportacao, Importacao>>,
  Vazio<SoNoFront<AiModuloDocumento, ModuloImportacao>>,
  Vazio<SoNoFront<AiPaginaDocumento, Item<ModuloImportacao['paginas']>>>,
  Vazio<SoNoFront<AiDocumentoSugestao, Item<Importacao['sugestoes']>>>,
  Vazio<SoNoFront<AiEstimativaLoteDocumento, AiEstimativaLoteDocumentoResponse>>,
  Vazio<SoNoFront<AiImportacaoResumo, AiImportacaoResumoResponse>>,
];

export type ContratoRequests = [
  Verdadeiro<Cabe<CriarAiSessaoPayload, CriarAiSessaoRequest>>,
  Verdadeiro<Cabe<AiMensagemPayload, AiMensagemRequest>>,
  Verdadeiro<Cabe<AiTemplateRecomendacaoPayload, AiTemplateRecomendacaoRequest>>,
  Verdadeiro<Cabe<AiAjustePaginaPayload, AiAjustePaginaRequest>>,
  Verdadeiro<Cabe<AiConfirmarEstruturaDocumentoPayload, AiConfirmarEstruturaDocumentoRequest>>,
  Verdadeiro<Cabe<AiReordenarEstruturaDocumentoPayload, AiReordenarEstruturaDocumentoRequest>>,
  Verdadeiro<Cabe<AiAtualizarComposicaoDocumentoPayload, AiAtualizarComposicaoDocumentoRequest>>,
  Verdadeiro<Cabe<{ paginaId: string }, AiVincularPaginaRequest>>,
  Verdadeiro<Cabe<{ motivo?: string }, RejeitarAiPropostaRequest>>,
];

describe('Contrato do cliente AI com o OpenAPI', () => {
  it('é verificado na compilação (tipos acima)', () => {
    expect(true).toBeTrue();
  });
});

import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { AiComponentComposerComponent } from '../ai-component-composer/ai-component-composer.component';
import { BlocoPagina } from '../pagina-block-library';
import { AiModuloDocumento, AiPaginaDocumento } from '../../models/ai-documento-importacao.model';
import { AiTemplateRecomendacao } from '../../models/ai-template-recomendacao.model';
import { PaginaBlocoService } from '../../services/pagina-bloco.service';
import {
  extrairConteudoPagina,
  paginaPodeSerEditada,
  rotuloOrigemPagina,
} from './ai-documento-estrutura.utils';

type InspectorModo = 'PREVIA' | 'EDITAR' | 'CRIAR' | 'DIVIDIR' | 'MESCLAR' | 'COMPOSICAO';

export interface AiDocumentoPreviewDialogData {
  pagina: AiPaginaDocumento;
  modulo: AiModuloDocumento;
  projetoNome: string;
  paginasMesclagem: AiPaginaDocumento[];
  criacao?: boolean;
}

export type AiDocumentoInspectorResultado =
  | { tipo: 'SALVAR'; titulo: string; conteudo: string }
  | { tipo: 'CRIAR'; titulo: string; conteudo: string }
  | {
      tipo: 'DIVIDIR';
      atual: { titulo: string; conteudo: string };
      nova: { titulo: string; conteudo: string };
    }
  | { tipo: 'MESCLAR'; paginaRemovidaId: string; titulo: string; conteudo: string }
  | { tipo: 'COMPOSICAO'; componentesSelecionados: string[] }
  | { tipo: 'EXCLUIR' };

@Component({
  selector: 'app-ai-documento-preview-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, AiComponentComposerComponent],
  templateUrl: './ai-documento-preview-dialog.component.html',
  styleUrl: './ai-documento-preview-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiDocumentoPreviewDialogComponent implements OnInit {
  protected readonly data = inject<AiDocumentoPreviewDialogData>(DIALOG_DATA);
  private readonly dialogRef = inject<DialogRef<AiDocumentoInspectorResultado | undefined>>(DialogRef);
  private readonly fb = inject(FormBuilder);
  private readonly blocoService = inject(PaginaBlocoService);

  protected readonly modo = signal<InspectorModo>(this.data.criacao ? 'CRIAR' : 'PREVIA');
  protected readonly conteudoHtml = signal<string | null>(null);
  protected readonly catalogo = signal<BlocoPagina[]>([]);
  protected readonly componentesSelecionados = signal<string[]>([
    ...(this.data.pagina.componentesSelecionados ?? []),
  ]);
  protected readonly origemLabel = rotuloOrigemPagina(this.data.pagina.origem);
  protected readonly editavel = paginaPodeSerEditada(this.data.pagina);
  protected readonly podeMesclar = this.editavel && this.data.paginasMesclagem.length > 0;
  protected readonly planoComposicao: AiTemplateRecomendacao = {
    recomendado: this.data.pagina.templateId
      ? {
          templateId: this.data.pagina.templateId,
          codigo: this.data.pagina.templateCodigo ?? '',
          nome: this.data.pagina.templateNome ?? 'Modelo recomendado',
          descricao: null,
          confianca: this.data.pagina.confiancaTemplate,
          motivo: this.data.pagina.motivoTemplate,
        }
      : null,
    candidatos: [],
    exigeConfirmacao: false,
    blueprintId: this.data.pagina.blueprintId ?? null,
    blueprintNome: this.data.pagina.blueprintNome ?? null,
    totalBiblioteca: 0,
    componentes: (this.data.pagina.componentesSelecionados ?? []).map(id => {
      const obrigatorio = (this.data.pagina.componentesObrigatorios ?? []).includes(id);
      return {
        id,
        nome: nomeComponente(id),
        descricao: 'Componente selecionado para a arquitetura desta página.',
        categoria: 'Estrutura',
        visual: 'intro',
        necessidade: obrigatorio ? 'OBRIGATORIA' : 'RECOMENDADA',
        obrigatorio,
        motivo: obrigatorio
          ? 'Essencial para o blueprint desta página.'
          : 'Selecionado pela IA a partir do conteúdo do documento.',
      };
    }),
  };

  protected readonly paginaForm = this.fb.nonNullable.group({
    titulo: [
      this.data.criacao ? '' : this.data.pagina.titulo,
      [Validators.required, Validators.maxLength(180)],
    ],
    conteudo: [
      this.data.criacao ? '' : extrairConteudoPagina(this.data.pagina.briefing),
      [Validators.required, Validators.maxLength(200_000)],
    ],
  });

  protected readonly divisaoForm = this.fb.nonNullable.group({
    tituloAtual: ['', [Validators.required, Validators.maxLength(180)]],
    conteudoAtual: ['', [Validators.required, Validators.maxLength(200_000)]],
    tituloNova: ['', [Validators.required, Validators.maxLength(180)]],
    conteudoNovo: ['', [Validators.required, Validators.maxLength(200_000)]],
  });

  protected readonly mesclagemForm = this.fb.nonNullable.group({
    paginaId: ['', Validators.required],
    titulo: [this.data.pagina.titulo, [Validators.required, Validators.maxLength(180)]],
    conteudo: ['', [Validators.required, Validators.maxLength(200_000)]],
  });

  async ngOnInit(): Promise<void> {
    if (!this.data.criacao) await this.renderizar(this.data.pagina.briefing);
    this.blocoService.listar().subscribe({
      next: catalogo => {
        this.catalogo.set(catalogo);
        this.planoComposicao.totalBiblioteca = catalogo.length;
        const obrigatorios = new Set(this.data.pagina.componentesObrigatorios ?? []);
        this.planoComposicao.componentes = this.componentesSelecionados()
          .map(id => catalogo.find(bloco => bloco.id === id))
          .filter((bloco): bloco is BlocoPagina => !!bloco)
          .map(bloco => ({
            id: bloco.id,
            nome: bloco.nome,
            descricao: bloco.descricao,
            categoria: bloco.categoria,
            visual: bloco.visual,
            necessidade: obrigatorios.has(bloco.id) ? 'OBRIGATORIA' : 'RECOMENDADA',
            obrigatorio: obrigatorios.has(bloco.id),
            motivo: obrigatorios.has(bloco.id)
              ? 'Essencial para o blueprint desta página.'
              : 'Selecionado pela IA a partir do conteúdo do documento.',
          }));
      },
      error: () => {
        /* A prévia textual continua disponível quando o catálogo estiver temporariamente offline. */
      },
    });
  }

  protected editar(): void {
    if (this.editavel) this.modo.set('EDITAR');
  }

  protected dividir(): void {
    if (!this.editavel) return;
    const [primeiraParte, segundaParte] = dividirConteudo(this.paginaForm.controls.conteudo.value);
    this.divisaoForm.setValue({
      tituloAtual: this.paginaForm.controls.titulo.value,
      conteudoAtual: primeiraParte,
      tituloNova: `${this.paginaForm.controls.titulo.value} — continuação`,
      conteudoNovo: segundaParte,
    });
    this.modo.set('DIVIDIR');
  }

  protected mesclar(): void {
    if (!this.podeMesclar) return;
    const destino = this.data.paginasMesclagem[0];
    this.mesclagemForm.controls.paginaId.setValue(destino.id);
    this.prepararConteudoMesclagem(destino.id);
    this.modo.set('MESCLAR');
  }

  protected compor(): void {
    if (this.editavel) this.modo.set('COMPOSICAO');
  }

  protected atualizarComponentes(ids: string[]): void {
    this.componentesSelecionados.set(ids);
  }

  protected salvarComposicao(): void {
    const ids = this.componentesSelecionados();
    if (ids.length < 3 || ids.length > 12) return;
    this.dialogRef.close({ tipo: 'COMPOSICAO', componentesSelecionados: ids });
  }

  protected selecionarPaginaMesclagem(event: Event): void {
    this.prepararConteudoMesclagem((event.target as HTMLSelectElement).value);
  }

  protected voltar(): void {
    if (this.data.criacao) {
      this.fechar();
      return;
    }
    this.modo.set('PREVIA');
  }

  protected salvar(): void {
    this.paginaForm.markAllAsTouched();
    if (this.paginaForm.invalid) return;
    const valor = this.paginaForm.getRawValue();
    this.dialogRef.close({
      tipo: this.data.criacao ? 'CRIAR' : 'SALVAR',
      titulo: valor.titulo.trim(),
      conteudo: valor.conteudo.trim(),
    });
  }

  protected confirmarDivisao(): void {
    this.divisaoForm.markAllAsTouched();
    if (this.divisaoForm.invalid) return;
    const valor = this.divisaoForm.getRawValue();
    this.dialogRef.close({
      tipo: 'DIVIDIR',
      atual: {
        titulo: valor.tituloAtual.trim(),
        conteudo: valor.conteudoAtual.trim(),
      },
      nova: {
        titulo: valor.tituloNova.trim(),
        conteudo: valor.conteudoNovo.trim(),
      },
    });
  }

  protected confirmarMesclagem(): void {
    this.mesclagemForm.markAllAsTouched();
    if (this.mesclagemForm.invalid) return;
    const valor = this.mesclagemForm.getRawValue();
    this.dialogRef.close({
      tipo: 'MESCLAR',
      paginaRemovidaId: valor.paginaId,
      titulo: valor.titulo.trim(),
      conteudo: valor.conteudo.trim(),
    });
  }

  protected solicitarExclusao(): void {
    if (this.editavel) this.dialogRef.close({ tipo: 'EXCLUIR' });
  }

  protected fechar(): void {
    this.dialogRef.close();
  }

  private prepararConteudoMesclagem(paginaId: string): void {
    const destino = this.data.paginasMesclagem.find(pagina => pagina.id === paginaId);
    if (!destino) return;
    this.mesclagemForm.controls.paginaId.setValue(destino.id);
    this.mesclagemForm.controls.conteudo.setValue(
      `${this.paginaForm.controls.conteudo.value.trim()}\n\n## ${destino.titulo}\n\n${extrairConteudoPagina(
        destino.briefing,
      )}`,
    );
  }

  private async renderizar(markdown: string): Promise<void> {
    const { marked } = await import('marked');
    this.conteudoHtml.set(marked.parse(markdown, { async: false }) as string);
  }
}

function dividirConteudo(conteudo: string): [string, string] {
  const blocos = conteudo
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean);
  if (blocos.length > 1) {
    const meio = Math.ceil(blocos.length / 2);
    return [blocos.slice(0, meio).join('\n\n'), blocos.slice(meio).join('\n\n')];
  }
  const palavras = conteudo.trim().split(/\s+/);
  const meio = Math.max(1, Math.ceil(palavras.length / 2));
  return [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')];
}

function nomeComponente(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map(parte => parte.charAt(0).toLocaleUpperCase('pt-BR') + parte.slice(1))
    .join(' ');
}

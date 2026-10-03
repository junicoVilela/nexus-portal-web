import { Routes } from '@angular/router';

import { canDeactivateGuard } from '@shared/guards';
import { permissaoGuard } from '@modules/identity-access/guards';

export const DOCFLOW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/docflow-shell.component').then(component => component.DocflowShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(component => component.DashboardComponent),
      },
      {
        path: 'clientes/novo',
        loadComponent: () =>
          import('./pages/clientes/cliente-form/cliente-form.component').then(
            component => component.ClienteFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:CRIAR'] },
      },
      {
        path: 'clientes/:id/editar',
        loadComponent: () =>
          import('./pages/clientes/cliente-form/cliente-form.component').then(
            component => component.ClienteFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:EDITAR'] },
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./pages/clientes/clientes-list/clientes.component').then(
            component => component.ClientesComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:LER'] },
      },
      {
        path: 'projetos/novo',
        loadComponent: () =>
          import('./pages/projetos/projeto-form/projeto-form.component').then(
            component => component.ProjetoFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:CRIAR'] },
      },
      {
        path: 'projetos/:id/editar',
        loadComponent: () =>
          import('./pages/projetos/projeto-form/projeto-form.component').then(
            component => component.ProjetoFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:EDITAR'] },
      },
      {
        path: 'projetos',
        loadComponent: () =>
          import('./pages/projetos/projetos-list/projetos.component').then(
            component => component.ProjetosComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:LER'] },
      },
      {
        path: 'modulos/novo',
        loadComponent: () =>
          import('./pages/modulos/modulo-form/modulo-form.component').then(
            component => component.ModuloFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:CRIAR'] },
      },
      {
        path: 'modulos/:id/editar',
        loadComponent: () =>
          import('./pages/modulos/modulo-form/modulo-form.component').then(
            component => component.ModuloFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:EDITAR'] },
      },
      {
        path: 'modulos',
        loadComponent: () =>
          import('./pages/modulos/modulos-list/modulos.component').then(
            component => component.ModulosComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:LER'] },
      },
      {
        path: 'paginas/novo',
        loadComponent: () =>
          import('./pages/paginas/pagina-form/pagina-form.component').then(
            component => component.PaginaFormComponent,
          ),
        canActivate: [permissaoGuard],
        canDeactivate: [canDeactivateGuard],
        data: { permissoes: ['PAGINA:CRIAR'] },
      },
      {
        path: 'paginas/:id/editar',
        loadComponent: () =>
          import('./pages/paginas/pagina-form/pagina-form.component').then(
            component => component.PaginaFormComponent,
          ),
        canActivate: [permissaoGuard],
        canDeactivate: [canDeactivateGuard],
        data: { permissoes: ['PAGINA:EDITAR'] },
      },
      {
        path: 'paginas',
        loadComponent: () =>
          import('./pages/paginas/paginas-list/paginas.component').then(
            component => component.PaginasComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'assistente/importacoes/:id/revisao',
        loadComponent: () =>
          import('./pages/assistente-revisao/ai-assistente-revisao.component').then(
            component => component.AiAssistenteRevisaoComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:AI_GERAR'] },
      },
      {
        path: 'assistente',
        loadComponent: () =>
          import('./pages/assistente/ai-assistente.component').then(
            component => component.AiAssistenteComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:AI_GERAR'] },
      },
      {
        path: 'ia-qualidade',
        loadComponent: () =>
          import('./pages/ai-qualidade/ai-qualidade.component').then(
            component => component.AiQualidadeComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['AUDITORIA:VISUALIZAR'] },
      },
      {
        path: 'revisoes',
        loadComponent: () =>
          import('./pages/revisoes/revisoes.component').then(component => component.RevisoesComponent),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'trechos',
        loadComponent: () =>
          import('./pages/trechos/trechos.component').then(component => component.TrechosComponent),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'midias',
        loadComponent: () =>
          import('./pages/midias/midias.component').then(component => component.MidiasComponent),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'publicacoes/:id/detalhe',
        loadComponent: () =>
          import('./pages/publicacoes/publicacao-detalhe/publicacao-detalhe.component').then(
            component => component.PublicacaoDetalheComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:LER'] },
      },
      {
        path: 'publicacoes/novo',
        loadComponent: () =>
          import('./pages/publicacoes/publicacao-form/publicacao-form.component').then(
            component => component.PublicacaoFormComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:CRIAR'] },
      },
      {
        path: 'publicacoes',
        loadComponent: () =>
          import('./pages/publicacoes/publicacoes-list/publicacoes.component').then(
            component => component.PublicacoesComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:LER'] },
      },
      {
        path: 'busca',
        loadComponent: () =>
          import('./pages/busca-global/busca-global.component').then(
            component => component.BuscaGlobalComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/configuracoes/configuracoes.component').then(
            component => component.ConfiguracoesComponent,
          ),
      },
      {
        path: 'ajuda/gerenciar',
        loadComponent: () =>
          import('./pages/ajuda-admin/ajuda-admin.component').then(
            component => component.AjudaAdminComponent,
          ),
        canActivate: [permissaoGuard],
        data: { permissoes: ['AJUDA:EDITAR'] },
      },
      {
        path: 'ajuda',
        loadComponent: () =>
          import('./pages/ajuda/ajuda.component').then(component => component.AjudaComponent),
        canActivate: [permissaoGuard],
        data: { permissoes: ['AJUDA:LER'] },
      },
    ],
  },
];

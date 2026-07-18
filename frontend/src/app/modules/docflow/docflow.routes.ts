import { Routes } from '@angular/router';

import { canDeactivateGuard } from '@shared/guards';
import { DocflowShellComponent } from './shell/docflow-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClienteFormComponent } from './pages/clientes/cliente-form/cliente-form.component';
import { ClientesComponent } from './pages/clientes/clientes-list/clientes.component';
import { ProjetoFormComponent } from './pages/projetos/projeto-form/projeto-form.component';
import { ProjetosComponent } from './pages/projetos/projetos-list/projetos.component';
import { ModuloFormComponent } from './pages/modulos/modulo-form/modulo-form.component';
import { ModulosComponent } from './pages/modulos/modulos-list/modulos.component';
import { PaginaFormComponent } from './pages/paginas/pagina-form/pagina-form.component';
import { PaginasComponent } from './pages/paginas/paginas-list/paginas.component';
import { PublicacaoDetalheComponent } from './pages/publicacoes/publicacao-detalhe/publicacao-detalhe.component';
import { PublicacaoFormComponent } from './pages/publicacoes/publicacao-form/publicacao-form.component';
import { PublicacoesComponent } from './pages/publicacoes/publicacoes-list/publicacoes.component';
import { BuscaGlobalComponent } from './pages/busca-global/busca-global.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';
import { permissaoGuard } from '@modules/seguranca/guards';

export const DOCFLOW_ROUTES: Routes = [
  {
    path: '',
    component: DocflowShellComponent,
    children: [
      { path: '', component: DashboardComponent },
      {
        path: 'clientes/novo',
        component: ClienteFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:CRIAR'] },
      },
      {
        path: 'clientes/:id/editar',
        component: ClienteFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:EDITAR'] },
      },
      {
        path: 'clientes',
        component: ClientesComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['CLIENTE:LER'] },
      },
      {
        path: 'projetos/novo',
        component: ProjetoFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:CRIAR'] },
      },
      {
        path: 'projetos/:id/editar',
        component: ProjetoFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:EDITAR'] },
      },
      {
        path: 'projetos',
        component: ProjetosComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PROJETO:LER'] },
      },
      {
        path: 'modulos/novo',
        component: ModuloFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:CRIAR'] },
      },
      {
        path: 'modulos/:id/editar',
        component: ModuloFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:EDITAR'] },
      },
      {
        path: 'modulos',
        component: ModulosComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['MODULO:LER'] },
      },
      {
        path: 'paginas/novo',
        component: PaginaFormComponent,
        canActivate: [permissaoGuard],
        canDeactivate: [canDeactivateGuard],
        data: { permissoes: ['PAGINA:CRIAR'] },
      },
      {
        path: 'paginas/:id/editar',
        component: PaginaFormComponent,
        canActivate: [permissaoGuard],
        canDeactivate: [canDeactivateGuard],
        data: { permissoes: ['PAGINA:EDITAR'] },
      },
      {
        path: 'paginas',
        component: PaginasComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      {
        path: 'publicacoes/:id/detalhe',
        component: PublicacaoDetalheComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:LER'] },
      },
      {
        path: 'publicacoes/novo',
        component: PublicacaoFormComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:CRIAR'] },
      },
      {
        path: 'publicacoes',
        component: PublicacoesComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PUBLICACAO:LER'] },
      },
      {
        path: 'busca',
        component: BuscaGlobalComponent,
        canActivate: [permissaoGuard],
        data: { permissoes: ['PAGINA:LER'] },
      },
      { path: 'configuracoes', component: ConfiguracoesComponent },
    ],
  },
];

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

export const DOCFLOW_ROUTES: Routes = [
  {
    path: '',
    component: DocflowShellComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'clientes/novo', component: ClienteFormComponent },
      { path: 'clientes/:id/editar', component: ClienteFormComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'projetos/novo', component: ProjetoFormComponent },
      { path: 'projetos/:id/editar', component: ProjetoFormComponent },
      { path: 'projetos', component: ProjetosComponent },
      { path: 'modulos/novo', component: ModuloFormComponent },
      { path: 'modulos/:id/editar', component: ModuloFormComponent },
      { path: 'modulos', component: ModulosComponent },
      { path: 'paginas/novo', component: PaginaFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'paginas/:id/editar', component: PaginaFormComponent, canDeactivate: [canDeactivateGuard] },
      { path: 'paginas', component: PaginasComponent },
      { path: 'publicacoes/:id/detalhe', component: PublicacaoDetalheComponent },
      { path: 'publicacoes/novo', component: PublicacaoFormComponent },
      { path: 'publicacoes', component: PublicacoesComponent },
      { path: 'busca', component: BuscaGlobalComponent },
      { path: 'configuracoes', component: ConfiguracoesComponent },
    ],
  },
];

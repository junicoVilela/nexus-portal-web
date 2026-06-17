import { Routes } from '@angular/router';
import { permissaoGuard } from './guards/permissao.guard';

export const SEGURANCA_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/seguranca-home.component').then(m => m.SegurancaHomeComponent),
  },
  {
    path: 'acesso-negado',
    loadComponent: () =>
      import('./pages/acesso-negado/acesso-negado.component').then(m => m.AcessoNegadoComponent),
  },
  {
    path: 'usuarios',
    canActivate: [permissaoGuard],
    data: { permissoes: ['USUARIO:LER'] },
    loadComponent: () =>
      import('./pages/usuarios/usuarios-list/usuarios-list.component').then(m => m.UsuariosListComponent),
  },
  {
    path: 'usuarios/novo',
    canActivate: [permissaoGuard],
    data: { permissoes: ['USUARIO:CRIAR'] },
    loadComponent: () =>
      import('./pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
  },
  {
    path: 'usuarios/:id/editar',
    canActivate: [permissaoGuard],
    data: { permissoes: ['USUARIO:EDITAR'] },
    loadComponent: () =>
      import('./pages/usuarios/usuario-form/usuario-form.component').then(m => m.UsuarioFormComponent),
  },
  {
    path: 'grupos',
    canActivate: [permissaoGuard],
    data: { permissoes: ['GRUPO_ACESSO:LER'] },
    loadComponent: () =>
      import('./pages/grupos/grupos-list/grupos-list.component').then(m => m.GruposListComponent),
  },
  {
    path: 'grupos/novo',
    canActivate: [permissaoGuard],
    data: { permissoes: ['GRUPO_ACESSO:CRIAR'] },
    loadComponent: () =>
      import('./pages/grupos/grupo-form/grupo-form.component').then(m => m.GrupoFormComponent),
  },
  {
    path: 'grupos/:id/editar',
    canActivate: [permissaoGuard],
    data: { permissoes: ['GRUPO_ACESSO:EDITAR'] },
    loadComponent: () =>
      import('./pages/grupos/grupo-form/grupo-form.component').then(m => m.GrupoFormComponent),
  },
  {
    path: 'grupos/:id/permissoes',
    canActivate: [permissaoGuard],
    data: { permissoes: ['GRUPO_ACESSO:VINCULAR_PERMISSAO'] },
    loadComponent: () =>
      import('./pages/grupos/grupo-permissoes/grupo-permissoes.component').then(
        m => m.GrupoPermissoesComponent,
      ),
  },
  {
    path: 'dominios',
    canActivate: [permissaoGuard],
    data: { permissoes: ['DOMINIO:LER'] },
    loadComponent: () => import('./pages/matriz/matriz.component').then(m => m.MatrizComponent),
  },
  {
    path: 'escopo-acesso',
    canActivate: [permissaoGuard],
    data: { permissoes: ['ESCOPO:LER'] },
    loadComponent: () => import('./pages/escopos/escopos.component').then(m => m.EscoposComponent),
  },
  {
    path: 'historico-login',
    canActivate: [permissaoGuard],
    data: { permissoes: ['HISTORICO_LOGIN:VISUALIZAR'] },
    loadComponent: () =>
      import('./pages/historico-login/historico-login.component').then(m => m.HistoricoLoginComponent),
  },
  {
    path: 'auditoria',
    canActivate: [permissaoGuard],
    data: { permissoes: ['AUDITORIA:VISUALIZAR'] },
    loadComponent: () => import('./pages/auditoria/auditoria.component').then(m => m.AuditoriaComponent),
  },
  {
    path: 'politica-senha',
    canActivate: [permissaoGuard],
    data: { permissoes: ['POLITICA_SENHA:EDITAR'] },
    loadComponent: () =>
      import('./pages/politica-senha/politica-senha.component').then(m => m.PoliticaSenhaComponent),
  },
  {
    path: 'sessoes',
    canActivate: [permissaoGuard],
    data: { permissoes: ['SESSAO:LER'] },
    loadComponent: () => import('./pages/sessoes/sessoes.component').then(m => m.SessoesComponent),
  },
  {
    path: 'acessos-temporarios',
    canActivate: [permissaoGuard],
    data: { permissoes: ['ACESSO_TEMPORARIO:LER'] },
    loadComponent: () =>
      import('./pages/acessos-temporarios/acessos-temporarios.component').then(
        m => m.AcessosTemporariosComponent,
      ),
  },
];

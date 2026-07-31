import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { GrupoAcesso } from '@modules/seguranca/models/grupo-acesso.model';
import { Usuario } from '@modules/seguranca/models/usuario.model';
import { GrupoService } from '@modules/seguranca/services/grupo.service';
import { PoliticaSenhaService } from '@modules/seguranca/services/politica-senha.service';
import { UsuarioService } from '@modules/seguranca/services/usuario.service';
import { ButtonComponent, CardComponent, PageHeaderComponent, ToastService } from '@shared/ui';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PageHeaderComponent, ButtonComponent, CardComponent],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-form-page' },
})
export class UsuarioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usuarioService = inject(UsuarioService);
  private readonly grupoService = inject(GrupoService);
  private readonly politica = inject(PoliticaSenhaService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly editId = signal<string | undefined>(undefined);
  protected readonly grupos = signal<GrupoAcesso[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly usuarioAtual = signal<Usuario | undefined>(undefined);
  protected readonly historicoSenhas = signal<{ atual: number; limite: number } | null>(null);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    login: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    senha: [''],
    ativo: [true],
    grupoIds: this.fb.nonNullable.control<string[]>([]),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.editId.set(id);
    this.loading.set(true);
    if (id) {
      forkJoin({
        usuario: this.usuarioService.buscarPorId(id),
        grupos: this.grupoService.listarTodos(),
      })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: ({ usuario, grupos }) => {
            this.usuarioAtual.set(usuario);
            this.grupos.set(grupos);
            this.historicoSenhas.set(this.politica.contagemHistorico(usuario.id));
            this.form.patchValue({
              nome: usuario.nome,
              login: usuario.login,
              email: usuario.email,
              ativo: usuario.ativo,
              grupoIds: [...(usuario.grupoIds ?? [])],
            });
          },
          error: e => this.toast.error(e?.message ?? 'Erro ao carregar usuário.'),
        });
    } else {
      this.grupoService
        .listarTodos()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: gs => this.grupos.set(gs),
          error: e => this.toast.error(e?.message ?? 'Erro ao carregar grupos.'),
        });
    }
  }

  toggleGrupo(id: string): void {
    const atuais = this.form.controls.grupoIds.value;
    const ja = atuais.includes(id);
    this.form.controls.grupoIds.setValue(ja ? atuais.filter(x => x !== id) : [...atuais, id]);
  }

  salvar(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const id = this.editId();
    if (!id && !raw.senha.trim()) {
      this.toast.error('Informe uma senha inicial.');
      return;
    }
    this.saving.set(true);
    const payload = {
      nome: raw.nome.trim(),
      login: raw.login.trim(),
      email: raw.email.trim(),
      ativo: raw.ativo,
      grupoIds: raw.grupoIds,
      senha: raw.senha || undefined,
    };
    const obs = id
      ? this.usuarioService.atualizar(id, payload).pipe(
          switchMap(() => this.usuarioService.vincularGrupos(id, payload.grupoIds)),
        )
      : this.usuarioService.criar(payload).pipe(
          switchMap(u => this.usuarioService.vincularGrupos(u.id, payload.grupoIds)),
        );
    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.success(id ? 'Usuário atualizado.' : 'Usuário cadastrado.');
        this.voltar();
      },
      error: e => this.toast.error(e?.message ?? 'Erro ao salvar usuário.'),
    });
  }

  voltar(): void {
    this.router.navigate(['/seguranca/usuarios']);
  }

  selecionado(id: string): boolean {
    return this.form.controls.grupoIds.value.includes(id);
  }
}

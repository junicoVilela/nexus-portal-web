import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { resolvePage } from '@shared/utils/pagination';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginationComponent {
  readonly totalItems = input(0);
  readonly page = input(1);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([10, 20, 50]);

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly currentPage = computed(() => resolvePage(this.page(), this.totalItems(), this.pageSize()));
  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(Math.max(0, this.totalItems()) / Math.max(1, this.pageSize()))),
  );
  readonly startItem = computed(() =>
    this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize() + 1,
  );
  readonly endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: 5 }, (_, index) => start + index);
  });

  goTo(page: number): void {
    const nextPage = resolvePage(page, this.totalItems(), this.pageSize());
    if (nextPage !== this.currentPage()) {
      this.pageChange.emit(nextPage);
    }
  }

  onPageSizeChange(event: Event): void {
    const nextSize = Number((event.target as HTMLSelectElement).value);
    if (!Number.isFinite(nextSize) || nextSize <= 0 || nextSize === this.pageSize()) return;
    this.pageSizeChange.emit(nextSize);
    this.pageChange.emit(1);
  }
}

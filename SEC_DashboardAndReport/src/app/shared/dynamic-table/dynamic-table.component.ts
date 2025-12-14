import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { Subject } from 'rxjs';

export interface DynamicTableColumn<T = any> {
  key: string;                 // data key (supports dot path via accessor)
  header: string;              // header label
  sortable?: boolean;          // enable sorting for this column
  width?: string;              // optional width
  cellClass?: string;          // optional cell CSS class
  headerClass?: string;        // optional header CSS class
  accessor?: (row: T) => any;  // custom accessor for computed values
  formatter?: (value: any, row: T) => any; // formatter for display
}

export interface DynamicTableAction<T = any> {
  id: string;                            // unique action id
  icon?: string;                         // material icon name
  label: string;                         // visible label
  color?: 'primary' | 'accent' | 'warn' | undefined;
  show?: (row: T) => boolean;            // conditionally show
  disabled?: (row: T) => boolean;        // conditionally disable
}

@Component({
  selector: 'app-dynamic-table',
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss']
})
export class DynamicTableComponent<T = any> implements OnChanges, OnDestroy {
  @Input() data: T[] = [];
  @Input() columns: DynamicTableColumn<T>[] = [];
  @Input() actions: DynamicTableAction<T>[] = [];
  @Input() enableSorting: boolean = true;
  @Input() enablePagination: boolean = true;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Input() pageSize: number = 10;
  @Input() totalCount?: number; // if provided, treated as server-side pagination
  @Input() pageIndex: number = 0; // zero-based for paginator
  @Input() tableTitle?: string;
  @Input() showDownload: boolean = false;
  @Input() fileName: string = 'data.csv';

  @Output() action = new EventEmitter<{ actionId: string; row: T }>();
  @Output() page = new EventEmitter<{ pageIndex: number; pageSize: number }>();
  @Output() sort = new EventEmitter<{ active: string; direction: 'asc' | 'desc' | '' }>();
  @Output() download = new EventEmitter<void>();

  dataSource = new MatTableDataSource<T>();
  displayedColumnKeys: string[] = [];

  private destroy$ = new Subject<void>();

  // MatSort/MatPaginator as setters to handle timing
  @ViewChild(MatSort) set sortRef(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }
  @ViewChild(MatPaginator) set paginatorRef(p: MatPaginator) {
    if (p) {
      this.dataSource.paginator = p;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns']) {
      this.displayedColumnKeys = [
        ...this.columns.map(c => c.key),
        ...(this.actions?.length ? ['__actions'] : [])
      ];
    }

    if (changes['data']) {
      this.dataSource.data = this.data || [];
    }
  }

  getCellValue(row: T, col: DynamicTableColumn<T>): any {
    if (col.accessor) {
      return col.accessor(row);
    }
    const value = (row as any)?.[col.key];
    return col.formatter ? col.formatter(value, row) : value;
  }

  onActionClick(actionId: string, row: T): void {
    this.action.emit({ actionId, row });
  }

  onPageChange(event: any): void {
    // Emit for server-side; MatTableDataSource handles client-side automatically
    this.page.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  onSortChange(event: { active: string; direction: 'asc' | 'desc' | '' }): void {
    this.sort.emit(event);
  }

  triggerDownload(): void {
    if (this.download.observers.length) {
      this.download.emit();
      return;
    }
    // Fallback CSV export
    const csv = this.generateCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  private generateCsv(): string {
    const headers = this.columns.map(c => c.header);
    const rows = (this.data || []).map(row => this.columns.map(c => {
      const v = this.getCellValue(row, c);
      const s = v == null ? '' : String(v);
      // escape quotes
      return '"' + s.replace(/"/g, '""') + '"';
    }).join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}



import { Component, Prop, State, h, Watch } from '@stencil/core';

@Component({
  tag: 'json-data-viewer',
  styleUrl: 'json-data-viewer.css',
  shadow: true,
})
export class JsonDataViewer {
  @Prop() data: any[] = [];
  @Prop() loading: boolean = false;
  @Prop() rowsPerPage: number = 10;
  @Prop() pageSizeOptions: number[] = [5, 10, 25];
  @Prop() hiddenColumns: string[] = [];

  @State() private searchQuery: string = '';
  @State() private currentPage: number = 1;
  @State() private selectedPageSize: number = 10;
  @State() private showNestedDialog: boolean = false;
  @State() private nestedData: any = null;
  @State() private nestedDataTitle: string = '';
  @State() private columnVisibility: { [key: string]: boolean } = {};
  @State() private sortConfig: { field: string; direction: 'asc' | 'desc' } | null = null;
  @State() private showColumnDropdown: boolean = false;

  componentWillLoad() {
    this.selectedPageSize = this.rowsPerPage;
    this.initializeColumnVisibility();
  }

  private initializeColumnVisibility() {
    this.columnVisibility = {}; // reset before repopulating
    if (this.data?.length) {
      Object.keys(this.data[0]).forEach(key => {
        this.columnVisibility[key] = true; // show all columns
      });
    }
  }

  private get visibleColumns() {
    return this.columns.filter(col => this.columnVisibility[col.field]);
  }

  private get columns(): { field: string; header: string }[] {
    if (!this.data?.length) return [];

    const fields = new Set<string>();
    this.data.forEach(item => {
      Object.keys(item).forEach(key => fields.add(key));
    });

    return Array.from(fields).map(field => ({
      field,
      header: this.formatHeader(field),
    }));
  }

  private get paginatedData() {
    const start = (this.currentPage - 1) * this.selectedPageSize;
    const end = start + this.selectedPageSize;
    return this.sortedData.slice(start, end);
  }

  private get sortedData() {
    if (!this.sortConfig) return this.filteredData;

    return [...this.filteredData].sort((a, b) => {
      const valA = a[this.sortConfig.field];
      const valB = b[this.sortConfig.field];

      if (valA < valB) return this.sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private get filteredData() {
    if (!this.searchQuery) return this.data;

    const query = this.searchQuery.toLowerCase();
    return this.data.filter(item => Object.entries(item).some(([key, val]) => this.columnVisibility[key] && val && String(val).toLowerCase().includes(query)));
  }

  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  private toggleColumnVisibility(column: string) {
    this.columnVisibility = {
      ...this.columnVisibility,
      [column]: !this.columnVisibility[column],
    };
  }

  private handleSort(field: string) {
    if (!this.sortConfig || this.sortConfig.field !== field) {
      this.sortConfig = { field, direction: 'asc' };
    } else {
      this.sortConfig = {
        field,
        direction: this.sortConfig.direction === 'asc' ? 'desc' : 'asc',
      };
    }
  }

  private showNestedData(data: any, title: string) {
    this.nestedData = data;
    this.nestedDataTitle = title;
    this.showNestedDialog = true;
  }

  @Watch('data')
  onDataChange(newValue: any[]) {
    if (newValue && newValue.length) {
      this.initializeColumnVisibility();
    }
  }

  render() {
    const totalPages = Math.ceil(this.filteredData.length / this.selectedPageSize);

    return (
      <div class="json-data-viewer">
        {/* Header and Controls */}
        <div class="header">
          <div class="controls">
            <div class="search-control">
              <span class="search-icon">🔍</span>
              <input
                type="text"
                value={this.searchQuery}
                onInput={(e: Event) => (this.searchQuery = (e.target as HTMLInputElement).value)}
                placeholder="Search..."
                class="search-input"
              />
            </div>

            <div class="column-dropdown">
              <button class="dropdown-button" onClick={() => (this.showColumnDropdown = !this.showColumnDropdown)}>
                Hide Fields ▼
              </button>
              {this.showColumnDropdown && (
                <div class="dropdown-content">
                  {this.columns.map(col => (
                    <label class="dropdown-item">
                      <input type="checkbox" checked={this.columnVisibility[col.field]} onChange={() => this.toggleColumnVisibility(col.field)} />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div class="page-controls">
              <select
                onInput={(e: Event) => {
                  this.selectedPageSize = Number((e.target as HTMLSelectElement).value);
                  this.currentPage = 1;
                }}
                class="page-size-select"
              >
                {this.pageSizeOptions.map(size => (
                  <option value={size} selected={size === this.selectedPageSize}>
                    {size} per page
                  </option>
                ))}
              </select>

              <button onClick={() => (this.currentPage = Math.max(1, this.currentPage - 1))} disabled={this.currentPage === 1} class="pagination-button">
                ◀
              </button>

              <span class="page-info">
                Page {this.currentPage} of {totalPages}
              </span>

              <button onClick={() => (this.currentPage = Math.min(totalPages, this.currentPage + 1))} disabled={this.currentPage >= totalPages} class="pagination-button">
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                {this.visibleColumns.map(col => (
                  <th
                    key={col.field}
                    onClick={() => this.handleSort(col.field)}
                    class={`
                      ${this.sortConfig?.field === col.field ? 'sorted' : ''}
                      ${this.sortConfig?.field === col.field && this.sortConfig.direction === 'desc' ? 'desc' : ''}
                    `}
                  >
                    {col.header}
                    {this.sortConfig?.field === col.field && <span class="sort-icon">{this.sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {this.paginatedData.map((item, index) => (
                <tr key={index}>
                  {this.visibleColumns.map(col => {
                    const fieldValue = item[col.field];
                    return (
                      <td key={`${index}-${col.field}`}>
                        {fieldValue === null || fieldValue === undefined ? (
                          <span class="empty-cell">—</span>
                        ) : typeof fieldValue === 'object' ? (
                          <button onClick={() => this.showNestedData(fieldValue, col.header)} class="expand-button">
                            <span class="expand-icon">🔍</span>
                            View
                          </button>
                        ) : (
                          <span class="cell-value">{String(fieldValue)}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Nested Data Dialog */}
        {this.showNestedDialog && (
          <div class="dialog-overlay">
            <div class="dialog">
              <div class="dialog-header">
                <h3>{this.nestedDataTitle}</h3>
                <button onClick={() => (this.showNestedDialog = false)} class="close-button">
                  ✕
                </button>
              </div>
              <div class="dialog-content">
                <json-viewer data={this.nestedData} />
              </div>
            </div>
          </div>
        )}

        {this.loading && <div class="loading-overlay">Loading...</div>}
      </div>
    );
  }
}

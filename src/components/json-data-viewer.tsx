import { Component, Prop, State, h } from '@stencil/core';
import { JSX } from '@stencil/core/internal'; // ✅ Fix for JSX namespace error

@Component({
  tag: 'json-data-viewer',
  styleUrl: 'json-data-viewer.css',
  shadow: true,
})
export class JsonDataViewer {
  @Prop() data: any[] = [];
  @Prop() rowsPerPage: number = 5;

  @State() currentPage: number = 1;
  @State() showModal: boolean = false;
  @State() modalData: any = null;
  @State() modalTitle: string = '';

  @State() expandedPaths: Set<string> = new Set();

  private get paginatedData() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.data.slice(start, start + this.rowsPerPage);
  }

  private handlePageChange(direction: 'next' | 'prev') {
    if (direction === 'next' && this.currentPage * this.rowsPerPage < this.data.length) {
      this.currentPage++;
    } else if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    }
  }

  private tryParseJson(value: any) {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private showNestedData(data: any, title: string) {
    this.modalData = this.tryParseJson(data);
    this.modalTitle = title;
    this.expandedPaths = new Set(); // reset expanded state
    this.showModal = true;
  }

  private toggleExpand(path: string) {
    if (this.expandedPaths.has(path)) {
      this.expandedPaths.delete(path);
    } else {
      this.expandedPaths.add(path);
    }
    this.expandedPaths = new Set(this.expandedPaths); // trigger re-render
  }

  private renderJson(value: any, path: string = ''): JSX.Element {
    if (value === null) return <span class="json-null">null</span>;

    if (typeof value === 'string') return <span class="json-string">"{value}"</span>;

    if (typeof value === 'number' || typeof value === 'boolean') return <span class="json-primitive">{String(value)}</span>;

    if (Array.isArray(value)) {
      const isExpanded = this.expandedPaths.has(path);
      return (
        <div class="json-array">
          <span class="collapsible-toggle" onClick={() => this.toggleExpand(path)}>
            {isExpanded ? '▼' : '▶'} Array[{value.length}]
          </span>
          {isExpanded && (
            <div class="json-indent">
              {value.map((item, i) => (
                <div key={i}>
                  {this.renderJson(item, path + '.' + i)}
                  {i < value.length - 1 ? ',' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      const isExpanded = this.expandedPaths.has(path);
      return (
        <div class="json-object">
          <span class="collapsible-toggle" onClick={() => this.toggleExpand(path)}>
            {isExpanded ? '▼' : '▶'} Object{'{...}'}
          </span>
          {isExpanded && (
            <div class="json-indent">
              {keys.map((key, i) => (
                <div key={key}>
                  <span class="json-key">"{key}"</span>: {this.renderJson(value[key], path + '.' + key)}
                  {i < keys.length - 1 ? ',' : ''}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span>{String(value)}</span>;
  }

  render() {
    return (
      <div class="viewer-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Value</th>
              <th>Time</th>
              <th>Value Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.paginatedData.map((row, index) => (
              <tr key={index}>
                <td>{row.name}</td>
                <td>{row.type}</td>
                <td class="value-cell">
                  {typeof row.value === 'object' || row.type === 'Json' ? (
                    <button class="view-btn" onClick={() => this.showNestedData(row.value, row.name)}>
                      🔍 View
                    </button>
                  ) : (
                    row.value
                  )}
                </td>
                <td>{row.time}</td>
                <td>{JSON.stringify(row.valueInfo || {})}</td>
                <td>
                  <button class="view-btn" onClick={() => this.showNestedData(row.value, row.name)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div class="pagination">
          <button onClick={() => this.handlePageChange('prev')} disabled={this.currentPage === 1}>
            Prev
          </button>
          <span>
            Page {this.currentPage} of {Math.ceil(this.data.length / this.rowsPerPage)}
          </span>
          <button onClick={() => this.handlePageChange('next')} disabled={this.currentPage * this.rowsPerPage >= this.data.length}>
            Next
          </button>
        </div>

        {this.showModal && (
          <div class="modal-backdrop" onClick={() => (this.showModal = false)}>
            <div class="modal-content" onClick={e => e.stopPropagation()}>
              <div class="modal-header">
                <h3>{this.modalTitle}</h3>
                <button class="close-button" onClick={() => (this.showModal = false)}>
                  ✖
                </button>
              </div>
              <div class="modal-body">
                <pre class="json-pretty">{this.renderJson(this.modalData)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

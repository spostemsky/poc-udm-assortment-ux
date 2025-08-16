/**
 * Data Table Component
 * Tabla de datos con funcionalidades de edición y eliminación
 */
class DataTable {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      entityType: 'data',
      columns: [],
      actions: ['edit', 'delete'],
      onEdit: null,
      onDelete: null,
      emptyMessage: 'No hay datos disponibles',
      ...options
    };
    
    this.table = null;
    this.thead = null;
    this.tbody = null;
    this.emptyState = null;
    this.data = [];
    
    this.init();
  }
  
  init() {
    this.table = this.element.querySelector('.data-table');
    this.thead = this.element.querySelector('.data-table-header');
    this.tbody = this.element.querySelector('.data-table-body');
    this.emptyState = this.element.querySelector('.empty-state');
    
    this.renderHeaders();
  }
  
  renderHeaders() {
    if (!this.thead || this.options.columns.length === 0) return;
    
    const headerCells = this.options.columns.map(column => {
      return `<th>${column.title || column.key}</th>`;
    }).join('');
    
    // Add actions column if actions are enabled
    const actionsHeader = this.options.actions.length > 0 ? '<th>Acciones</th>' : '';
    
    this.thead.innerHTML = headerCells + actionsHeader;
  }
  
  setData(data) {
    this.data = data || [];
    this.render();
  }
  
  render() {
    if (!this.tbody) return;
    
    if (this.data.length === 0) {
      this.showEmptyState();
      return;
    }
    
    this.hideEmptyState();
    
    const rows = this.data.map((record, index) => {
      return this.renderRow(record, index);
    }).join('');
    
    this.tbody.innerHTML = rows;
  }
  
  renderRow(record, index) {
    const cells = this.options.columns.map(column => {
      const value = this.getCellValue(record, column);
      const displayValue = this.formatCellValue(value, column);
      return `<td class="${column.expandable ? 'expandable' : ''}">${displayValue}</td>`;
    }).join('');
    
    const actionsCell = this.renderActionsCell(record, index);
    
    return `<tr>${cells}${actionsCell}</tr>`;
  }
  
  getCellValue(record, column) {
    if (typeof column.key === 'function') {
      return column.key(record);
    }
    
    // Support nested keys like 'details.length'
    const keys = column.key.split('.');
    let value = record;
    
    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }
    
    return value;
  }
  
  formatCellValue(value, column) {
    if (value === null || value === undefined) {
      return column.defaultValue || 'N/A';
    }
    
    if (column.formatter && typeof column.formatter === 'function') {
      return column.formatter(value);
    }
    
    if (column.type === 'array' && Array.isArray(value)) {
      return value.length;
    }
    
    if (column.type === 'truncate' && typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    
    return value;
  }
  
  renderActionsCell(record, index) {
    if (this.options.actions.length === 0) return '';
    
    const actions = this.options.actions.map(action => {
      switch (action) {
        case 'edit':
          return `<button class="btn btn-primary btn-sm" onclick="this.closest('.data-table-container')._dataTable.handleEdit(${index})">
            ✏️ Editar
          </button>`;
        case 'delete':
          return `<button class="btn btn-danger btn-sm" onclick="this.closest('.data-table-container')._dataTable.handleDelete(${index})">
            🗑️ Eliminar
          </button>`;
        default:
          if (typeof action === 'object') {
            return `<button class="btn ${action.class || 'btn-primary'} btn-sm" onclick="this.closest('.data-table-container')._dataTable.handleCustomAction('${action.key}', ${index})">
              ${action.icon || ''} ${action.label}
            </button>`;
          }
          return '';
      }
    }).join('');
    
    return `<td><div class="record-actions">${actions}</div></td>`;
  }
  
  handleEdit(index) {
    const record = this.data[index];
    if (this.options.onEdit && typeof this.options.onEdit === 'function') {
      this.options.onEdit(record, index);
    }
    
    // Trigger edit event
    const editEvent = new CustomEvent('table-edit', {
      detail: { record, index, table: this }
    });
    this.element.dispatchEvent(editEvent);
  }
  
  handleDelete(index) {
    const record = this.data[index];
    if (this.options.onDelete && typeof this.options.onDelete === 'function') {
      this.options.onDelete(record, index);
    }
    
    // Trigger delete event
    const deleteEvent = new CustomEvent('table-delete', {
      detail: { record, index, table: this }
    });
    this.element.dispatchEvent(deleteEvent);
  }
  
  handleCustomAction(actionKey, index) {
    const record = this.data[index];
    const action = this.options.actions.find(a => typeof a === 'object' && a.key === actionKey);
    
    if (action && action.handler && typeof action.handler === 'function') {
      action.handler(record, index);
    }
    
    // Trigger custom action event
    const actionEvent = new CustomEvent('table-action', {
      detail: { action: actionKey, record, index, table: this }
    });
    this.element.dispatchEvent(actionEvent);
  }
  
  showEmptyState() {
    if (this.table) this.table.style.display = 'none';
    if (this.emptyState) {
      this.emptyState.style.display = 'block';
      const message = this.emptyState.querySelector('p');
      if (message) {
        message.textContent = this.options.emptyMessage;
      }
    }
  }
  
  hideEmptyState() {
    if (this.table) this.table.style.display = 'table';
    if (this.emptyState) this.emptyState.style.display = 'none';
  }
  
  refresh() {
    this.render();
  }
  
  addRecord(record) {
    this.data.push(record);
    this.render();
  }
  
  updateRecord(index, record) {
    if (index >= 0 && index < this.data.length) {
      this.data[index] = record;
      this.render();
    }
  }
  
  removeRecord(index) {
    if (index >= 0 && index < this.data.length) {
      this.data.splice(index, 1);
      this.render();
    }
  }
  
  // Static method to initialize all data tables on page
  static initializeAll(selector = '.data-table-container', options = {}) {
    const tables = [];
    document.querySelectorAll(selector).forEach(element => {
      const dataTable = new DataTable(element, options);
      element._dataTable = dataTable; // Store reference for onclick handlers
      tables.push(dataTable);
    });
    return tables;
  }
}

// Predefined column configurations
DataTable.COLUMNS = {
  facturas: [
    { key: 'external_id', title: 'EXTERNAL ID' },
    { key: 'sap_order_id', title: 'Nro Orden' },
    { key: 'vendor_name', title: 'Proveedor' },
    { key: 'site_id', title: 'Sitio' },
    { key: 'details.length', title: 'Items', type: 'array' }
  ],
  ordenes: [
    { key: 'id', title: 'ID' },
    { key: 'sapOrderId', title: 'SAP Order ID' },
    { key: 'siteId', title: 'Sitio' },
    { key: 'details.length', title: 'Items', type: 'array' }
  ]
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataTable;
}

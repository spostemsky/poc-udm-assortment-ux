/**
 * Invoice Selector Component
 * Selector de facturas con funcionalidad de carga y cambio
 */
class InvoiceSelector {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      dataManagerUrl: 'data-manager/data-manager.html',
      onInvoiceChange: null,
      ...options
    };
    
    this.selectElement = null;
    this.dataManagerBtn = null;
    this.invoices = [];
    
    this.init();
  }
  
  init() {
    this.selectElement = this.element.querySelector('#invoice-select');
    this.dataManagerBtn = this.element.querySelector('.data-manager-btn');
    
    this.setupEventListeners();
    this.updateDataManagerUrl();
  }
  
  setupEventListeners() {
    // Invoice change event
    if (this.selectElement) {
      this.selectElement.addEventListener('change', () => {
        this.handleInvoiceChange();
      });
    }
    
    // Data manager button
    if (this.dataManagerBtn) {
      this.dataManagerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDataManager();
      });
    }
  }
  
  handleInvoiceChange() {
    const selectedValue = this.selectElement.value;
    const selectedInvoice = this.invoices.find(inv => inv.external_id === selectedValue);
    
    // Trigger change event
    const changeEvent = new CustomEvent('invoice-change', {
      detail: { 
        value: selectedValue,
        invoice: selectedInvoice,
        selector: this
      }
    });
    this.element.dispatchEvent(changeEvent);
    
    // Call callback if provided
    if (this.options.onInvoiceChange && typeof this.options.onInvoiceChange === 'function') {
      this.options.onInvoiceChange(selectedValue, selectedInvoice);
    }
  }
  
  openDataManager() {
    window.open(this.options.dataManagerUrl, '_blank');
  }
  
  updateDataManagerUrl() {
    if (this.dataManagerBtn) {
      this.dataManagerBtn.href = this.options.dataManagerUrl;
    }
  }
  
  loadInvoices(invoices) {
    this.invoices = invoices;
    this.populateSelect();
  }
  
  populateSelect() {
    if (!this.selectElement) return;
    
    // Clear existing options
    this.selectElement.innerHTML = '';
    
    if (this.invoices.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No hay facturas disponibles';
      option.disabled = true;
      this.selectElement.appendChild(option);
      return;
    }
    
    // Sort invoices by external_id
    const sortedInvoices = [...this.invoices].sort((a, b) => 
      a.external_id.localeCompare(b.external_id)
    );
    
    // Add options
    sortedInvoices.forEach((invoice, index) => {
      const option = document.createElement('option');
      option.value = invoice.external_id;
      option.textContent = `${invoice.external_id} - ${invoice.vendor_name}`;
      
      // Select first option by default
      if (index === 0) {
        option.selected = true;
      }
      
      this.selectElement.appendChild(option);
    });
    
    // Trigger change event for first selection
    if (sortedInvoices.length > 0) {
      setTimeout(() => {
        this.handleInvoiceChange();
      }, 100);
    }
  }
  
  getSelectedInvoice() {
    const selectedValue = this.selectElement?.value;
    return this.invoices.find(inv => inv.external_id === selectedValue);
  }
  
  getSelectedValue() {
    return this.selectElement?.value || '';
  }
  
  setSelectedValue(value) {
    if (this.selectElement) {
      this.selectElement.value = value;
      this.handleInvoiceChange();
    }
  }
  
  showLoading() {
    if (this.selectElement) {
      this.selectElement.innerHTML = '<option value="">Cargando facturas...</option>';
      this.selectElement.disabled = true;
    }
  }
  
  hideLoading() {
    if (this.selectElement) {
      this.selectElement.disabled = false;
    }
  }
  
  // Static method to initialize all invoice selectors on page
  static initializeAll(selector = '.invoice-selector', options = {}) {
    const selectors = [];
    document.querySelectorAll(selector).forEach(element => {
      const invoiceSelector = new InvoiceSelector(element, options);
      selectors.push(invoiceSelector);
    });
    return selectors;
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InvoiceSelector;
}

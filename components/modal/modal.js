/**
 * Modal Component
 * Modal reutilizable con funcionalidades de confirmación y edición
 */
class Modal {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      title: 'Modal',
      size: 'medium', // small, medium, large
      backdrop: true, // Click outside to close
      keyboard: true, // ESC to close
      onShow: null,
      onHide: null,
      onConfirm: null,
      onCancel: null,
      ...options
    };
    
    this.titleElement = null;
    this.bodyElement = null;
    this.footerElement = null;
    this.closeBtn = null;
    this.cancelBtn = null;
    this.confirmBtn = null;
    
    this.isVisible = false;
    
    this.init();
  }
  
  init() {
    this.titleElement = this.element.querySelector('.modal-title');
    this.bodyElement = this.element.querySelector('.modal-body');
    this.footerElement = this.element.querySelector('.modal-footer');
    this.closeBtn = this.element.querySelector('.close-btn');
    this.cancelBtn = this.element.querySelector('.modal-cancel');
    this.confirmBtn = this.element.querySelector('.modal-confirm');
    
    this.setupEventListeners();
    this.applySize();
  }
  
  setupEventListeners() {
    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }
    
    // Cancel button
    if (this.cancelBtn) {
      this.cancelBtn.addEventListener('click', () => {
        this.cancel();
      });
    }
    
    // Confirm button
    if (this.confirmBtn) {
      this.confirmBtn.addEventListener('click', () => {
        this.confirm();
      });
    }
    
    // Backdrop click
    if (this.options.backdrop) {
      this.element.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    }
    
    // Keyboard events
    if (this.options.keyboard) {
      document.addEventListener('keydown', (e) => {
        if (this.isVisible && e.key === 'Escape') {
          this.hide();
        }
      });
    }
  }
  
  applySize() {
    const content = this.element.querySelector('.modal-content');
    if (!content) return;
    
    content.classList.remove('modal-sm', 'modal-lg', 'modal-xl');
    
    switch (this.options.size) {
      case 'small':
        content.classList.add('modal-sm');
        break;
      case 'large':
        content.classList.add('modal-lg');
        break;
      case 'extra-large':
        content.classList.add('modal-xl');
        break;
      // medium is default, no class needed
    }
  }
  
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.element.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const firstFocusable = this.element.querySelector('input, textarea, button, select, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }
    
    // Callback
    if (this.options.onShow && typeof this.options.onShow === 'function') {
      this.options.onShow(this);
    }
    
    // Trigger event
    const showEvent = new CustomEvent('modal-show', {
      detail: { modal: this }
    });
    this.element.dispatchEvent(showEvent);
  }
  
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.element.classList.remove('show');
    document.body.style.overflow = '';
    
    // Callback
    if (this.options.onHide && typeof this.options.onHide === 'function') {
      this.options.onHide(this);
    }
    
    // Trigger event
    const hideEvent = new CustomEvent('modal-hide', {
      detail: { modal: this }
    });
    this.element.dispatchEvent(hideEvent);
  }
  
  confirm() {
    // Callback
    if (this.options.onConfirm && typeof this.options.onConfirm === 'function') {
      const result = this.options.onConfirm(this);
      // If callback returns false, don't close modal
      if (result === false) return;
    }
    
    // Trigger event
    const confirmEvent = new CustomEvent('modal-confirm', {
      detail: { modal: this }
    });
    this.element.dispatchEvent(confirmEvent);
    
    this.hide();
  }
  
  cancel() {
    // Callback
    if (this.options.onCancel && typeof this.options.onCancel === 'function') {
      this.options.onCancel(this);
    }
    
    // Trigger event
    const cancelEvent = new CustomEvent('modal-cancel', {
      detail: { modal: this }
    });
    this.element.dispatchEvent(cancelEvent);
    
    this.hide();
  }
  
  setTitle(title) {
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }
  }
  
  setBody(content) {
    if (this.bodyElement) {
      if (typeof content === 'string') {
        this.bodyElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.bodyElement.innerHTML = '';
        this.bodyElement.appendChild(content);
      }
    }
  }
  
  setFooter(content) {
    if (this.footerElement) {
      if (typeof content === 'string') {
        this.footerElement.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.footerElement.innerHTML = '';
        this.footerElement.appendChild(content);
      }
    }
  }
  
  setConfirmText(text) {
    if (this.confirmBtn) {
      this.confirmBtn.textContent = text;
    }
  }
  
  setCancelText(text) {
    if (this.cancelBtn) {
      this.cancelBtn.textContent = text;
    }
  }
  
  showConfirmButton(show = true) {
    if (this.confirmBtn) {
      this.confirmBtn.style.display = show ? 'inline-flex' : 'none';
    }
  }
  
  showCancelButton(show = true) {
    if (this.cancelBtn) {
      this.cancelBtn.style.display = show ? 'inline-flex' : 'none';
    }
  }
  
  // Static methods for common modal types
  static confirm(title, message, options = {}) {
    const modal = Modal.create({
      title: title,
      size: 'small',
      ...options
    });
    
    modal.setBody(`<p>${message}</p>`);
    modal.setConfirmText('Confirmar');
    modal.setCancelText('Cancelar');
    
    return new Promise((resolve) => {
      modal.options.onConfirm = () => {
        resolve(true);
        modal.destroy();
      };
      modal.options.onCancel = () => {
        resolve(false);
        modal.destroy();
      };
      modal.show();
    });
  }
  
  static alert(title, message, options = {}) {
    const modal = Modal.create({
      title: title,
      size: 'small',
      ...options
    });
    
    modal.setBody(`<p>${message}</p>`);
    modal.showCancelButton(false);
    modal.setConfirmText('OK');
    
    return new Promise((resolve) => {
      modal.options.onConfirm = () => {
        resolve(true);
        modal.destroy();
      };
      modal.show();
    });
  }
  
  static create(options = {}) {
    const modalHtml = `
      <div class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">${options.title || 'Modal'}</h3>
            <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            ${options.body || ''}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">Cancelar</button>
            <button class="btn btn-primary modal-confirm">Confirmar</button>
          </div>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = modalHtml;
    const modalElement = container.firstElementChild;
    
    document.body.appendChild(modalElement);
    
    return new Modal(modalElement, options);
  }
  
  destroy() {
    this.hide();
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 300);
  }
  
  // Static method to initialize all modals on page
  static initializeAll(selector = '.modal', options = {}) {
    const modals = [];
    document.querySelectorAll(selector).forEach(element => {
      const modal = new Modal(element, options);
      modals.push(modal);
    });
    return modals;
  }
}

// Legacy functions for backward compatibility
function showModal(modalId) {
  const element = document.getElementById(modalId);
  if (element) {
    const modal = element._modal || new Modal(element);
    element._modal = modal;
    modal.show();
  }
}

function closeModal(modalId) {
  const element = modalId ? document.getElementById(modalId) : document.querySelector('.modal.show');
  if (element && element._modal) {
    element._modal.hide();
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Modal;
}

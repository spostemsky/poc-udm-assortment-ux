/**
 * Loading Overlay Component
 * Overlay de carga con spinner y mensaje personalizable
 */
class LoadingOverlay {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      message: 'Cargando...',
      variant: 'default', // default, dark, minimal
      size: 'default', // small, default, large
      hideContent: true, // Hide main content while loading
      contentSelector: '.main-layout',
      ...options
    };
    
    this.textElement = null;
    this.contentElement = null;
    this.isVisible = false;
    
    this.init();
  }
  
  init() {
    this.textElement = this.element.querySelector('.loading-text');
    this.contentElement = document.querySelector(this.options.contentSelector);
    
    this.applyVariant();
    this.applySize();
    this.updateMessage();
  }
  
  applyVariant() {
    this.element.classList.remove('dark', 'minimal');
    if (this.options.variant !== 'default') {
      this.element.classList.add(this.options.variant);
    }
  }
  
  applySize() {
    this.element.classList.remove('small', 'large');
    if (this.options.size !== 'default') {
      this.element.classList.add(this.options.size);
    }
  }
  
  updateMessage() {
    if (this.textElement) {
      this.textElement.textContent = this.options.message;
    }
  }
  
  show(message) {
    if (message) {
      this.options.message = message;
      this.updateMessage();
    }
    
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.element.classList.add('show');
    
    // Hide main content if option is enabled
    if (this.options.hideContent && this.contentElement) {
      this.contentElement.classList.add('content-hidden');
    }
    
    // Trigger event
    const showEvent = new CustomEvent('loading-show', {
      detail: { overlay: this, message: this.options.message }
    });
    this.element.dispatchEvent(showEvent);
  }
  
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    this.element.classList.remove('show');
    
    // Show main content
    if (this.options.hideContent && this.contentElement) {
      this.contentElement.classList.remove('content-hidden');
    }
    
    // Trigger event
    const hideEvent = new CustomEvent('loading-hide', {
      detail: { overlay: this }
    });
    this.element.dispatchEvent(hideEvent);
  }
  
  setMessage(message) {
    this.options.message = message;
    this.updateMessage();
  }
  
  setVariant(variant) {
    this.options.variant = variant;
    this.applyVariant();
  }
  
  setSize(size) {
    this.options.size = size;
    this.applySize();
  }
  
  toggle(message) {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show(message);
    }
  }
  
  // Static methods for easy usage
  static show(message = 'Cargando...', options = {}) {
    let overlay = document.querySelector('.loading-overlay');
    
    if (!overlay) {
      overlay = LoadingOverlay.create(options);
    }
    
    const instance = overlay._loadingOverlay || new LoadingOverlay(overlay, options);
    overlay._loadingOverlay = instance;
    
    instance.show(message);
    return instance;
  }
  
  static hide() {
    const overlay = document.querySelector('.loading-overlay.show');
    if (overlay && overlay._loadingOverlay) {
      overlay._loadingOverlay.hide();
    }
  }
  
  static create(options = {}) {
    const overlayHtml = `
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">${options.message || 'Cargando...'}</div>
        </div>
      </div>
    `;
    
    const container = document.createElement('div');
    container.innerHTML = overlayHtml;
    const overlayElement = container.firstElementChild;
    
    document.body.appendChild(overlayElement);
    
    return overlayElement;
  }
  
  // Promise wrapper for async operations
  static async wrap(promise, message = 'Cargando...', options = {}) {
    const overlay = LoadingOverlay.show(message, options);
    
    try {
      const result = await promise;
      LoadingOverlay.hide();
      return result;
    } catch (error) {
      LoadingOverlay.hide();
      throw error;
    }
  }
  
  // Static method to initialize all loading overlays on page
  static initializeAll(selector = '.loading-overlay', options = {}) {
    const overlays = [];
    document.querySelectorAll(selector).forEach(element => {
      const overlay = new LoadingOverlay(element, options);
      element._loadingOverlay = overlay;
      overlays.push(overlay);
    });
    return overlays;
  }
}

// Legacy functions for backward compatibility
function mostrarLoading(message = 'Cargando datos...') {
  LoadingOverlay.show(message);
}

function ocultarLoading() {
  LoadingOverlay.hide();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LoadingOverlay;
}

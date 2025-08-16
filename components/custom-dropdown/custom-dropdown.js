/**
 * Custom Dropdown Component
 * Dropdown personalizado con búsqueda y descripciones
 */
class CustomDropdown {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      placeholder: 'Seleccione una opción',
      searchable: false,
      ...options
    };
    
    this.selectedDiv = null;
    this.optionsDiv = null;
    this.arrow = null;
    this.placeholderSpan = null;
    
    this.init();
  }
  
  init() {
    // Evitar inicializar múltiples veces
    if (this.element.hasAttribute('data-initialized')) {
      return;
    }
    this.element.setAttribute('data-initialized', 'true');
    
    this.selectedDiv = this.element.querySelector('.custom-dropdown-selected');
    this.optionsDiv = this.element.querySelector('.custom-dropdown-options');
    this.arrow = this.element.querySelector('.custom-dropdown-arrow');
    this.placeholderSpan = this.selectedDiv.querySelector('.custom-dropdown-placeholder') || 
                          this.selectedDiv.querySelector('span:not(.custom-dropdown-arrow)');
    
    // Crear placeholder si no existe
    if (!this.placeholderSpan) {
      this.placeholderSpan = document.createElement('span');
      this.placeholderSpan.className = 'custom-dropdown-placeholder';
      this.selectedDiv.insertBefore(this.placeholderSpan, this.arrow);
    }
    
    this.setupEventListeners();
    this.updatePlaceholder();
  }
  
  setupEventListeners() {
    // Toggle dropdown
    this.selectedDiv.addEventListener('click', () => {
      this.toggle();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target)) {
        this.close();
      }
    });
  }
  
  toggle() {
    const isOpen = this.optionsDiv.classList.contains('open');
    
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  open() {
    // Close all other dropdowns first
    this.closeAllDropdowns();
    
    this.optionsDiv.classList.add('open');
    this.selectedDiv.classList.add('open');
    this.arrow.classList.add('open');
    this.element.classList.add('dropdown-open');
    
    // Add parent classes to allow overflow
    this.addParentClasses();
  }
  
  close() {
    this.optionsDiv.classList.remove('open');
    this.selectedDiv.classList.remove('open');
    this.arrow.classList.remove('open');
    this.element.classList.remove('dropdown-open');
    
    // Remove parent classes
    this.removeParentClasses();
  }
  
  closeAllDropdowns() {
    document.querySelectorAll('.custom-dropdown-options.open').forEach(dropdown => {
      const parentDropdown = dropdown.parentElement;
      if (parentDropdown !== this.element) {
        dropdown.classList.remove('open');
        parentDropdown.querySelector('.custom-dropdown-selected').classList.remove('open');
        parentDropdown.querySelector('.custom-dropdown-arrow').classList.remove('open');
        parentDropdown.classList.remove('dropdown-open');
        
        // Remove parent classes
        this.removeParentClassesFromElement(parentDropdown);
      }
    });
  }
  
  addParentClasses() {
    const section = this.element.closest('.section');
    const container = this.element.closest('.container');
    const collapsibleContent = this.element.closest('.collapsible-content');
    
    if (section) section.classList.add('dropdown-parent-open');
    if (container) container.classList.add('dropdown-parent-open');
    if (collapsibleContent) collapsibleContent.classList.add('dropdown-parent-open');
  }
  
  removeParentClasses() {
    this.removeParentClassesFromElement(this.element);
  }
  
  removeParentClassesFromElement(element) {
    const section = element.closest('.section');
    const container = element.closest('.container');
    const collapsibleContent = element.closest('.collapsible-content');
    
    if (section) section.classList.remove('dropdown-parent-open');
    if (container) container.classList.remove('dropdown-parent-open');
    if (collapsibleContent) collapsibleContent.classList.remove('dropdown-parent-open');
  }
  
  populate(options, selectedValue = '') {
    // Clear existing options
    this.optionsDiv.innerHTML = '';
    
    // Update display based on selected value
    this.updateSelectedDisplay(selectedValue, options);
    
    // Add options
    options.forEach(option => {
      const optionDiv = this.createOptionElement(option, selectedValue);
      this.optionsDiv.appendChild(optionDiv);
    });
  }
  
  updateSelectedDisplay(selectedValue, options) {
    if (!selectedValue || selectedValue === '') {
      this.placeholderSpan.textContent = this.options.placeholder;
      this.placeholderSpan.className = 'custom-dropdown-placeholder';
    } else {
      const selectedOption = options.find(opt => opt.value === selectedValue);
      if (selectedOption) {
        this.placeholderSpan.textContent = selectedOption.text;
        this.placeholderSpan.className = '';
      }
    }
  }
  
  createOptionElement(option, selectedValue) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'custom-dropdown-option';
    optionDiv.setAttribute('data-value', option.value);
    optionDiv.setAttribute('data-description', option.description || '');
    
    if (option.value === selectedValue) {
      optionDiv.classList.add('selected');
    }
    
    optionDiv.innerHTML = `
      <div class="custom-dropdown-option-text">${option.text}</div>
      ${option.description ? `<div class="custom-dropdown-option-desc">${option.description}</div>` : ''}
    `;
    
    optionDiv.addEventListener('click', () => {
      this.selectOption(option);
    });
    
    return optionDiv;
  }
  
  selectOption(option) {
    // Update selected value
    this.element.setAttribute('data-value', option.value);
    
    // Update display
    if (option.value === '') {
      this.placeholderSpan.textContent = this.options.placeholder;
      this.placeholderSpan.className = 'custom-dropdown-placeholder';
    } else {
      this.placeholderSpan.textContent = option.text;
      this.placeholderSpan.className = '';
    }
    
    // Update selected state
    this.optionsDiv.querySelectorAll('.custom-dropdown-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    this.optionsDiv.querySelector(`[data-value="${option.value}"]`).classList.add('selected');
    
    // Close dropdown
    this.close();
    
    // Trigger change event
    const changeEvent = new CustomEvent('dropdown-change', {
      detail: { 
        value: option.value, 
        option: option,
        dropdown: this.element 
      }
    });
    this.element.dispatchEvent(changeEvent);
  }
  
  getValue() {
    return this.element.getAttribute('data-value') || '';
  }
  
  setValue(value, options = []) {
    this.element.setAttribute('data-value', value);
    this.updateSelectedDisplay(value, options);
  }
  
  updatePlaceholder() {
    this.placeholderSpan.textContent = this.options.placeholder;
  }
  
  // Static method to initialize all dropdowns on page
  static initializeAll(selector = '.custom-dropdown', options = {}) {
    document.querySelectorAll(selector).forEach(element => {
      new CustomDropdown(element, options);
    });
  }
}

// Legacy function for backward compatibility
function initializeCustomDropdown(dropdownElement, options = {}) {
  return new CustomDropdown(dropdownElement, options);
}

function populateCustomDropdown(dropdownElement, options, selectedValue = '') {
  const dropdown = dropdownElement._customDropdown || new CustomDropdown(dropdownElement);
  dropdown.populate(options, selectedValue);
  dropdownElement._customDropdown = dropdown;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomDropdown;
}

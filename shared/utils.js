/**
 * Utility Functions
 * Funciones utilitarias compartidas entre componentes
 */

// DOM Utilities
const DOM = {
  createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.keys(attributes).forEach(key => {
      if (key === 'className') {
        element.className = attributes[key];
      } else if (key === 'innerHTML') {
        element.innerHTML = attributes[key];
      } else {
        element.setAttribute(key, attributes[key]);
      }
    });
    
    // Add children
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  findParent(element, selector) {
    let parent = element.parentElement;
    while (parent && !parent.matches(selector)) {
      parent = parent.parentElement;
    }
    return parent;
  },
  
  ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }
};

// Array Utilities
const Arrays = {
  unique(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  },
  
  sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aValue = typeof key === 'function' ? key(a) : a[key];
      const bValue = typeof key === 'function' ? key(b) : b[key];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  },
  
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = typeof key === 'function' ? key(item) : item[key];
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {});
  }
};

// String Utilities
const Strings = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  truncate(str, length = 50, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length) + suffix;
  },
  
  slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  },
  
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Validation Utilities
const Validation = {
  isEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  
  isNumber(value) {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },
  
  isInteger(value) {
    return Number.isInteger(Number(value));
  },
  
  isPositiveInteger(value) {
    const num = Number(value);
    return Number.isInteger(num) && num > 0;
  },
  
  isJSON(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

// Format Utilities
const Format = {
  currency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  number(num, decimals = 2, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  },
  
  date(date, locale = 'es-ES', options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(new Date(date));
  },
  
  fileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
};

// Async Utilities
const Async = {
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  
  timeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), ms)
      )
    ]);
  },
  
  retry(fn, attempts = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
      const attempt = (n) => {
        fn().then(resolve).catch((error) => {
          if (n === 1) {
            reject(error);
          } else {
            setTimeout(() => attempt(n - 1), delay);
          }
        });
      };
      attempt(attempts);
    });
  }
};

// Event Utilities
const Events = {
  debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func.apply(this, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(this, args);
    };
  },
  
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  once(func) {
    let called = false;
    return function(...args) {
      if (!called) {
        called = true;
        return func.apply(this, args);
      }
    };
  }
};

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DOM,
    Arrays,
    Strings,
    Validation,
    Format,
    Async,
    Events
  };
}

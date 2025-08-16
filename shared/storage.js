/**
 * Storage Utilities
 * Utilidades para manejo de localStorage con funciones específicas para el proyecto
 */
class StorageManager {
  constructor(prefix = 'poc_data_') {
    this.prefix = prefix;
  }
  
  // Funciones específicas para el proyecto
  getDatosOrdenes() {
    const data = this.getItem('ordenes');
    return data ? JSON.parse(data) : [];
  }
  
  getDatosFacturas() {
    const data = this.getItem('facturas');
    return data ? JSON.parse(data) : [];
  }
  
  saveDatosOrdenes(data) {
    this.setItem('ordenes', JSON.stringify(data));
  }
  
  saveDatosFacturas(data) {
    this.setItem('facturas', JSON.stringify(data));
  }
  
  // Funciones genéricas
  getItem(key) {
    try {
      return localStorage.getItem(this.prefix + key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }
  
  setItem(key, value) {
    try {
      localStorage.setItem(this.prefix + key, value);
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  }
  
  removeItem(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }
  
  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
  
  getAllKeys() {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('Error getting localStorage keys:', error);
      return [];
    }
  }
  
  getSize() {
    try {
      let size = 0;
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          size += localStorage.getItem(key).length;
        }
      });
      return size;
    } catch (error) {
      console.error('Error calculating localStorage size:', error);
      return 0;
    }
  }
  
  isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create default instance
const storage = new StorageManager();

// Legacy functions for backward compatibility
function getDatosOrdenes() {
  return storage.getDatosOrdenes();
}

function getDatosFacturas() {
  return storage.getDatosFacturas();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StorageManager, storage };
}

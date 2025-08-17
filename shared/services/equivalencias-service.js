/**
 * EquivalenciasService - Servicio de datos para equivalencias
 * Puede ser usado directamente o dentro de casos de uso
 */
class EquivalenciasService {
    constructor() {
        this.entityType = 'equivalencias';
    }

    /**
     * Obtiene todas las equivalencias
     * @returns {Array} Lista de equivalencias
     */
    getAll() {
        if (window.dataManager) {
            return window.dataManager.getData(this.entityType) || [];
        }
        // Fallback directo a localStorage
        const data = localStorage.getItem(`poc_data_${this.entityType}`);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Busca equivalencias por SKU origen
     * @param {string} skuOrigen - SKU origen
     * @returns {Array} Lista de equivalencias del SKU
     */
    findBySkuOrigen(skuOrigen) {
        const equivalencias = this.getAll();
        return equivalencias.filter(e => e.skuOrigen === skuOrigen);
    }

    /**
     * Obtiene todos los SKUs equivalentes de un SKU origen
     * @param {string} skuOrigen - SKU origen
     * @returns {Array} Lista de SKUs equivalentes
     */
    getEquivalentesSku(skuOrigen) {
        const equivalencias = this.findBySkuOrigen(skuOrigen);
        return equivalencias.map(e => e.skuEquivalente);
    }

    /**
     * Verifica si dos SKUs son equivalentes
     * @param {string} sku1 - Primer SKU
     * @param {string} sku2 - Segundo SKU
     * @returns {boolean} True si son equivalentes, false si no
     */
    areEquivalent(sku1, sku2) {
        // Verificar en ambas direcciones
        const equivalencias1 = this.findBySkuOrigen(sku1);
        const equivalencias2 = this.findBySkuOrigen(sku2);
        
        return equivalencias1.some(e => e.skuEquivalente === sku2) ||
               equivalencias2.some(e => e.skuEquivalente === sku1);
    }

    /**
     * Verifica si un SKU tiene equivalencias
     * @param {string} sku - SKU a verificar
     * @returns {boolean} True si tiene equivalencias, false si no
     */
    hasEquivalencias(sku) {
        return this.findBySkuOrigen(sku).length > 0;
    }

    /**
     * Obtiene todas las equivalencias de un SKU (incluyendo el SKU original)
     * @param {string} sku - SKU a buscar
     * @returns {Array} Lista completa de SKUs relacionados
     */
    getAllRelatedSkus(sku) {
        const equivalentes = this.getEquivalentesSku(sku);
        return [sku, ...equivalentes];
    }

    /**
     * Busca el SKU origen de un SKU equivalente
     * @param {string} skuEquivalente - SKU equivalente
     * @returns {Array} Lista de SKUs origen que tienen este equivalente
     */
    findOrigenByEquivalente(skuEquivalente) {
        const equivalencias = this.getAll();
        return equivalencias
            .filter(e => e.skuEquivalente === skuEquivalente)
            .map(e => e.skuOrigen);
    }

    /**
     * Cuenta el total de equivalencias
     * @returns {number} Número total de equivalencias
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Cuenta equivalencias por SKU origen
     * @param {string} skuOrigen - SKU origen
     * @returns {number} Número de equivalencias del SKU
     */
    countBySkuOrigen(skuOrigen) {
        return this.findBySkuOrigen(skuOrigen).length;
    }

    /**
     * Obtiene valores únicos de un campo
     * @param {string} field - Campo a obtener valores únicos
     * @returns {Array} Lista de valores únicos
     */
    getUniqueValues(field) {
        const equivalencias = this.getAll();
        return [...new Set(equivalencias.map(e => e[field]).filter(Boolean))];
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.equivalenciasService = new EquivalenciasService();
}

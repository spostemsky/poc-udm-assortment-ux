/**
 * Repositorio para acceso a datos de Equivalencias
 * Capa de acceso a datos - Solo operaciones CRUD
 */
class EquivalenciasRepository {
    constructor() {
        this.storageKey = 'poc_data_equivalencias';
    }

    /**
     * Obtener todas las equivalencias
     * @returns {Array} Array de equivalencias
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo equivalencias:', error);
            return [];
        }
    }

    /**
     * Buscar equivalencia por ID interno
     * @param {string} id - ID interno de la equivalencia
     * @returns {Object|null} Equivalencia encontrada o null
     */
    findById(id) {
        const equivalencias = this.getAll();
        return equivalencias.find(e => e.id === id) || null;
    }

    /**
     * Buscar equivalencias por SKU origen
     * @param {string} skuOrigen - SKU origen
     * @returns {Array} Array de equivalencias que tienen el SKU como origen
     */
    findBySkuOrigen(skuOrigen) {
        const equivalencias = this.getAll();
        return equivalencias.filter(e => e.sku_origen === skuOrigen);
    }

    /**
     * Buscar equivalencias por SKU destino
     * @param {string} skuDestino - SKU destino
     * @returns {Array} Array de equivalencias que tienen el SKU como destino
     */
    findBySkuDestino(skuDestino) {
        const equivalencias = this.getAll();
        return equivalencias.filter(e => e.sku_destino === skuDestino);
    }

    /**
     * Buscar equivalencia específica entre dos SKUs
     * @param {string} skuOrigen - SKU origen
     * @param {string} skuDestino - SKU destino
     * @returns {Object|null} Equivalencia encontrada o null
     */
    findEquivalencia(skuOrigen, skuDestino) {
        const equivalencias = this.getAll();
        return equivalencias.find(e => 
            e.sku_origen === skuOrigen && e.sku_destino === skuDestino
        ) || null;
    }

    /**
     * Obtener todos los SKUs equivalentes a un SKU dado
     * @param {string} sku - SKU base
     * @returns {Array} Array de SKUs equivalentes
     */
    getEquivalentesSku(sku) {
        const equivalencias = this.getAll();
        const equivalentes = new Set();
        
        // Buscar como origen
        equivalencias.forEach(e => {
            if (e.sku_origen === sku) {
                equivalentes.add(e.sku_destino);
            }
        });
        
        // Buscar como destino
        equivalencias.forEach(e => {
            if (e.sku_destino === sku) {
                equivalentes.add(e.sku_origen);
            }
        });
        
        return Array.from(equivalentes);
    }

    /**
     * Verificar si dos SKUs son equivalentes
     * @param {string} sku1 - Primer SKU
     * @param {string} sku2 - Segundo SKU
     * @returns {boolean} true si son equivalentes, false si no
     */
    areEquivalent(sku1, sku2) {
        if (sku1 === sku2) return true;
        
        const equivalencias = this.getAll();
        return equivalencias.some(e => 
            (e.sku_origen === sku1 && e.sku_destino === sku2) ||
            (e.sku_origen === sku2 && e.sku_destino === sku1)
        );
    }

    /**
     * Verificar si existe una equivalencia con el ID dado
     * @param {string} id - ID interno de la equivalencia
     * @returns {boolean} true si existe, false si no
     */
    exists(id) {
        return this.findById(id) !== null;
    }

    /**
     * Verificar si un SKU tiene equivalencias
     * @param {string} sku - SKU a verificar
     * @returns {boolean} true si tiene equivalencias, false si no
     */
    hasEquivalencias(sku) {
        const equivalentes = this.getEquivalentesSku(sku);
        return equivalentes.length > 0;
    }

    /**
     * Contar total de equivalencias
     * @returns {number} Número total de equivalencias
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Contar equivalencias para un SKU específico
     * @param {string} sku - SKU a contar
     * @returns {number} Número de equivalencias del SKU
     */
    countForSku(sku) {
        return this.getEquivalentesSku(sku).length;
    }

    /**
     * Obtener información del repositorio
     * @returns {Object} Información del repositorio
     */
    getInfo() {
        const equivalencias = this.getAll();
        
        return {
            total: equivalencias.length,
            storageKey: this.storageKey,
            hasData: equivalencias.length > 0
        };
    }
}

// Crear instancia global
window.equivalenciasRepository = new EquivalenciasRepository();

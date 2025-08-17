/**
 * OfertasService - Servicio de datos para ofertas
 * Puede ser usado directamente o dentro de casos de uso
 */
class OfertasService {
    constructor() {
        this.entityType = 'ofertas';
    }

    /**
     * Obtiene todas las ofertas
     * @returns {Array} Lista de ofertas
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
     * Busca ofertas por vendor ID
     * @param {string} vendorId - ID del vendor
     * @returns {Array} Lista de ofertas del vendor
     */
    findByVendorId(vendorId) {
        const ofertas = this.getAll();
        return ofertas.filter(o => o.vendor_id == vendorId); // Usar vendor_id (snake_case) y comparación flexible
    }

    /**
     * Busca una oferta por vendor SKU
     * @param {string} vendorSku - Vendor SKU
     * @returns {Object|null} Oferta encontrada o null
     */
    findByVendorSku(vendorSku) {
        const ofertas = this.getAll();
        return ofertas.find(o => o.vendor_sku === vendorSku) || null; // Usar vendor_sku (snake_case)
    }

    /**
     * Obtiene el material ID de una oferta por vendor SKU
     * @param {string} vendorSku - Vendor SKU
     * @returns {string|null} Material ID o null
     */
    getMaterialIdByVendorSku(vendorSku) {
        const oferta = this.findByVendorSku(vendorSku);
        return oferta ? oferta.material_id : null; // Usar material_id (snake_case)
    }

    /**
     * Busca una oferta específica por vendor ID y SKU
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - Vendor SKU
     * @returns {Object|null} Oferta encontrada o null
     */
    findByVendorIdAndSku(vendorId, vendorSku) {
        const ofertas = this.getAll();
        return ofertas.find(o => o.vendor_id == vendorId && o.vendor_sku === vendorSku) || null; // Usar snake_case
    }

    /**
     * Obtiene todas las ofertas de un vendor con un SKU específico
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - Vendor SKU
     * @returns {Array} Lista de ofertas que coinciden
     */
    findAllByVendorIdAndSku(vendorId, vendorSku) {
        const ofertas = this.getAll();
        return ofertas.filter(o => o.vendor_id == vendorId && o.vendor_sku === vendorSku); // Usar snake_case
    }

    /**
     * Obtiene valores únicos de un campo
     * @param {string} field - Campo a obtener valores únicos
     * @returns {Array} Lista de valores únicos
     */
    getUniqueValues(field) {
        const ofertas = this.getAll();
        return [...new Set(ofertas.map(o => o[field]).filter(Boolean))];
    }

    /**
     * Cuenta el total de ofertas
     * @returns {number} Número total de ofertas
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Cuenta ofertas por vendor
     * @param {string} vendorId - ID del vendor
     * @returns {number} Número de ofertas del vendor
     */
    countByVendor(vendorId) {
        return this.findByVendorId(vendorId).length;
    }

    /**
     * Verifica si existe una oferta con el vendor SKU dado
     * @param {string} vendorSku - Vendor SKU a verificar
     * @returns {boolean} True si existe, false si no
     */
    existsBySku(vendorSku) {
        return this.findByVendorSku(vendorSku) !== null;
    }

    /**
     * Verifica si existe una oferta para un vendor y SKU específicos
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - Vendor SKU
     * @returns {boolean} True si existe, false si no
     */
    existsByVendorAndSku(vendorId, vendorSku) {
        return this.findByVendorIdAndSku(vendorId, vendorSku) !== null;
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.ofertasService = new OfertasService();
}

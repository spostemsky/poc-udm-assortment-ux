/**
 * FacturasService - Servicio de datos para facturas
 * Puede ser usado directamente o dentro de casos de uso
 */
class FacturasService {
    constructor() {
        this.entityType = 'facturas';
    }

    /**
     * Obtiene todas las facturas
     * @returns {Array} Lista de facturas
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
     * Busca una factura por external_id
     * @param {string} externalId - ID externo de la factura
     * @returns {Object|null} Factura encontrada o null
     */
    findByExternalId(externalId) {
        const facturas = this.getAll();
        return facturas.find(f => f.external_id === externalId) || null;
    }

    /**
     * Obtiene los items de una factura por external_id
     * @param {string} externalId - ID externo de la factura
     * @returns {Array} Lista de items formateados
     */
    getItemsByExternalId(externalId) {
        const factura = this.findByExternalId(externalId);
        if (!factura || !factura.details || !Array.isArray(factura.details)) {
            return [];
        }

        return factura.details.map(detail => ({
            external_id: factura.external_id,
            identificadorItem: detail.vendor_sku,
            cantidad: detail.quantity,
            precioUnitario: detail.unit_amount,
            descripcion: detail.description,
            sap_order_id: factura.sap_order_id,
            ean: detail.ean,
            detailId: detail.id
        }));
    }

    /**
     * Busca una factura por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Object|null} Factura encontrada o null
     */
    findBySapOrderId(sapOrderId) {
        const facturas = this.getAll();
        return facturas.find(f => f.sap_order_id === sapOrderId) || null;
    }

    /**
     * Obtiene valores únicos de un campo
     * @param {string} field - Campo a obtener valores únicos
     * @returns {Array} Lista de valores únicos
     */
    getUniqueValues(field) {
        const facturas = this.getAll();
        return [...new Set(facturas.map(f => f[field]).filter(Boolean))];
    }

    /**
     * Verifica si existe una factura con el external_id dado
     * @param {string} externalId - ID externo a verificar
     * @returns {boolean} True si existe, false si no
     */
    exists(externalId) {
        return this.findByExternalId(externalId) !== null;
    }

    /**
     * Cuenta el total de facturas
     * @returns {number} Número total de facturas
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Obtiene la orden de compra de una factura
     * @param {string} externalId - ID externo de la factura
     * @returns {string|null} SAP Order ID o null
     */
    getSapOrderId(externalId) {
        const factura = this.findByExternalId(externalId);
        return factura ? factura.sap_order_id : null;
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.facturasService = new FacturasService();
}

/**
 * OrdenesService - Servicio de datos para órdenes
 * Puede ser usado directamente o dentro de casos de uso
 */
class OrdenesService {
    constructor() {
        this.entityType = 'ordenes';
    }

    /**
     * Obtiene todas las órdenes
     * @returns {Array} Lista de órdenes
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
     * Busca una orden por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Object|null} Orden encontrada o null
     */
    findBySapOrderId(sapOrderId) {
        const ordenes = this.getAll();
        return ordenes.find(o => o.sapOrderId === sapOrderId) || null;
    }

    /**
     * Obtiene los detalles de una orden por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Lista de detalles de la orden
     */
    getDetailsBySapOrderId(sapOrderId) {
        const orden = this.findBySapOrderId(sapOrderId);
        return orden && orden.details ? orden.details : [];
    }

    /**
     * Busca un detalle específico por vendor_sku dentro de una orden
     * @param {string} sapOrderId - SAP Order ID
     * @param {string} vendorSku - Vendor SKU a buscar
     * @returns {Object|null} Detalle encontrado o null
     */
    findDetailByVendorSku(sapOrderId, vendorSku) {
        const details = this.getDetailsBySapOrderId(sapOrderId);
        return details.find(detail => detail.vendorSku === vendorSku) || null;
    }

    /**
     * Obtiene todos los vendor SKUs de una orden formateados para dropdown
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Lista de SKUs formateados
     */
    getVendorSkusBySapOrderId(sapOrderId) {
        const details = this.getDetailsBySapOrderId(sapOrderId);
        return details.map(detail => ({
            value: detail.vendorSku,
            text: detail.vendorSku,
            description: detail.item?.title || 'Sin descripción',
            unitPrice: detail.unitPrice,
            materialId: detail.materialId,
            quantity: detail.quantity
        }));
    }

    /**
     * Obtiene todos los vendor SKUs disponibles (sin filtrar)
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Lista de todos los SKUs disponibles
     */
    getAllAvailableSkus(sapOrderId) {
        const skus = this.getVendorSkusBySapOrderId(sapOrderId);
        // Agregar opción "Otro" al final
        skus.push({ value: 'Otro', text: 'Otro', description: '' });
        return skus;
    }

    /**
     * Obtiene SKUs disponibles excluyendo los ya seleccionados
     * @param {string} sapOrderId - SAP Order ID
     * @param {Array} excludeSkus - SKUs a excluir
     * @returns {Array} Lista de SKUs filtrados
     */
    getAvailableSkus(sapOrderId, excludeSkus = []) {
        const allSkus = this.getVendorSkusBySapOrderId(sapOrderId);
        const filteredSkus = allSkus.filter(sku => !excludeSkus.includes(sku.value));
        // Agregar opción "Otro" al final
        filteredSkus.push({ value: 'Otro', text: 'Otro', description: '' });
        return filteredSkus;
    }

    /**
     * Verifica si existe una orden con el SAP Order ID dado
     * @param {string} sapOrderId - SAP Order ID a verificar
     * @returns {boolean} True si existe, false si no
     */
    exists(sapOrderId) {
        return this.findBySapOrderId(sapOrderId) !== null;
    }

    /**
     * Cuenta el total de órdenes
     * @returns {number} Número total de órdenes
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Obtiene información completa de un SKU específico
     * @param {string} sapOrderId - SAP Order ID
     * @param {string} vendorSku - Vendor SKU
     * @returns {Object|null} Información completa del SKU o null
     */
    getSkuInfo(sapOrderId, vendorSku) {
        const detail = this.findDetailByVendorSku(sapOrderId, vendorSku);
        if (!detail) return null;

        return {
            value: detail.vendorSku,
            text: detail.vendorSku,
            description: detail.item?.title || 'Sin descripción',
            unitPrice: detail.unitPrice,
            materialId: detail.materialId,
            quantity: detail.quantity,
            esCoincidenciaExacta: true
        };
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.ordenesService = new OrdenesService();
}

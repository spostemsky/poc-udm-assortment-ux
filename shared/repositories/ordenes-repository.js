/**
 * Repositorio para acceso a datos de Órdenes
 * Capa de acceso a datos - Solo operaciones CRUD
 */
class OrdenesRepository {
    constructor() {
        this.storageKey = 'poc_data_ordenes';
    }

    /**
     * Obtener todas las órdenes
     * @returns {Array} Array de órdenes
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo órdenes:', error);
            return [];
        }
    }

    /**
     * Buscar orden por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Object|null} Orden encontrada o null
     */
    findBySapOrderId(sapOrderId) {
        const ordenes = this.getAll();
        return ordenes.find(o => o.sapOrderId === sapOrderId) || null;
    }

    /**
     * Buscar orden por ID interno
     * @param {string} id - ID interno de la orden
     * @returns {Object|null} Orden encontrada o null
     */
    findById(id) {
        const ordenes = this.getAll();
        return ordenes.find(o => o.id === id) || null;
    }

    /**
     * Obtener detalles de una orden por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Array de detalles de la orden
     */
    getDetailsBySapOrderId(sapOrderId) {
        const orden = this.findBySapOrderId(sapOrderId);
        return orden && orden.details ? orden.details : [];
    }

    /**
     * Buscar detalle específico por vendor_sku en una orden
     * @param {string} sapOrderId - SAP Order ID
     * @param {string} vendorSku - Vendor SKU a buscar
     * @returns {Object|null} Detalle encontrado o null
     */
    findDetailByVendorSku(sapOrderId, vendorSku) {
        const detalles = this.getDetailsBySapOrderId(sapOrderId);
        return detalles.find(detail => detail.vendorSku === vendorSku) || null;
    }

    /**
     * Obtener todos los vendor SKUs de una orden
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Array de objetos con información de SKUs
     */
    getVendorSkusBySapOrderId(sapOrderId) {
        const detalles = this.getDetailsBySapOrderId(sapOrderId);
        return detalles.map(detail => ({
            value: detail.vendorSku,
            text: detail.vendorSku,
            description: detail.item.title,
            unitPrice: detail.unitPrice,
            materialId: detail.materialId,
            quantity: detail.quantity
        }));
    }

    /**
     * Obtener vendor_id de una orden por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {string|null} Vendor ID o null
     */
    getVendorIdBySapOrderId(sapOrderId) {
        const orden = this.findBySapOrderId(sapOrderId);
        return orden ? orden.vendor_id : null;
    }

    /**
     * Verificar si existe una orden con el SAP Order ID dado
     * @param {string} sapOrderId - SAP Order ID
     * @returns {boolean} true si existe, false si no
     */
    exists(sapOrderId) {
        return this.findBySapOrderId(sapOrderId) !== null;
    }

    /**
     * Verificar si un vendor_sku existe en una orden específica
     * @param {string} sapOrderId - SAP Order ID
     * @param {string} vendorSku - Vendor SKU a verificar
     * @returns {boolean} true si existe, false si no
     */
    hasVendorSku(sapOrderId, vendorSku) {
        return this.findDetailByVendorSku(sapOrderId, vendorSku) !== null;
    }

    /**
     * Contar total de órdenes
     * @returns {number} Número total de órdenes
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Obtener información del repositorio
     * @returns {Object} Información del repositorio
     */
    getInfo() {
        const ordenes = this.getAll();
        
        return {
            total: ordenes.length,
            storageKey: this.storageKey,
            hasData: ordenes.length > 0
        };
    }
}

// Crear instancia global
window.ordenesRepository = new OrdenesRepository();

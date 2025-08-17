/**
 * Repositorio para acceso a datos de Facturas
 * Capa de acceso a datos - Solo operaciones CRUD
 */
class FacturasRepository {
    constructor() {
        this.storageKey = 'poc_data_facturas';
    }

    /**
     * Obtener todas las facturas
     * @returns {Array} Array de facturas
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo facturas:', error);
            return [];
        }
    }

    /**
     * Buscar factura por external_id
     * @param {string} externalId - ID externo de la factura
     * @returns {Object|null} Factura encontrada o null
     */
    findByExternalId(externalId) {
        const facturas = this.getAll();
        return facturas.find(f => f.external_id === externalId) || null;
    }

    /**
     * Buscar facturas por SAP Order ID
     * @param {string} sapOrderId - SAP Order ID
     * @returns {Array} Array de facturas que coinciden
     */
    findBySapOrderId(sapOrderId) {
        const facturas = this.getAll();
        return facturas.filter(f => f.sap_order_id === sapOrderId);
    }

    /**
     * Obtener facturas únicas (por external_id)
     * @returns {Array} Array de facturas únicas
     */
    getUnique() {
        const facturas = this.getAll();
        const facturasUnicas = [];
        const externalIdsVistos = new Set();
        
        facturas.forEach(factura => {
            if (factura.external_id && !externalIdsVistos.has(factura.external_id)) {
                externalIdsVistos.add(factura.external_id);
                facturasUnicas.push({
                    external_id: factura.external_id,
                    sap_order_id: factura.sap_order_id,
                    vendor_name: factura.vendor_name
                });
            }
        });
        
        // Ordenar por external_id
        return facturasUnicas.sort((a, b) => a.external_id.localeCompare(b.external_id));
    }

    /**
     * Obtener detalles de una factura por external_id
     * @param {string} externalId - ID externo de la factura
     * @returns {Array} Array de items/detalles de la factura
     */
    getItemsByExternalId(externalId) {
        const factura = this.findByExternalId(externalId);
        if (!factura || !factura.details || !Array.isArray(factura.details)) {
            return [];
        }
        
        return factura.details.map((detail, index) => ({
            external_id: factura.external_id,
            identificadorItem: detail.vendor_sku,
            cantidad: detail.quantity,
            precioUnitario: detail.unit_amount,
            descripcion: detail.description,
            sap_order_id: factura.sap_order_id,
            // Campos adicionales
            ean: detail.ean,
            detailId: detail.id
        }));
    }

    /**
     * Verificar si existe una factura con el external_id dado
     * @param {string} externalId - ID externo de la factura
     * @returns {boolean} true si existe, false si no
     */
    exists(externalId) {
        return this.findByExternalId(externalId) !== null;
    }

    /**
     * Contar total de facturas
     * @returns {number} Número total de facturas
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Obtener información del repositorio
     * @returns {Object} Información del repositorio
     */
    getInfo() {
        const facturas = this.getAll();
        const facturasUnicas = this.getUnique();
        
        return {
            total: facturas.length,
            unique: facturasUnicas.length,
            storageKey: this.storageKey,
            hasData: facturas.length > 0
        };
    }
}

// Crear instancia global
window.facturasRepository = new FacturasRepository();

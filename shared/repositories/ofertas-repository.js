/**
 * Repositorio para acceso a datos de Ofertas
 * Capa de acceso a datos - Solo operaciones CRUD
 */
class OfertasRepository {
    constructor() {
        this.storageKey = 'poc_data_ofertas';
    }

    /**
     * Obtener todas las ofertas
     * @returns {Array} Array de ofertas
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error obteniendo ofertas:', error);
            return [];
        }
    }

    /**
     * Buscar ofertas por vendor_id
     * @param {string} vendorId - ID del vendor
     * @returns {Array} Array de ofertas del vendor
     */
    findByVendorId(vendorId) {
        const ofertas = this.getAll();
        return ofertas.filter(o => o.vendor_id === vendorId);
    }

    /**
     * Buscar oferta por ID interno
     * @param {string} id - ID interno de la oferta
     * @returns {Object|null} Oferta encontrada o null
     */
    findById(id) {
        const ofertas = this.getAll();
        return ofertas.find(o => o.id === id) || null;
    }

    /**
     * Buscar ofertas que contengan un vendor_sku específico
     * @param {string} vendorSku - Vendor SKU a buscar
     * @returns {Array} Array de ofertas que contienen el SKU
     */
    findByVendorSku(vendorSku) {
        const ofertas = this.getAll();
        return ofertas.filter(oferta => {
            return oferta.vendor_sku === vendorSku ||
                   (oferta.items && oferta.items.some(item => item.vendor_sku === vendorSku));
        });
    }

    /**
     * Buscar ofertas por vendor_id que contengan un vendor_sku específico
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - Vendor SKU a buscar
     * @returns {Array} Array de ofertas que coinciden
     */
    findByVendorIdAndSku(vendorId, vendorSku) {
        const ofertasVendor = this.findByVendorId(vendorId);
        return ofertasVendor.filter(oferta => {
            return oferta.vendor_sku === vendorSku ||
                   (oferta.items && oferta.items.some(item => item.vendor_sku === vendorSku));
        });
    }

    /**
     * Obtener material_id de una oferta que contenga un vendor_sku específico
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - Vendor SKU a buscar
     * @returns {string|null} Material ID o null si no se encuentra
     */
    getMaterialIdByVendorSku(vendorId, vendorSku) {
        const ofertas = this.findByVendorIdAndSku(vendorId, vendorSku);
        
        for (const oferta of ofertas) {
            // Verificar si el vendor_sku está en el nivel principal
            if (oferta.vendor_sku === vendorSku && oferta.material_id) {
                return oferta.material_id;
            }
            
            // Verificar si el vendor_sku está en los items
            if (oferta.items) {
                const item = oferta.items.find(item => item.vendor_sku === vendorSku);
                if (item && item.material_id) {
                    return item.material_id;
                }
            }
        }
        
        return null;
    }

    /**
     * Verificar si existe una oferta con el ID dado
     * @param {string} id - ID interno de la oferta
     * @returns {boolean} true si existe, false si no
     */
    exists(id) {
        return this.findById(id) !== null;
    }

    /**
     * Verificar si un vendor tiene ofertas
     * @param {string} vendorId - ID del vendor
     * @returns {boolean} true si tiene ofertas, false si no
     */
    hasOfertasForVendor(vendorId) {
        const ofertas = this.findByVendorId(vendorId);
        return ofertas.length > 0;
    }

    /**
     * Contar total de ofertas
     * @returns {number} Número total de ofertas
     */
    count() {
        return this.getAll().length;
    }

    /**
     * Contar ofertas por vendor
     * @param {string} vendorId - ID del vendor
     * @returns {number} Número de ofertas del vendor
     */
    countByVendor(vendorId) {
        return this.findByVendorId(vendorId).length;
    }

    /**
     * Obtener información del repositorio
     * @returns {Object} Información del repositorio
     */
    getInfo() {
        const ofertas = this.getAll();
        
        return {
            total: ofertas.length,
            storageKey: this.storageKey,
            hasData: ofertas.length > 0
        };
    }
}

// Crear instancia global
window.ofertasRepository = new OfertasRepository();

/**
 * 🔍 Caso de Uso: Buscar Ofertas por Vendor
 * Busca ofertas que coincidan con vendor_id y vendor_sku
 */
class FindOffersByVendorUseCase {
    constructor(ofertasService) {
        this.ofertasService = ofertasService;
    }

    /**
     * Buscar ofertas por vendor_id y vendor_sku
     * @param {string} vendorId - ID del vendor
     * @param {string} vendorSku - SKU del vendor
     * @returns {Object} Resultado con material_id o null
     */
    execute(vendorId, vendorSku) {
        console.log(`🔍 Buscando ofertas: vendor_id=${vendorId}, vendor_sku=${vendorSku}`);
        
        try {
            // Validar parámetros
            if (!vendorId || !vendorSku) {
                return { 
                    success: false, 
                    material_id: null, 
                    reason: 'invalid_parameters',
                    message: 'vendor_id y vendor_sku son requeridos'
                };
            }
            
            // Buscar ofertas con mismo vendor_id
            const ofertas = this.ofertasService.getByVendorId(vendorId);
            
            if (!ofertas || ofertas.length === 0) {
                console.log(`⚠️ No se encontraron ofertas para vendor_id: ${vendorId}`);
                return { 
                    success: false, 
                    material_id: null, 
                    reason: 'no_offers_for_vendor',
                    message: `No hay ofertas para vendor_id: ${vendorId}`,
                    total_offers_checked: 0
                };
            }
            
            console.log(`📦 Encontradas ${ofertas.length} ofertas para vendor_id: ${vendorId}`);
            
            // Buscar ofertas con mismo vendor_sku
            const matchingOferta = ofertas.find(oferta => oferta.vendor_sku === vendorSku);
            
            if (matchingOferta) {
                console.log(`✅ Match encontrado: material_id=${matchingOferta.material_id}`);
                return {
                    success: true,
                    material_id: matchingOferta.material_id,
                    reason: 'found',
                    message: `Oferta encontrada con material_id: ${matchingOferta.material_id}`,
                    total_offers_checked: ofertas.length,
                    matching_oferta: {
                        id: matchingOferta.id,
                        vendor_id: matchingOferta.vendor_id,
                        vendor_sku: matchingOferta.vendor_sku,
                        material_id: matchingOferta.material_id
                    }
                };
            } else {
                console.log(`❌ No se encontró oferta con vendor_sku: ${vendorSku}`);
                return {
                    success: false,
                    material_id: null,
                    reason: 'no_matching_sku',
                    message: `No hay ofertas con vendor_sku: ${vendorSku}`,
                    total_offers_checked: ofertas.length
                };
            }
            
        } catch (error) {
            console.error('❌ Error en FindOffersByVendorUseCase:', error);
            return { 
                success: false, 
                material_id: null, 
                reason: 'error', 
                message: `Error: ${error.message}`,
                error: error.message 
            };
        }
    }
    
    /**
     * Obtener información del caso de uso
     * @returns {Object} Información del caso de uso
     */
    getInfo() {
        return {
            name: 'FindOffersByVendorUseCase',
            description: 'Busca ofertas que coincidan con vendor_id y vendor_sku',
            dependencies: ['OfertasService'],
            version: '1.0.0'
        };
    }
}

// 🚀 INICIALIZACIÓN LAZY
Object.defineProperty(window, 'findOffersByVendorUseCase', {
    get: function() {
        if (this._findOffersByVendorInstance) {
            return this._findOffersByVendorInstance;
        }
        
        if (!window.ofertasService) {
            throw new Error('ofertasService no está disponible para FindOffersByVendorUseCase');
        }
        
        console.debug('🏗️ FindOffersByVendorUseCase inicializado');
        this._findOffersByVendorInstance = new FindOffersByVendorUseCase(window.ofertasService);
        return this._findOffersByVendorInstance;
    },
    configurable: true
});

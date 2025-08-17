/**
 * 🔍 Caso de Uso: Buscar Detalles de Orden por Material ID
 * Busca vendor_sku en orden usando material_id
 */
class FindOrdenDetailsByMaterialUseCase {
    constructor(ordenesService) {
        this.ordenesService = ordenesService;
    }

    /**
     * Buscar vendor_sku por material_id en orden
     * @param {string} sapOrderId - ID de la orden SAP
     * @param {string} materialId - ID del material
     * @returns {Object} Resultado con vendor_sku o null
     */
    execute(sapOrderId, materialId) {
        console.log(`🔍 Buscando en orden: sap_order_id=${sapOrderId}, material_id=${materialId}`);
        
        try {
            // Validar parámetros
            if (!sapOrderId || !materialId) {
                return { 
                    success: false, 
                    vendor_sku: null, 
                    reason: 'invalid_parameters',
                    message: 'sap_order_id y material_id son requeridos'
                };
            }
            
            // Obtener orden
            const orden = this.ordenesService.getBySapOrderId(sapOrderId);
            
            if (!orden) {
                console.log(`⚠️ No se encontró orden con sap_order_id: ${sapOrderId}`);
                return { 
                    success: false, 
                    vendor_sku: null, 
                    reason: 'orden_not_found',
                    message: `Orden no encontrada: ${sapOrderId}`
                };
            }
            
            if (!orden.details || !Array.isArray(orden.details)) {
                console.log(`⚠️ Orden sin detalles: ${sapOrderId}`);
                return { 
                    success: false, 
                    vendor_sku: null, 
                    reason: 'no_order_details',
                    message: `Orden sin detalles: ${sapOrderId}`
                };
            }
            
            console.log(`📦 Orden encontrada con ${orden.details.length} detalles`);
            
            // Buscar material_id en detalles de orden
            const matchingDetail = orden.details.find(detail => detail.materialId === materialId);
            
            if (matchingDetail) {
                console.log(`✅ Material encontrado: vendor_sku=${matchingDetail.vendorSku}`);
                return {
                    success: true,
                    vendor_sku: matchingDetail.vendorSku,
                    reason: 'found',
                    message: `Material encontrado con vendor_sku: ${matchingDetail.vendorSku}`,
                    total_details_checked: orden.details.length,
                    matching_detail: {
                        vendorSku: matchingDetail.vendorSku,
                        materialId: matchingDetail.materialId,
                        title: matchingDetail.title,
                        unitPrice: matchingDetail.unitPrice,
                        quantity: matchingDetail.quantity
                    }
                };
            } else {
                console.log(`❌ Material no encontrado en orden: ${materialId}`);
                return {
                    success: false,
                    vendor_sku: null,
                    reason: 'material_not_in_orden',
                    message: `Material ${materialId} no está en la orden ${sapOrderId}`,
                    total_details_checked: orden.details.length
                };
            }
            
        } catch (error) {
            console.error('❌ Error en FindOrdenDetailsByMaterialUseCase:', error);
            return { 
                success: false, 
                vendor_sku: null, 
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
            name: 'FindOrdenDetailsByMaterialUseCase',
            description: 'Busca vendor_sku en orden usando material_id',
            dependencies: ['OrdenesService'],
            version: '1.0.0'
        };
    }
}

// 🚀 INICIALIZACIÓN LAZY
Object.defineProperty(window, 'findOrdenDetailsByMaterialUseCase', {
    get: function() {
        if (this._findOrdenDetailsByMaterialInstance) {
            return this._findOrdenDetailsByMaterialInstance;
        }
        
        if (!window.ordenesService) {
            throw new Error('ordenesService no está disponible para FindOrdenDetailsByMaterialUseCase');
        }
        
        console.debug('🏗️ FindOrdenDetailsByMaterialUseCase inicializado');
        this._findOrdenDetailsByMaterialInstance = new FindOrdenDetailsByMaterialUseCase(window.ordenesService);
        return this._findOrdenDetailsByMaterialInstance;
    },
    configurable: true
});

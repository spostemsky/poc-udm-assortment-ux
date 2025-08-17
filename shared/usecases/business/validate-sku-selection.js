/**
 * ValidateSkuSelectionUseCase - Caso de uso para validar selección de SKU
 * Utiliza Data Services para realizar validaciones de negocio
 */
class ValidateSkuSelectionUseCase {
    constructor() {
        // Los servicios se acceden globalmente
    }

    /**
     * Ejecuta la validación de selección de SKU
     * @param {string} vendorSkuFactura - SKU del vendor desde la factura
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object|null} Información del SKU si hay coincidencia exacta, null si no
     */
    execute(vendorSkuFactura, numeroOrdenCompra) {
        try {
            // Verificar que los servicios estén disponibles
            if (!window.ordenesService) {
                console.warn('OrdenesService no disponible, usando fallback');
                return this.fallbackValidation(vendorSkuFactura, numeroOrdenCompra);
            }

            // Buscar la orden correspondiente
            const ordenCorrespondiente = window.ordenesService.findBySapOrderId(numeroOrdenCompra);
            
            if (!ordenCorrespondiente) {
                console.log(`No se encontró orden con SAP Order ID: ${numeroOrdenCompra}`);
                return null;
            }

            // Buscar coincidencia exacta en los detalles de la orden
            const skuInfo = window.ordenesService.getSkuInfo(numeroOrdenCompra, vendorSkuFactura);
            
            if (skuInfo) {
                console.log(`✅ Coincidencia exacta encontrada para SKU: ${vendorSkuFactura}`);
                return skuInfo;
            }

            console.log(`No hay coincidencia exacta para SKU: ${vendorSkuFactura} en orden: ${numeroOrdenCompra}`);
            return null;

        } catch (error) {
            console.error('Error en ValidateSkuSelectionUseCase:', error);
            return this.fallbackValidation(vendorSkuFactura, numeroOrdenCompra);
        }
    }

    /**
     * Método de fallback si los servicios no están disponibles
     * @param {string} vendorSkuFactura - SKU del vendor desde la factura
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object|null} Información del SKU o null
     */
    fallbackValidation(vendorSkuFactura, numeroOrdenCompra) {
        try {
            // Acceso directo a localStorage como fallback
            const ordenesData = localStorage.getItem('poc_data_ordenes');
            if (!ordenesData) return null;

            const ordenes = JSON.parse(ordenesData);
            const ordenCorrespondiente = ordenes.find(o => o.sapOrderId === numeroOrdenCompra);
            
            if (!ordenCorrespondiente || !ordenCorrespondiente.details) {
                return null;
            }

            const coincidencia = ordenCorrespondiente.details.find(detail =>
                detail.vendorSku === vendorSkuFactura
            );

            if (coincidencia) {
                return {
                    value: coincidencia.vendorSku,
                    text: coincidencia.vendorSku,
                    description: coincidencia.item?.title || 'Sin descripción',
                    unitPrice: coincidencia.unitPrice,
                    materialId: coincidencia.materialId,
                    quantity: coincidencia.quantity,
                    esCoincidenciaExacta: true
                };
            }

            return null;
        } catch (error) {
            console.error('Error en fallback validation:', error);
            return null;
        }
    }

    /**
     * Valida si un SKU está disponible para selección
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @param {string} vendorSku - SKU a validar
     * @param {Array} excludeSkus - SKUs ya seleccionados a excluir
     * @returns {boolean} True si está disponible, false si no
     */
    isSkuAvailable(numeroOrdenCompra, vendorSku, excludeSkus = []) {
        if (!window.ordenesService) {
            return true; // Fallback permisivo
        }

        // Verificar que el SKU existe en la orden
        const skuInfo = window.ordenesService.getSkuInfo(numeroOrdenCompra, vendorSku);
        if (!skuInfo) {
            return false;
        }

        // Verificar que no esté ya seleccionado
        return !excludeSkus.includes(vendorSku);
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.validateSkuSelectionUseCase = new ValidateSkuSelectionUseCase();
}
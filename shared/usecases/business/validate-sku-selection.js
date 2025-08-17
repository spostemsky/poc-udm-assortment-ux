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
        // Verificar que los servicios estén disponibles
        if (!window.ordenesService) {
            throw new Error('OrdenesService no está disponible - verificar carga de Data Services');
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
            throw new Error('OrdenesService no está disponible - verificar carga de Data Services');
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
/**
 * GetAvailableSkusUseCase - Caso de uso para obtener SKUs disponibles
 * Utiliza Data Services para obtener SKUs filtrados
 */
class GetAvailableSkusUseCase {
    constructor() {
        // Los servicios se acceden globalmente
    }

    /**
     * Ejecuta la obtención de SKUs disponibles para una orden
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @param {Array} currentSelectedSkus - SKUs actualmente seleccionados
     * @returns {Object} Resultado con success y lista de SKUs
     */
    execute(numeroOrdenCompra, currentSelectedSkus = []) {
        try {
            // Verificar que los servicios estén disponibles
            if (!window.ordenesService) {
                console.warn('OrdenesService no disponible, usando fallback');
                return this.fallbackGetSkus(numeroOrdenCompra, currentSelectedSkus);
            }

            // Obtener SKUs disponibles excluyendo los ya seleccionados
            const skusPermitidos = window.ordenesService.getAvailableSkus(
                numeroOrdenCompra, 
                currentSelectedSkus
            );

            console.log(`✅ SKUs disponibles para orden ${numeroOrdenCompra}:`, skusPermitidos.length);
            
            return { 
                success: true, 
                skus: skusPermitidos,
                message: `${skusPermitidos.length} SKUs disponibles`
            };

        } catch (error) {
            console.error('Error en GetAvailableSkusUseCase:', error);
            return this.fallbackGetSkus(numeroOrdenCompra, currentSelectedSkus);
        }
    }

    /**
     * Obtiene todos los SKUs sin filtrar
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object} Resultado con success y lista de SKUs
     */
    getAllSkus(numeroOrdenCompra) {
        try {
            if (!window.ordenesService) {
                return this.fallbackGetAllSkus(numeroOrdenCompra);
            }

            const allSkus = window.ordenesService.getAllAvailableSkus(numeroOrdenCompra);
            
            return { 
                success: true, 
                skus: allSkus,
                message: `${allSkus.length} SKUs totales`
            };

        } catch (error) {
            console.error('Error obteniendo todos los SKUs:', error);
            return this.fallbackGetAllSkus(numeroOrdenCompra);
        }
    }

    /**
     * Obtiene los SKUs actualmente seleccionados en el formulario
     * @returns {Array} Lista de SKUs seleccionados
     */
    getCurrentSelectedSkus() {
        try {
            const allSections = document.querySelectorAll('.container:not(.item-container-template) .sections-container .section[style*="block"]');
            const valoresSeleccionados = [];

            allSections.forEach(section => {
                const dropdown = section.querySelector('.custom-dropdown');
                const selectedValue = dropdown?.getAttribute('data-value');
                
                if (selectedValue && selectedValue !== 'Otro') {
                    valoresSeleccionados.push(selectedValue);
                }
            });

            return valoresSeleccionados;
        } catch (error) {
            console.error('Error obteniendo SKUs seleccionados:', error);
            return [];
        }
    }

    /**
     * Método de fallback para obtener SKUs disponibles
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @param {Array} currentSelectedSkus - SKUs actualmente seleccionados
     * @returns {Object} Resultado con success y lista de SKUs
     */
    fallbackGetSkus(numeroOrdenCompra, currentSelectedSkus = []) {
        try {
            const ordenesData = localStorage.getItem('poc_data_ordenes');
            if (!ordenesData) {
                return { success: false, message: 'No hay datos de órdenes', skus: [] };
            }

            const ordenes = JSON.parse(ordenesData);
            const orden = ordenes.find(o => o.sapOrderId === numeroOrdenCompra);
            
            if (!orden || !orden.details) {
                return { success: false, message: 'Orden no encontrada', skus: [] };
            }

            const skusPermitidos = orden.details
                .filter(detail => !currentSelectedSkus.includes(detail.vendorSku))
                .map(detail => ({
                    value: detail.vendorSku,
                    text: detail.vendorSku,
                    description: detail.item?.title || 'Sin descripción',
                    unitPrice: detail.unitPrice,
                    materialId: detail.materialId,
                    quantity: detail.quantity
                }));

            // Agregar opción "Otro"
            skusPermitidos.push({ value: 'Otro', text: 'Otro', description: '' });

            return { success: true, skus: skusPermitidos };

        } catch (error) {
            console.error('Error en fallback get SKUs:', error);
            return { success: false, message: error.message, skus: [] };
        }
    }

    /**
     * Método de fallback para obtener todos los SKUs
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object} Resultado con success y lista de SKUs
     */
    fallbackGetAllSkus(numeroOrdenCompra) {
        try {
            const ordenesData = localStorage.getItem('poc_data_ordenes');
            if (!ordenesData) {
                return { success: false, message: 'No hay datos de órdenes', skus: [] };
            }

            const ordenes = JSON.parse(ordenesData);
            const orden = ordenes.find(o => o.sapOrderId === numeroOrdenCompra);
            
            if (!orden || !orden.details) {
                return { success: false, message: 'Orden no encontrada', skus: [] };
            }

            const allSkus = orden.details.map(detail => ({
                value: detail.vendorSku,
                text: detail.vendorSku,
                description: detail.item?.title || 'Sin descripción',
                unitPrice: detail.unitPrice,
                materialId: detail.materialId,
                quantity: detail.quantity
            }));

            // Agregar opción "Otro"
            allSkus.push({ value: 'Otro', text: 'Otro', description: '' });

            return { success: true, skus: allSkus };

        } catch (error) {
            console.error('Error en fallback get all SKUs:', error);
            return { success: false, message: error.message, skus: [] };
        }
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.getAvailableSkusUseCase = new GetAvailableSkusUseCase();
}

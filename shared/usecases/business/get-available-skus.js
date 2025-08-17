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
        // Verificar que los servicios estén disponibles
        if (!window.ordenesService) {
            throw new Error('OrdenesService no está disponible - verificar carga de Data Services');
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
    }

    /**
     * Obtiene todos los SKUs sin filtrar
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object} Resultado con success y lista de SKUs
     */
    getAllSkus(numeroOrdenCompra) {
        if (!window.ordenesService) {
            throw new Error('OrdenesService no está disponible - verificar carga de Data Services');
        }

        const allSkus = window.ordenesService.getAllAvailableSkus(numeroOrdenCompra);
        
        return { 
            success: true, 
            skus: allSkus,
            message: `${allSkus.length} SKUs totales`
        };
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


}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.getAvailableSkusUseCase = new GetAvailableSkusUseCase();
}

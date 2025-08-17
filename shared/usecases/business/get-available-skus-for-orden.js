/**
 * Caso de Uso: Obtener SKUs Disponibles para Orden
 * Obtiene los SKUs permitidos para una orden específica y filtra los ya seleccionados
 */
class GetAvailableSkusForOrdenUseCase {
    constructor(ordenesRepository) {
        this.ordenesRepository = ordenesRepository;
    }

    /**
     * Ejecutar obtención de SKUs disponibles
     * @param {string} numeroOrdenCompra - Número de orden de compra (SAP Order ID)
     * @param {Array} skusSeleccionados - Array de SKUs ya seleccionados en otros dropdowns
     * @param {string} skuActual - SKU actualmente seleccionado (se permite aunque esté en la lista)
     * @returns {Object} Resultado con SKUs disponibles
     */
    execute(numeroOrdenCompra, skusSeleccionados = [], skuActual = '') {
        console.log(`🎯 Obteniendo SKUs disponibles para orden: ${numeroOrdenCompra}`);
        console.log(`📋 SKUs seleccionados:`, skusSeleccionados);
        console.log(`🔍 SKU actual:`, skuActual);

        // Validar parámetros
        if (!numeroOrdenCompra) {
            console.error('❌ Número de orden de compra requerido');
            return {
                success: false,
                message: 'Número de orden de compra requerido',
                skus: [],
                availableOptions: []
            };
        }

        // Obtener todos los SKUs de la orden
        const todosLosSkus = this.ordenesRepository.getVendorSkusBySapOrderId(numeroOrdenCompra);

        if (todosLosSkus.length === 0) {
            console.warn(`⚠️ No se encontraron SKUs para orden: ${numeroOrdenCompra}`);
            return {
                success: false,
                message: `No hay SKUs disponibles para la orden ${numeroOrdenCompra}`,
                skus: [],
                availableOptions: []
            };
        }

        // Filtrar SKUs disponibles
        const skusDisponibles = this.filterAvailableSkus(todosLosSkus, skusSeleccionados, skuActual);

        // Preparar opciones para dropdown
        const availableOptions = this.prepareDropdownOptions(skusDisponibles);

        console.log(`✅ SKUs procesados: ${skusDisponibles.length}/${todosLosSkus.length} disponibles`);

        return {
            success: true,
            message: `${skusDisponibles.length} SKUs disponibles`,
            skus: skusDisponibles,
            availableOptions: availableOptions,
            totalSkus: todosLosSkus.length,
            filteredCount: skusDisponibles.length
        };
    }

    /**
     * Filtrar SKUs disponibles (excluir ya seleccionados)
     * @param {Array} todosLosSkus - Todos los SKUs de la orden
     * @param {Array} skusSeleccionados - SKUs ya seleccionados
     * @param {string} skuActual - SKU actual (permitido)
     * @returns {Array} SKUs filtrados
     */
    filterAvailableSkus(todosLosSkus, skusSeleccionados, skuActual) {
        return todosLosSkus.filter(sku => {
            // Permitir el SKU actual aunque esté seleccionado
            if (sku.value === skuActual) {
                return true;
            }
            
            // Excluir SKUs ya seleccionados
            return !skusSeleccionados.includes(sku.value);
        });
    }

    /**
     * Preparar opciones para dropdown personalizado
     * @param {Array} skusDisponibles - SKUs disponibles
     * @returns {Array} Opciones formateadas para dropdown
     */
    prepareDropdownOptions(skusDisponibles) {
        const options = skusDisponibles.map(sku => ({
            value: sku.value,
            text: sku.text,
            description: sku.description || '',
            // Información adicional para uso interno
            unitPrice: sku.unitPrice,
            materialId: sku.materialId,
            quantity: sku.quantity
        }));

        // Agregar opción "Otro" al final
        options.push({
            value: 'Otro',
            text: 'Otro',
            description: 'Seleccionar otro producto no listado'
        });

        return options;
    }

    /**
     * Obtener todos los SKUs seleccionados actualmente en el DOM
     * @returns {Array} Array de SKUs seleccionados
     */
    getCurrentSelectedSkus() {
        const allSections = document.querySelectorAll('.container:not(.item-container-template) .sections-container .section[style*="block"]');
        const valoresSeleccionados = [];

        allSections.forEach(section => {
            // Saltar secciones con SKU forzado (restricciones del Business Rules Engine)
            if (section.hasAttribute('data-sku-forzado')) {
                console.log('🔒 Saltando sección con SKU forzado:', section.getAttribute('data-sku-forzado'));
                return;
            }

            const dropdown = section.querySelector('.custom-dropdown');
            const selectedValue = dropdown?.getAttribute('data-value');
            
            if (selectedValue && selectedValue !== 'Otro' && selectedValue !== '') {
                valoresSeleccionados.push(selectedValue);
            }
        });

        console.log(`📊 SKUs actualmente seleccionados:`, valoresSeleccionados);
        return valoresSeleccionados;
    }

    /**
     * Actualizar opciones de un dropdown específico
     * @param {HTMLElement} dropdownElement - Elemento dropdown a actualizar
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @param {string} valorActual - Valor actualmente seleccionado
     * @returns {boolean} true si se actualizó correctamente
     */
    updateDropdownOptions(dropdownElement, numeroOrdenCompra, valorActual = '') {
        try {
            // Obtener SKUs seleccionados (excluyendo el dropdown actual)
            const skusSeleccionados = this.getCurrentSelectedSkus().filter(sku => sku !== valorActual);

            // Obtener opciones disponibles
            const result = this.execute(numeroOrdenCompra, skusSeleccionados, valorActual);

            if (!result.success) {
                console.error('❌ Error obteniendo SKUs disponibles:', result.message);
                return false;
            }

            // Actualizar dropdown usando función global (temporal - se refactorizará)
            if (typeof populateCustomDropdown === 'function') {
                populateCustomDropdown(dropdownElement, result.availableOptions, valorActual);
            } else {
                console.error('❌ Función populateCustomDropdown no disponible');
                return false;
            }

            console.log(`✅ Dropdown actualizado con ${result.availableOptions.length} opciones`);
            return true;

        } catch (error) {
            console.error('❌ Error actualizando dropdown:', error);
            return false;
        }
    }

    /**
     * Validar que una orden tiene SKUs disponibles
     * @param {string} numeroOrdenCompra - Número de orden de compra
     * @returns {Object} Resultado de la validación
     */
    validateOrdenHasSkus(numeroOrdenCompra) {
        const orden = this.ordenesRepository.findBySapOrderId(numeroOrdenCompra);
        
        if (!orden) {
            return {
                isValid: false,
                message: `Orden ${numeroOrdenCompra} no encontrada`
            };
        }

        const skus = this.ordenesRepository.getVendorSkusBySapOrderId(numeroOrdenCompra);
        
        return {
            isValid: skus.length > 0,
            message: skus.length > 0 
                ? `Orden tiene ${skus.length} SKUs disponibles`
                : 'Orden no tiene SKUs disponibles',
            skuCount: skus.length
        };
    }

    /**
     * Obtener información del caso de uso
     * @returns {Object} Información del caso de uso
     */
    getInfo() {
        return {
            name: 'GetAvailableSkusForOrdenUseCase',
            description: 'Obtiene SKUs disponibles para una orden, filtrando los ya seleccionados',
            dependencies: ['OrdenesRepository', 'DOM']
        };
    }
}

// Crear instancia global
window.getAvailableSkusForOrdenUseCase = new GetAvailableSkusForOrdenUseCase(
    window.ordenesRepository
);

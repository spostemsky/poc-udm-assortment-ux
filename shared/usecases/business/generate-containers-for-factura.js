/**
 * Caso de Uso: Generar Contenedores para Factura
 * Crea contenedores de UI dinámicos por cada ítem de una factura
 */
class GenerateContainersForFacturaUseCase {
    constructor(facturasService) {
        this.facturasService = facturasService;
    }

    /**
     * Ejecutar generación de contenedores
     * @param {string} externalId - External ID de la factura
     * @returns {Object} Resultado de la generación
     */
    execute(externalId) {
        console.log(`🏗️ Generando contenedores para factura: ${externalId}`);

        // Obtener items de la factura
        const itemsFactura = this.facturasService.getItemsByExternalId(externalId);
        
        if (itemsFactura.length === 0) {
            console.warn(`⚠️ No se encontraron items para factura: ${externalId}`);
            return {
                success: false,
                message: 'No hay items en la factura',
                containers: []
            };
        }

        // Limpiar contenedores existentes
        this.clearExistingContainers();

        // Crear contenedores
        const containers = [];
        const containersWrapper = document.getElementById('containers-wrapper');
        const template = containersWrapper?.querySelector('.item-container-template');

        if (!containersWrapper || !template) {
            console.error('❌ No se encontró contenedor wrapper o template');
            return {
                success: false,
                message: 'Error: Template de contenedor no encontrado',
                containers: []
            };
        }

        // Generar un contenedor por cada ítem
        itemsFactura.forEach((item, index) => {
            const containerData = this.createContainerForItem(item, index, template, containersWrapper);
            if (containerData) {
                containers.push(containerData);
            }
        });

        console.log(`✅ Se generaron ${containers.length} contenedores para factura ${externalId}`);

        return {
            success: true,
            message: `Se crearon ${containers.length} contenedores`,
            containers: containers,
            itemsCount: itemsFactura.length
        };
    }

    /**
     * Crear contenedor individual para un item
     * @param {Object} item - Item de la factura
     * @param {number} index - Índice del item
     * @param {HTMLElement} template - Template del contenedor
     * @param {HTMLElement} wrapper - Contenedor wrapper
     * @returns {Object} Datos del contenedor creado
     */
    createContainerForItem(item, index, template, wrapper) {
        try {
            // Clonar template
            const newContainer = template.cloneNode(true);
            newContainer.classList.remove('item-container-template');
            newContainer.style.display = 'block';

            // Configurar identificadores únicos
            const containerId = `item-container-${index}`;
            newContainer.id = containerId;

            // Actualizar título y descripción
            this.updateContainerContent(newContainer, item);

            // Actualizar IDs de elementos internos
            this.updateContainerIds(newContainer, index);

            // Agregar al DOM
            wrapper.appendChild(newContainer);

            // 🚀 CRÍTICO: Inicializar contenedor (Business Rules Engine + UI)
            // Esta función debe estar disponible globalmente desde formulario.js
            if (typeof window.inicializarContenedor === 'function') {
                window.inicializarContenedor(newContainer, index, item.identificadorItem);
                console.log(`🎯 Contenedor inicializado con Business Rules para ítem: ${item.identificadorItem}`);
            } else {
                console.warn(`⚠️ inicializarContenedor no disponible para ítem: ${item.identificadorItem}`);
            }

            console.log(`📦 Contenedor creado para ítem: ${item.identificadorItem}`);

            return {
                id: containerId,
                itemId: item.identificadorItem,
                description: item.descripcion,
                sapOrderId: item.sap_order_id,
                element: newContainer,
                item: item
            };

        } catch (error) {
            console.error(`❌ Error creando contenedor para item ${item.identificadorItem}:`, error);
            return null;
        }
    }

    /**
     * Actualizar contenido del contenedor (título y descripción)
     * @param {HTMLElement} container - Contenedor a actualizar
     * @param {Object} item - Item de la factura
     */
    updateContainerContent(container, item) {
        const titleElement = container.querySelector('.item-title');
        const descriptionElement = container.querySelector('.item-description');

        if (titleElement) {
            titleElement.textContent = `SKU en la factura: #${item.identificadorItem}`;
        }

        if (descriptionElement) {
            descriptionElement.textContent = item.descripcion || 'Sin descripción disponible';
        }
    }

    /**
     * Actualizar IDs únicos de elementos internos
     * @param {HTMLElement} container - Contenedor a actualizar
     * @param {number} index - Índice para generar IDs únicos
     */
    updateContainerIds(container, index) {
        const multipleProductsSelect = container.querySelector('.multiple-products-select');
        const sectionsContainer = container.querySelector('.sections-container');

        if (multipleProductsSelect) {
            multipleProductsSelect.id = `multiple-products-select-${index}`;
        }

        if (sectionsContainer) {
            sectionsContainer.id = `sections-container-${index}`;
        }
    }

    /**
     * Limpiar contenedores existentes (excepto template)
     */
    clearExistingContainers() {
        const containersWrapper = document.getElementById('containers-wrapper');
        if (containersWrapper) {
            const existingContainers = containersWrapper.querySelectorAll('.container:not(.item-container-template)');
            existingContainers.forEach(container => container.remove());
            console.log(`🧹 Limpiados ${existingContainers.length} contenedores existentes`);
        }
    }

    /**
     * Obtener información de contenedores actuales
     * @returns {Array} Array con información de contenedores
     */
    getCurrentContainers() {
        const containersWrapper = document.getElementById('containers-wrapper');
        if (!containersWrapper) return [];

        const containers = containersWrapper.querySelectorAll('.container:not(.item-container-template)');
        return Array.from(containers).map((container, index) => {
            const titleElement = container.querySelector('.item-title');
            const itemId = titleElement ? titleElement.textContent.split('#')[1] : `unknown-${index}`;

            return {
                id: container.id,
                itemId: itemId,
                element: container,
                index: index
            };
        });
    }

    /**
     * Validar que los contenedores se generaron correctamente
     * @param {string} externalId - External ID de la factura
     * @returns {Object} Resultado de la validación
     */
    validateGeneration(externalId) {
        const itemsFactura = this.facturasService.getItemsByExternalId(externalId);
        const currentContainers = this.getCurrentContainers();

        const isValid = itemsFactura.length === currentContainers.length;

        return {
            isValid: isValid,
            expectedCount: itemsFactura.length,
            actualCount: currentContainers.length,
            message: isValid 
                ? 'Contenedores generados correctamente' 
                : `Discrepancia: esperados ${itemsFactura.length}, generados ${currentContainers.length}`
        };
    }

    /**
     * Obtener información del caso de uso
     * @returns {Object} Información del caso de uso
     */
    getInfo() {
        return {
            name: 'GenerateContainersForFacturaUseCase',
            description: 'Genera contenedores dinámicos para cada ítem de una factura',
            dependencies: ['FacturasService', 'DOM', 'inicializarContenedor']
        };
    }
}

// 🚀 INICIALIZACIÓN SIMPLIFICADA: Crear instancia lazy cuando se necesite
// La instancia se creará automáticamente cuando se acceda por primera vez
Object.defineProperty(window, 'generateContainersForFacturaUseCase', {
    get: function() {
        // Si ya existe la instancia, devolverla
        if (this._generateContainersInstance) {
            return this._generateContainersInstance;
        }
        
        // Verificar que facturasService esté disponible (SIN FALLBACKS)
        if (!window.facturasService) {
            throw new Error('facturasService no está disponible para GenerateContainersForFacturaUseCase');
        }
        
        // Crear y cachear la instancia
        console.debug('🏗️ GenerateContainersForFacturaUseCase inicializado');
        this._generateContainersInstance = new GenerateContainersForFacturaUseCase(window.facturasService);
        return this._generateContainersInstance;
    },
    configurable: true
});

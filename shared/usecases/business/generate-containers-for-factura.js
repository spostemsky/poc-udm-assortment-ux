/**
 * Caso de Uso: Generar Contenedores para Factura
 * Crea contenedores de UI dinámicos por cada ítem de una factura
 * INTEGRADO con BatchSkuAnalysisUseCase y Business Rules Engine
 */
class GenerateContainersForFacturaUseCase {
    constructor(facturasService, batchSkuAnalysisUseCase) {
        this.facturasService = facturasService;
        this.batchSkuAnalysisUseCase = batchSkuAnalysisUseCase;
    }

    /**
     * Ejecutar generación de contenedores
     * @param {string} externalId - External ID de la factura
     * @returns {Object} Resultado de la generación
     */
    async execute(externalId) {
        console.log(`🏗️ Generando contenedores para factura: ${externalId}`);

        // Obtener datos completos de la factura
        const factura = this.facturasService.getByExternalId(externalId);
        if (!factura) {
            console.warn(`⚠️ No se encontró factura: ${externalId}`);
            return {
                success: false,
                message: 'Factura no encontrada',
                containers: []
            };
        }

        // Obtener items de la factura (usando 'details' según tu estructura real)
        const allItems = factura.details || [];
        
        if (allItems.length === 0) {
            console.warn(`⚠️ No se encontraron items para factura: ${externalId}`);
            return {
                success: false,
                message: 'No hay items en la factura',
                containers: []
            };
        }

        console.log(`📊 Iniciando análisis de ${allItems.length} items...`);

        // 🧠 PASO 1: ANÁLISIS BATCH DE TODOS LOS ITEMS
        const itemsConVendorId = allItems.map((item, index) => ({
            ...item,
            identificadorItem: item.ean || item.vendor_sku || item.id,
            vendor_id: 557445679, // Usar vendor_id consistente (deberías obtenerlo de la factura)
            vendor_sku: item.vendor_sku
        }));

        const analysisResults = await this.batchSkuAnalysisUseCase.execute(
            externalId,
            itemsConVendorId,
            factura.sap_order_id
        );

        if (!analysisResults.success) {
            console.error('❌ Error en análisis batch:', analysisResults.error);
            return {
                success: false,
                message: `Error en análisis: ${analysisResults.error}`,
                containers: []
            };
        }

        console.log(`📊 Análisis completado: ${analysisResults.statistics.direct_matches} directos, ${analysisResults.statistics.cascade_matches} cascada, ${analysisResults.statistics.filtered} filtrados`);

        // 🧠 PASO 2: BRE FILTRA ITEMS (ANTES DE CREAR CONTENEDORES)
        const filteredItems = this.applyBusinessRulesFiltering(itemsConVendorId, analysisResults);
        
        console.log(`🔍 Items después del filtrado BRE: ${filteredItems.length}/${allItems.length}`);

        // Limpiar contenedores existentes
        this.clearExistingContainers();

        // 🏗️ PASO 3: CREAR CONTENEDORES (SOLO ITEMS NO FILTRADOS)
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

        // Generar contenedores solo para items no filtrados
        // Usar los items originales de la factura, no los procesados
        const originalItemsMap = new Map(allItems.map(item => [item.vendor_sku, item]));
        
        filteredItems.forEach((processedItem, index) => {
            const originalItem = originalItemsMap.get(processedItem.vendor_sku);
            const itemAnalysis = analysisResults.results.get(processedItem.identificadorItem);
            
            // Usar item original para display, pero mantener análisis del procesado
            const containerData = this.createContainerForItem(originalItem, index, template, containersWrapper, itemAnalysis);
            if (containerData) {
                containers.push(containerData);
            }
        });

        console.log(`✅ Se generaron ${containers.length} contenedores para factura ${externalId}`);

        return {
            success: true,
            message: `Se crearon ${containers.length} contenedores (${allItems.length - filteredItems.length} filtrados por BRE)`,
            containers: containers,
            itemsCount: allItems.length,
            filteredCount: allItems.length - filteredItems.length,
            analysisResults: analysisResults
        };
    }

    /**
     * Aplicar filtrado de Business Rules antes de crear contenedores
     * @param {Array} items - Items a filtrar
     * @param {Object} analysisResults - Resultados del análisis batch
     * @returns {Array} Items no filtrados
     */
    applyBusinessRulesFiltering(items, analysisResults) {
        // Si no hay Business Rules Engine, no filtrar nada
        if (!window.businessRulesEngine) {
            console.warn('⚠️ Business Rules Engine no disponible, no se aplicará filtrado');
            return items;
        }

        const filteredItems = [];

        items.forEach(item => {
            const itemAnalysis = analysisResults.results.get(item.identificadorItem);
            
            // Verificar si el BRE dice que este item debe ser filtrado
            const shouldFilter = this.shouldFilterItem(item, itemAnalysis);
            
            if (!shouldFilter) {
                filteredItems.push(item);
            } else {
                console.log(`🚫 Item filtrado por BRE: ${item.identificadorItem}`);
            }
        });

        return filteredItems;
    }

    /**
     * Determinar si un item debe ser filtrado según las reglas BRE
     * @param {Object} item - Item a evaluar
     * @param {Object} itemAnalysis - Análisis del item
     * @returns {boolean} True si debe filtrarse
     */
    shouldFilterItem(item, itemAnalysis) {
        if (!window.businessRulesEngine || !itemAnalysis) {
            return false;
        }

        // Crear contexto para evaluación de reglas
        const context = {
            item: item,
            analysis_result: itemAnalysis,
            should_filter: itemAnalysis.should_filter || false
        };

        // Evaluar reglas de filtrado (priority: 2)
        // Solo evaluar reglas que están activas y son de tipo filtrado
        try {
            const filterRules = window.businessRulesEngine.getActiveRulesByType('filter');
            
            for (const rule of filterRules) {
                const conditionMet = window.businessRulesEngine.queryEngine.evaluateCondition(rule.when, context);
                if (conditionMet) {
                    console.log(`🔍 Regla de filtrado aplicada: ${rule.id} para item ${item.identificadorItem}`);
                    return true; // Item debe ser filtrado
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error evaluando reglas de filtrado para ${item.identificadorItem}:`, error);
        }

        return false; // No filtrar por defecto
    }

    /**
     * Crear contenedor individual para un item
     * @param {Object} item - Item de la factura
     * @param {number} index - Índice del item
     * @param {HTMLElement} template - Template del contenedor
     * @param {HTMLElement} wrapper - Contenedor wrapper
     * @param {Object} itemAnalysis - Análisis del item del BatchSkuAnalysisUseCase
     * @returns {Object} Datos del contenedor creado
     */
    createContainerForItem(item, index, template, wrapper, itemAnalysis) {
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

            // 📊 AGREGAR DATOS DEL ANÁLISIS AL CONTENEDOR
            if (itemAnalysis) {
                newContainer.setAttribute('data-analysis-status', itemAnalysis.status);
                newContainer.setAttribute('data-analysis-should-filter', itemAnalysis.should_filter);
                newContainer.setAttribute('data-analysis-should-preselect-cascade', itemAnalysis.should_preselect_cascade);
                newContainer.setAttribute('data-analysis-should-show-normal', itemAnalysis.should_show_normal);
                newContainer.setAttribute('data-analysis-has-direct-match', itemAnalysis.has_direct_match);
                
                if (itemAnalysis.matched_vendor_sku) {
                    newContainer.setAttribute('data-analysis-matched-sku', itemAnalysis.matched_vendor_sku);
                }
            }

            // Agregar al DOM
            wrapper.appendChild(newContainer);

            // 🚀 CRÍTICO: Inicializar contenedor (Business Rules Engine + UI)
            // Esta función debe estar disponible globalmente desde formulario.js
            if (typeof window.inicializarContenedor === 'function') {
                window.inicializarContenedor(newContainer, index, item.identificadorItem);
                console.log(`🎯 Contenedor inicializado con Business Rules para ítem: ${item.identificadorItem} (${itemAnalysis?.status || 'no-analysis'})`);
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
                item: item,
                analysis: itemAnalysis // Incluir análisis en el resultado
            };

        } catch (error) {
            console.error(`❌ Error creando contenedor para item ${item.identificadorItem}:`, error);
            return null;
        }
    }

    /**
     * Actualizar contenido del contenedor (título y descripción)
     * @param {HTMLElement} container - Contenedor a actualizar
     * @param {Object} item - Item de la factura (estructura real de factura.details)
     */
    updateContainerContent(container, item) {
        const titleElement = container.querySelector('.item-title');
        const descriptionElement = container.querySelector('.item-description');

        if (titleElement) {
            // Usar vendor_sku real del item, no identificadorItem procesado
            titleElement.textContent = `SKU en la factura: #${item.vendor_sku}`;
        }

        if (descriptionElement) {
            // Usar description del item real, no descripcion procesado
            descriptionElement.textContent = item.description || 'Sin descripción disponible';
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
            description: 'Genera contenedores dinámicos para cada ítem de una factura con análisis batch y BRE',
            dependencies: ['FacturasService', 'BatchSkuAnalysisUseCase', 'BusinessRulesEngine', 'DOM', 'inicializarContenedor']
        };
    }
}

// 🚀 INICIALIZACIÓN LAZY CON DEPENDENCIAS INTEGRADAS
Object.defineProperty(window, 'generateContainersForFacturaUseCase', {
    get: function() {
        // Si ya existe la instancia, devolverla
        if (this._generateContainersInstance) {
            return this._generateContainersInstance;
        }
        
        // Verificar que todas las dependencias estén disponibles
        if (!window.facturasService) {
            throw new Error('facturasService no está disponible para GenerateContainersForFacturaUseCase');
        }
        
        if (!window.batchSkuAnalysisUseCase) {
            throw new Error('batchSkuAnalysisUseCase no está disponible para GenerateContainersForFacturaUseCase');
        }
        
        // Crear y cachear la instancia con todas las dependencias
        console.debug('🏗️ GenerateContainersForFacturaUseCase inicializado con análisis batch y BRE');
        this._generateContainersInstance = new GenerateContainersForFacturaUseCase(
            window.facturasService,
            window.batchSkuAnalysisUseCase
        );
        return this._generateContainersInstance;
    },
    configurable: true
});

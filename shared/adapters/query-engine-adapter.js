/**
 * 🔌 QUERY ENGINE ADAPTER
 * Adaptador específico del proyecto que configura el GenericQueryEngine
 * con los proveedores de datos y contexto necesarios para este proyecto
 * 
 * 📁 UBICACIÓN: shared/adapters/ (específico del proyecto)
 * 🔗 CONECTA: GenericQueryEngine (genérico) ↔ Project Services (específicos)
 * 
 * ✅ RESPONSABILIDADES:
 * - Configurar data providers usando Data Services del proyecto
 * - Configurar context providers para DOM/estado actual del proyecto
 * - Configurar field resolvers específicos de las reglas del proyecto
 * - Mantener compatibilidad con la API existente del QueryEngine
 */
class ProjectQueryEngineAdapter {
    constructor() {
        this.engine = null;
        this.initialized = false;
    }

    /**
     * 🚀 Inicializar el adapter con configuración específica del proyecto
     */
    initialize() {
        if (this.initialized) {
            return this.engine;
        }

        // ✅ CREAR GENERIC QUERY ENGINE CON CONFIGURACIÓN DEL PROYECTO
        this.engine = new GenericQueryEngine({
            dataProviders: this.createDataProviders(),
            contextProviders: this.createContextProviders(),
            fieldResolvers: this.createFieldResolvers(),
            operators: this.createCustomOperators()
        });

        this.initialized = true;
        console.log('✅ ProjectQueryEngineAdapter inicializado');
        
        return this.engine;
    }

    /**
     * 🔌 Crear proveedores de datos usando Data Services
     * ✅ SIN localStorage directo, SIN fallbacks
     */
    createDataProviders() {
        return {
            facturas: () => {
                if (!window.facturasService) {
                    throw new Error('FacturasService no está disponible');
                }
                return window.facturasService.getAll();
            },
            
            ordenes: () => {
                if (!window.ordenesService) {
                    throw new Error('OrdenesService no está disponible');
                }
                return window.ordenesService.getAll();
            },
            
            ofertas: () => {
                if (!window.ofertasService) {
                    throw new Error('OfertasService no está disponible');
                }
                return window.ofertasService.getAll();
            },
            
            equivalencias: () => {
                if (!window.equivalenciasService) {
                    throw new Error('EquivalenciasService no está disponible');
                }
                return window.equivalenciasService.getAll();
            }
        };
    }

    /**
     * 🔌 Crear proveedores de contexto
     * ✅ Abstraer acceso al DOM
     */
    createContextProviders() {
        return {
            current_factura_id: () => {
                const select = document.getElementById('invoice-select');
                return select ? select.value : null;
            },
            
            current_sap_order_id: () => {
                const facturaId = this.engine.getContext('current_factura_id');
                if (!facturaId) return null;

                const facturas = this.engine.getEntityData('facturas');
                const factura = facturas.find(f => f.external_id === facturaId);
                return factura ? factura.sap_order_id : null;
            },
            
            container_states: () => {
                // Verificar si hay estados guardados en localStorage
                const savedStates = localStorage.getItem('containerStates');
                return savedStates ? JSON.parse(savedStates) : {};
            }
        };
    }

    /**
     * 🔌 Crear resolvers de campos específicos del proyecto
     */
    createFieldResolvers() {
        return {
            // 🔍 RESOLVER: Resultados de análisis batch
            analysis_result: (field, context) => {
                if (!context.container || !context.container.getAttribute) {
                    console.warn('⚠️ Contexto de contenedor no disponible para analysis_result');
                    return null;
                }

                const container = context.container;
                
                switch (field) {
                    case 'should_filter':
                        return container.getAttribute('data-analysis-should-filter') === 'true';
                    case 'should_preselect_cascade':
                        return container.getAttribute('data-analysis-should-preselect-cascade') === 'true';
                    case 'should_show_normal':
                        return container.getAttribute('data-analysis-should-show-normal') === 'true';
                    case 'has_direct_match':
                        return container.getAttribute('data-analysis-has-direct-match') === 'true';
                    case 'status':
                        return container.getAttribute('data-analysis-status');
                    case 'matched_vendor_sku':
                        return container.getAttribute('data-analysis-matched-sku');
                    default:
                        console.warn(`⚠️ Campo de análisis no reconocido: ${field}`);
                        return null;
                }
            },

            // 🔍 RESOLVER: Coincidencia exacta entre campos
            field_match: (condition, context) => {
                try {
                    const sourceEntity = condition.source.entity;
                    const targetEntity = condition.target.entity;
                    
                    const sourceData = this.engine.getEntityData(sourceEntity);
                    const targetData = this.engine.getEntityData(targetEntity);
                    
                    if (!sourceData || !targetData) {
                        console.warn(`⚠️ No se encontraron datos para ${sourceEntity} o ${targetEntity}`);
                        return null;
                    }

                    // Obtener IDs de contexto
                    const currentFacturaId = this.engine.getContext('current_factura_id');
                    const currentSapOrderId = this.engine.getContext('current_sap_order_id');
                    
                    if (!currentFacturaId || !currentSapOrderId) {
                        console.warn('⚠️ No se pudo obtener contexto de factura o SAP Order ID');
                        return null;
                    }

                    // Buscar factura actual
                    const currentFactura = sourceData.find(f => f.external_id === currentFacturaId);
                    if (!currentFactura || !currentFactura.details) {
                        return null;
                    }

                    // Buscar orden correspondiente
                    const targetOrder = targetData.find(o => o.sapOrderId == currentSapOrderId);
                    if (!targetOrder || !targetOrder.details) {
                        return null;
                    }

                    // Buscar coincidencia en el item específico del contexto
                    const itemId = context.itemId;
                    const facturaItem = currentFactura.details.find(item => item.vendor_sku === itemId);
                    
                    if (!facturaItem || !facturaItem.vendor_sku) {
                        return null;
                    }

                    // Buscar coincidencia exacta en la orden
                    const matchingOrderItem = targetOrder.details.find(detail => 
                        detail.vendorSku === facturaItem.vendor_sku
                    );

                    if (matchingOrderItem) {
                        return {
                            value: matchingOrderItem.vendorSku,
                            text: matchingOrderItem.vendorSku,
                            description: matchingOrderItem.item?.title || 'Sin descripción',
                            unitPrice: matchingOrderItem.unitPrice,
                            materialId: matchingOrderItem.materialId,
                            quantity: matchingOrderItem.quantity,
                            esCoincidenciaExacta: true
                        };
                    }

                    return null;

                } catch (error) {
                    console.error('💥 Error evaluando field_match:', error);
                    return null;
                }
            },

            // 🔍 RESOLVER: Posición del contenedor
            container_position: (condition, context) => {
                try {
                    const containerIndex = context.containerIndex || 0;
                    const hasStatesGuardados = context.hasStatesGuardados || false;

                    // Si hay estados guardados, no aplicar regla UX de colapsar
                    if (condition.source.exclude_saved_states && hasStatesGuardados) {
                        console.log('🔍 Container Position: Estados guardados detectados, saltando regla UX');
                        return null;
                    }

                    let matches = false;
                    if (condition.source.position === 'first') {
                        matches = containerIndex === 0;
                    } else if (condition.source.position === 'not_first') {
                        matches = containerIndex > 0;
                    } else if (condition.source.position === 'last') {
                        matches = false; // Por implementar
                    }

                    console.log(`🔍 Container Position: index=${containerIndex}, position=${condition.source.position}, matches=${matches}`);

                    return matches ? { matched: true, containerIndex, position: condition.source.position } : null;

                } catch (error) {
                    console.error('💥 Error evaluando container position:', error);
                    return null;
                }
            }
        };
    }

    /**
     * 🔌 Crear operadores personalizados del proyecto
     */
    createCustomOperators() {
        return {
            // Operadores específicos del proyecto pueden agregarse aquí
            'vendor_sku_match': (vendorSkuA, vendorSkuB) => {
                // Normalizar SKUs para comparación
                const normalize = (sku) => sku ? sku.toString().trim().toLowerCase() : '';
                return normalize(vendorSkuA) === normalize(vendorSkuB);
            }
        };
    }

    /**
     * 🔍 Evaluar condición (API compatible con QueryEngine original)
     * @param {Object} condition - Condición a evaluar
     * @param {Object} context - Contexto de evaluación
     * @returns {*} Resultado de la evaluación
     */
    evaluateCondition(condition, context) {
        if (!this.initialized) {
            this.initialize();
        }
        
        return this.engine.evaluateCondition(condition, context);
    }

    /**
     * 🔍 Obtener datos de entidad (API compatible)
     */
    getEntityData(entityName) {
        if (!this.initialized) {
            this.initialize();
        }
        
        return this.engine.getEntityData(entityName);
    }

    /**
     * 🔍 Obtener contexto (API compatible)
     */
    getContext(contextName) {
        if (!this.initialized) {
            this.initialize();
        }
        
        return this.engine.getContext(contextName);
    }

    // 📝 MÉTODOS LEGACY PARA COMPATIBILIDAD (serán deprecated)
    getCurrentFacturaId() {
        return this.getContext('current_factura_id');
    }

    getCurrentSapOrderId() {
        return this.getContext('current_sap_order_id');
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.ProjectQueryEngineAdapter = ProjectQueryEngineAdapter;
}

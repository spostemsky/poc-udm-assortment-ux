/**
 * 🚀 Caso de Uso Coordinador: Análisis Batch de SKUs
 * Procesa TODOS los items de una factura de forma paralela y optimizada
 * Integra lógica de match directo + cascada
 */
class BatchSkuAnalysisUseCase {
    constructor(validateSkuUseCase, findOffersUseCase, findOrdenDetailsUseCase) {
        this.validateSkuUseCase = validateSkuUseCase;
        this.findOffersUseCase = findOffersUseCase;
        this.findOrdenDetailsUseCase = findOrdenDetailsUseCase;
    }

    /**
     * Analizar todos los items de una factura
     * @param {string} facturaId - ID de la factura
     * @param {Array} facturaItems - Items de la factura
     * @param {string} sapOrderId - ID de la orden SAP
     * @returns {Object} Resultados para todos los items
     */
    async execute(facturaId, facturaItems, sapOrderId) {
        console.log(`🚀 Iniciando análisis batch para ${facturaItems.length} items de factura: ${facturaId}`);
        
        const startTime = performance.now();
        
        try {
            // Validar parámetros
            if (!facturaId || !Array.isArray(facturaItems) || facturaItems.length === 0) {
                return {
                    success: false,
                    error: 'Parámetros inválidos: facturaId y facturaItems son requeridos',
                    results: new Map()
                };
            }
            
            if (!sapOrderId) {
                console.warn('⚠️ sapOrderId no proporcionado, algunos análisis podrían fallar');
            }
            
            // ⚡ PARALELIZAR ANÁLISIS DE TODOS LOS ITEMS
            console.log(`⚡ Paralelizando análisis de ${facturaItems.length} items...`);
            const analysisPromises = facturaItems.map(item => 
                this.analyzeItem(item, sapOrderId)
            );
            
            const results = await Promise.all(analysisPromises);
            
            // 📊 CREAR MAPA DE RESULTADOS POR ITEM
            const itemResultsMap = new Map();
            let directMatches = 0;
            let cascadeMatches = 0;
            let filtered = 0;
            let showNormal = 0;
            let errors = 0;
            
            results.forEach((result, index) => {
                const itemId = facturaItems[index].identificadorItem;
                itemResultsMap.set(itemId, result);
                
                // Contar estadísticas
                switch (result.status) {
                    case 'direct_match': directMatches++; break;
                    case 'cascade_match': cascadeMatches++; break;
                    case 'offers_match_but_material_not_in_orden': filtered++; break;
                    case 'no_offers_match': showNormal++; break;
                    case 'error': errors++; break;
                }
            });
            
            const endTime = performance.now();
            const duration = Math.round(endTime - startTime);
            
            console.log(`✅ Análisis batch completado en ${duration}ms:`);
            console.log(`   📊 ${directMatches} matches directos`);
            console.log(`   🔄 ${cascadeMatches} matches en cascada`);
            console.log(`   🚫 ${filtered} items filtrados`);
            console.log(`   📝 ${showNormal} items normales`);
            console.log(`   ❌ ${errors} errores`);
            
            return {
                success: true,
                factura_id: facturaId,
                sap_order_id: sapOrderId,
                total_items: facturaItems.length,
                results: itemResultsMap,
                statistics: {
                    direct_matches: directMatches,
                    cascade_matches: cascadeMatches,
                    filtered: filtered,
                    show_normal: showNormal,
                    errors: errors
                },
                performance: {
                    duration_ms: duration,
                    items_per_ms: (facturaItems.length / duration).toFixed(2)
                }
            };
            
        } catch (error) {
            console.error('❌ Error en análisis batch:', error);
            return {
                success: false,
                error: error.message,
                results: new Map()
            };
        }
    }

    /**
     * Analizar un item individual (CON INTEGRACIÓN DE MATCH DIRECTO)
     * @param {Object} item - Item de la factura
     * @param {string} sapOrderId - ID de la orden SAP
     * @returns {Object} Resultado del análisis
     */
    async analyzeItem(item, sapOrderId) {
        try {
            console.log(`🔍 Analizando item: ${item.identificadorItem}`);
            
            // 🥇 PASO 1: Verificar match directo (REGLA EXISTENTE priority: 1)
            const directMatch = this.validateSkuUseCase.execute(item.vendor_sku, sapOrderId);
            
            if (directMatch && directMatch.esCoincidenciaExacta) {
                console.log(`✅ Match directo encontrado para ${item.identificadorItem}: ${directMatch.value}`);
                return {
                    item_id: item.identificadorItem,
                    status: 'direct_match',
                    
                    // ✅ PARA REGLA EXISTENTE (priority: 1)
                    has_direct_match: true,
                    matched_vendor_sku: directMatch.value,
                    
                    // ❌ PARA NUEVAS REGLAS (priority: 2-4)
                    should_filter: false,
                    should_preselect_cascade: false,
                    should_show_normal: false,
                    
                    source: 'direct',
                    rule_cascade_applies: false, // ← Nuevas reglas NO aplican
                    message: 'Match directo encontrado en orden'
                };
            }
            
            // 🔄 PASO 2: NO hay match directo → Ejecutar lógica de cascada
            console.log(`🔄 No hay match directo para ${item.identificadorItem}, ejecutando cascada...`);
            
            // PASO 2.1: Buscar en ofertas
            const offersResult = this.findOffersUseCase.execute(item.vendor_id, item.vendor_sku);
            
            // CASO A: NO hay match en ofertas → Mostrar normal (priority: 4)
            if (!offersResult.success || !offersResult.material_id) {
                console.log(`📝 Item normal ${item.identificadorItem}: ${offersResult.reason}`);
                return {
                    item_id: item.identificadorItem,
                    status: 'no_offers_match',
                    
                    // ❌ PARA REGLA EXISTENTE Y OTRAS
                    has_direct_match: false,
                    should_filter: false,
                    should_preselect_cascade: false,
                    
                    // ✅ PARA REGLA "MOSTRAR NORMAL" (priority: 4)
                    should_show_normal: true,
                    
                    reason: offersResult.reason,
                    message: offersResult.message,
                    rule_cascade_applies: true
                };
            }
            
            // PASO 2.2: HAY match en ofertas → Verificar material_id en orden
            console.log(`🔄 Match en ofertas para ${item.identificadorItem}, verificando material_id: ${offersResult.material_id}`);
            const ordenResult = this.findOrdenDetailsUseCase.execute(sapOrderId, offersResult.material_id);
            
            if (ordenResult.success && ordenResult.vendor_sku) {
                // ✅ Material_id SÍ está en orden → PRE-SELECCIONAR CASCADA (priority: 3)
                console.log(`✅ Match cascada completo para ${item.identificadorItem}: ${ordenResult.vendor_sku}`);
                return {
                    item_id: item.identificadorItem,
                    status: 'cascade_match',
                    
                    // ❌ PARA REGLA EXISTENTE Y OTRAS
                    has_direct_match: false,
                    should_filter: false,
                    should_show_normal: false,
                    
                    // ✅ PARA REGLA "PRESELECCIONAR CASCADA" (priority: 3)
                    should_preselect_cascade: true,
                    matched_vendor_sku: ordenResult.vendor_sku,
                    
                    source: 'cascade',
                    via_material_id: offersResult.material_id,
                    message: `Match en cascada: ${ordenResult.vendor_sku} vía material_id ${offersResult.material_id}`,
                    rule_cascade_applies: true
                };
            } else {
                // ❌ Material_id NO está en orden → FILTRAR (priority: 2)
                console.log(`🚫 Item filtrado ${item.identificadorItem}: material_id ${offersResult.material_id} no está en orden`);
                return {
                    item_id: item.identificadorItem,
                    status: 'offers_match_but_material_not_in_orden',
                    
                    // ❌ PARA REGLA EXISTENTE Y OTRAS
                    has_direct_match: false,
                    should_preselect_cascade: false,
                    should_show_normal: false,
                    
                    // ✅ PARA REGLA "FILTRAR" (priority: 2)
                    should_filter: true,
                    
                    reason: 'material_not_in_orden',
                    via_material_id: offersResult.material_id,
                    message: `Material ${offersResult.material_id} no encontrado en orden`,
                    rule_cascade_applies: true
                };
            }
            
        } catch (error) {
            console.error(`❌ Error analizando item ${item.identificadorItem}:`, error);
            // En caso de error → Mostrar normal (no romper la experiencia)
            return {
                item_id: item.identificadorItem,
                status: 'error',
                has_direct_match: false,
                should_filter: false,
                should_preselect_cascade: false,
                should_show_normal: true, // ← Fallback: mostrar normal
                error: error.message,
                message: `Error en análisis: ${error.message}`,
                rule_cascade_applies: true
            };
        }
    }
    
    /**
     * Obtener información del caso de uso
     * @returns {Object} Información del caso de uso
     */
    getInfo() {
        return {
            name: 'BatchSkuAnalysisUseCase',
            description: 'Análisis batch de SKUs con integración de match directo y cascada',
            dependencies: ['ValidateSkuSelectionUseCase', 'FindOffersByVendorUseCase', 'FindOrdenDetailsByMaterialUseCase'],
            version: '1.0.0'
        };
    }
}

// 🚀 INICIALIZACIÓN LAZY
Object.defineProperty(window, 'batchSkuAnalysisUseCase', {
    get: function() {
        if (this._batchSkuAnalysisInstance) {
            return this._batchSkuAnalysisInstance;
        }
        
        if (!window.validateSkuSelectionUseCase || !window.findOffersByVendorUseCase || !window.findOrdenDetailsByMaterialUseCase) {
            throw new Error('Dependencias no están disponibles para BatchSkuAnalysisUseCase');
        }
        
        console.debug('🏗️ BatchSkuAnalysisUseCase inicializado');
        this._batchSkuAnalysisInstance = new BatchSkuAnalysisUseCase(
            window.validateSkuSelectionUseCase,
            window.findOffersByVendorUseCase,
            window.findOrdenDetailsByMaterialUseCase
        );
        return this._batchSkuAnalysisInstance;
    },
    configurable: true
});

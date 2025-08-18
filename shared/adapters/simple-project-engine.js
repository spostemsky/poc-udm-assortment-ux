/**
 * 🎯 SIMPLE PROJECT ENGINE
 * Basado en el método exitoso del Rules Manager
 * Solo carga lo esencial para que funcione
 */

(async function() {
    console.log('🚀 SimpleProjectEngine: Iniciando...');
    
    try {
        // Usar ruta fija para formulario (más confiable)
        const basePath = '../shared/rule-engine';
        
        console.log('📂 Usando ruta fija para formulario:', basePath);
        
        // PASO 1: Cargar solo las reglas (como Rules Manager)
        console.log('📂 Cargando reglas...');
        
        const ruleFiles = [
            `${basePath}/rules/business-rules.js`,
            `${basePath}/rules/ux-rules.js`, 
            `${basePath}/rules/ui-rules.js`,
            `${basePath}/rules/validation-rules.js`
        ];
        
        // Cargar archivos de reglas secuencialmente (como Rules Manager)
        for (const file of ruleFiles) {
            try {
                await loadScript(file);
                console.log(`✅ Cargado: ${file}`);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar ${file}:`, error);
            }
        }
        
        // PASO 2: Cargar componentes mínimos del motor
        console.log('🔧 Cargando componentes del motor...');
        
        const engineFiles = [
            `${basePath}/generic-query-engine.js`,
            `${basePath}/action-executor.js`,
            `${basePath}/engine.js`,
            // CRÍTICO: Agregar componentes para integración con Rules Manager
            `${basePath}/components/rules-manager/rules-state-manager.js`,
            '../shared/adapters/rules-provider.js'
        ];
        
        for (const file of engineFiles) {
            try {
                await loadScript(file);
                console.log(`✅ Cargado: ${file}`);
            } catch (error) {
                console.error(`❌ Error cargando ${file}:`, error);
                throw error;
            }
        }
        
        // PASO 3: Crear motor básico CON FIELD RESOLVERS
        console.log('🎯 Creando motor básico con field resolvers...');
        
        if (!window.BusinessRulesEngine || !window.ActionExecutor || !window.GenericQueryEngine || !window.RulesStateManager || !window.RulesProvider) {
            throw new Error('Componentes básicos no disponibles');
        }
        
        if (!window.BUSINESS_RULES_CATEGORY) {
            throw new Error('Reglas no cargadas');
        }
        
        // CRÍTICO: Crear QueryEngine Adapter configurado (versión simple)
        console.log('🔌 Inicializando QueryEngine Adapter...');
        
        // Crear QueryEngine con field resolvers básicos (sin Data Services complejos)
        const queryAdapter = new GenericQueryEngine({
            fieldResolvers: {
                // Field resolvers básicos para que las reglas funcionen
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
                
                container_position: (field, context) => {
                    if (!context.containerIndex && context.containerIndex !== 0) {
                        return 0;
                    }
                    return context.containerIndex;
                }
            }
        });
        
        // Crear ActionExecutor
        const actionExecutor = new ActionExecutor();
        
        // PASO 1: Crear motor básico SIN StateManager primero
        console.log('🚀 Creando motor básico...');
        const engine = new BusinessRulesEngine(queryAdapter, actionExecutor, null, null);
        
        // PASO 2: Inicializar motor básico (esto carga window.BUSINESS_RULES_CATEGORY)
        const success = await engine.initialize();
        if (!success) {
            throw new Error('Error inicializando motor básico');
        }
        
        // PASO 3: AHORA crear RulesStateManager (cuando las reglas ya están disponibles)
        console.log('💾 Inicializando RulesStateManager...');
        const stateManager = new RulesStateManager({
            storageKey: 'business_rules_overrides'
        });
        stateManager.initialize(); // Ahora window.BUSINESS_RULES_CATEGORY está disponible
        
        // PASO 4: Crear RulesProvider con StateManager integrado
        console.log('📋 Inicializando RulesProvider...');
        const rulesProvider = new RulesProvider(stateManager);
        await rulesProvider.initialize();
        
        // PASO 5: Reconfigurar el motor con StateManager y RulesProvider
        console.log('🔄 Reconfigurando motor con StateManager...');
        engine.stateManager = stateManager;
        engine.rulesProvider = rulesProvider;
        
        // CRÍTICO: Usar reloadRules() para limpiar reglas anteriores
        console.log('🧹 Limpiando reglas anteriores y recargando...');
        await engine.reloadRules();
        
        // PASO 4: Extender con métodos específicos del proyecto
        console.log('🔧 Agregando métodos específicos...');
        
        // Método aplicarRestriccionesContainer
        engine.aplicarRestriccionesContainer = function(container, itemId, numeroOrdenCompra, containerIndex = 0, hasStatesGuardados = false) {
            console.log('🔄 aplicarRestriccionesContainer() via SimpleProjectEngine');
            console.log('📋 Parámetros recibidos:', { container: !!container, itemId, numeroOrdenCompra, containerIndex, hasStatesGuardados });
            
            // Ser más flexible con los parámetros
            if (!container) {
                console.warn('⚠️ Container faltante - continuando con comportamiento por defecto');
                return null;
            }
            
            const context = {
                container: container,
                itemId: itemId || 'unknown',
                sapOrderId: numeroOrdenCompra || 'unknown',
                containerIndex: containerIndex || 0,
                hasStatesGuardados: hasStatesGuardados || false,
                timestamp: Date.now(),
                source: 'aplicarRestriccionesContainer'
            };

            console.log('✅ Aplicando restricciones con contexto:', context);
            return this.evaluateRules('on_container_initialize', context);
        };
        
        // Método verificarCoincidenciaExacta
        engine.verificarCoincidenciaExacta = function(vendorSkuFactura, numeroOrdenCompra) {
            console.log('🔄 verificarCoincidenciaExacta() via SimpleProjectEngine');
            
            if (!vendorSkuFactura || !numeroOrdenCompra) {
                console.warn('⚠️ Parámetros faltantes para verificarCoincidenciaExacta');
                return null;
            }
            
            const context = {
                vendorSku: vendorSkuFactura,
                sapOrderId: numeroOrdenCompra,
                timestamp: Date.now(),
                source: 'verificarCoincidenciaExacta'
            };

            return this.evaluateRules('on_sku_validation', context);
        };
        
        // Método getActiveRulesByType (faltante crítico)
        engine.getActiveRulesByType = function(type) {
            console.log('🔍 getActiveRulesByType() via SimpleProjectEngine para tipo:', type);
            
            // Intentar obtener reglas de diferentes fuentes
            let rules = this.rules;
            if (!rules || !Array.isArray(rules)) {
                // Fallback: usar reglas globales
                if (window.BUSINESS_RULES_CATEGORY && Array.isArray(window.BUSINESS_RULES_CATEGORY)) {
                    rules = window.BUSINESS_RULES_CATEGORY;
                    console.log('📋 Usando reglas de window.BUSINESS_RULES_CATEGORY');
                } else {
                    console.warn('⚠️ No hay reglas disponibles en ninguna fuente');
                    return [];
                }
            }
            
            const filteredRules = rules.filter(rule => {
                const isActive = rule.active !== false;
                const matchesType = rule.type === type || rule.category === type || rule.trigger === type;
                return isActive && matchesType;
            });
            
            console.log(`📊 Encontradas ${filteredRules.length} reglas activas para tipo '${type}'`);
            return filteredRules;
        };
        
        // PASO 5: Exponer globalmente
        window.businessRulesEngine = engine;
        window.actionExecutor = actionExecutor;
        
        // CRÍTICO: Configurar la variable que espera el formulario
        window.RULE_ENGINE = {
            initialized: true,
            engine: engine,
            actionExecutor: actionExecutor
        };
        
        // Método getRulesInfo (mejorado para usar RulesProvider)
        engine.getRulesInfo = function() {
            // Usar reglas del RulesProvider si está disponible (más preciso)
            let effectiveRules = {};
            
            if (rulesProvider && typeof rulesProvider.getRules === 'function') {
                effectiveRules = rulesProvider.getRules();
                console.log('📊 getRulesInfo usando RulesProvider:', Object.keys(effectiveRules).length, 'reglas');
            } else if (this.rules && Array.isArray(this.rules)) {
                // Fallback a reglas internas
                this.rules.forEach(rule => {
                    if (rule.id) effectiveRules[rule.id] = rule;
                });
                console.log('📊 getRulesInfo usando reglas internas:', Object.keys(effectiveRules).length, 'reglas');
            }
            
            const rulesArray = Object.values(effectiveRules);
            const activeRules = rulesArray.filter(rule => rule.active !== false);
            const inactiveRules = rulesArray.filter(rule => rule.active === false);
            
            return {
                totalRules: rulesArray.length,
                activeRules: activeRules.map(rule => rule.id),
                inactiveRules: inactiveRules.map(rule => rule.id)
            };
        };
        
        // CRÍTICO: Exponer función de sincronización para el formulario
        window.syncBusinessRulesWithManager = function() {
            console.log('🔄 Sincronizando reglas con Rules Manager...');
            if (rulesProvider && engine) {
                rulesProvider.loadRawRules().then(() => {
                    // CRÍTICO: Usar reloadRules() para limpiar reglas anteriores
                    engine.reloadRules();
                    console.log('✅ Reglas sincronizadas');
                });
            }
        };

        // COMUNICACIÓN AUTOMÁTICA: Escuchar cambios de reglas
        setupAutomaticRulesSync(rulesProvider, engine);
        
        // TEST: Exponer función de prueba para verificar comunicación
        window.testRulesSync = function() {
            console.log('🧪 TEST: Simulando cambio de regla...');
            const testEvent = new CustomEvent('rulesChanged', {
                detail: { type: 'rule_change', ruleId: 'test_rule', timestamp: Date.now() }
            });
            window.dispatchEvent(testEvent);
        };
        
        console.log('🎉 SimpleProjectEngine listo!');
        
        // Mostrar info de reglas
        const info = engine.getRulesInfo();
        console.log(`📊 Reglas cargadas: ${info.totalRules} total, ${info.activeRules.length} activas`);
        
    } catch (error) {
        console.error('💥 Error en SimpleProjectEngine:', error);
        console.error('📋 Detalles del error:', error.message);
        console.error('📋 Stack trace:', error.stack);
        
        // Configurar RULE_ENGINE como fallido para que el formulario no se cuelgue
        window.RULE_ENGINE = {
            initialized: false,
            error: error.message
        };
    }
    
})();

/**
 * 📡 COMUNICACIÓN AUTOMÁTICA ENTRE VENTANAS
 * Configura listeners para sincronización automática de reglas
 */
function setupAutomaticRulesSync(rulesProvider, engine) {
    console.log('📡 Configurando sincronización automática de reglas...');
    
    // LISTENER 1: Storage events (comunicación entre pestañas/ventanas)
    window.addEventListener('storage', function(event) {
        if (event.key === 'rules_change_trigger') {
            console.log('📡 Detectado cambio de reglas desde otra pestaña');
            handleRuleChangeEvent();
        }
    });
    
    // LISTENER 2: Custom events (comunicación en la misma ventana)
    window.addEventListener('rulesChanged', function(event) {
        console.log('📡 Detectado cambio de reglas en la misma ventana:', event.detail);
        handleRuleChangeEvent();
    });
    
    // FUNCIÓN DE MANEJO: Sincronizar reglas automáticamente
    function handleRuleChangeEvent() {
        console.log('🔄 Sincronización automática iniciada...');
        
        if (rulesProvider && engine) {
            rulesProvider.loadRawRules().then(() => {
                engine.reloadRules();
                console.log('✅ Reglas sincronizadas automáticamente');
                
                // ENFOQUE SIMPLIFICADO: Recarga completa del formulario
                reloadCompleteForm();
                
            }).catch(error => {
                console.error('💥 Error en sincronización automática:', error);
            });
        }
    }
    
    // FUNCIÓN AUXILIAR: Recarga completa del formulario
    function reloadCompleteForm() {
        console.log('🔄 Recargando formulario completo con nuevas reglas...');
        
        try {
            // OPCIÓN 1: Recargar solo los contenedores (más eficiente)
            if (window.mostrarContenedoresPrimeraFactura) {
                console.log('🔄 Recargando contenedores...');
                window.mostrarContenedoresPrimeraFactura();
                console.log('✅ Contenedores recargados con nuevas reglas');
            }
            // OPCIÓN 2: Fallback - Recargar factura actual
            else if (window.cargarFactura) {
                const facturaActual = document.querySelector('#factura-selector')?.value;
                if (facturaActual) {
                    console.log('🔄 Recargando factura actual:', facturaActual);
                    window.cargarFactura(facturaActual);
                    console.log('✅ Factura recargada con nuevas reglas');
                }
            }
            // OPCIÓN 3: Último recurso - Recarga completa de página
            else {
                console.log('🔄 Recargando página completa...');
                window.location.reload();
            }
            
            // Notificar al usuario
            if (window.showNotification) {
                window.showNotification('🔄 Formulario actualizado con nuevas reglas');
            }
            
        } catch (error) {
            console.error('💥 Error recargando formulario:', error);
            console.log('🔄 Fallback: Recargando página completa...');
            window.location.reload();
        }
    }
    
    // NOTA: Las funciones complejas de efectos visuales han sido removidas
    // Ahora usamos recarga completa del formulario para mayor simplicidad y confiabilidad
    
    console.log('✅ Sincronización automática configurada');
}

// Función auxiliar para cargar scripts (igual que Rules Manager)
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

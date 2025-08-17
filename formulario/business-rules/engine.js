/**
 * BusinessRulesEngine - Motor principal de reglas de negocio
 * Reemplaza verificarCoincidenciaExacta() y funciones relacionadas con un sistema configurable
 */
class BusinessRulesEngine {
    constructor() {
        this.queryEngine = new QueryEngine();
        this.actionExecutor = new ActionExecutor();
        this.rules = new Map();
        this.isInitialized = false;
    }

    /**
     * Inicializar el motor cargando las reglas
     */
    async initialize() {
        try {
            console.log('🚀 Inicializando Business Rules Engine...');
            await this.loadRules();
            this.isInitialized = true;
            console.log('✅ Business Rules Engine inicializado correctamente');
        } catch (error) {
            console.error('💥 Error inicializando Business Rules Engine:', error);
        }
    }

    /**
     * Cargar reglas desde la variable JavaScript (evita problemas de CORS)
     */
    async loadRules() {
        try {
            // Verificar que las reglas estén disponibles
            if (!window.BUSINESS_RULES || !window.BUSINESS_RULES.rules) {
                throw new Error('BUSINESS_RULES no está disponible. Asegúrate de cargar rules.js');
            }
            
            const rulesData = window.BUSINESS_RULES;
            console.log('📋 Cargando reglas:', Object.keys(rulesData.rules).length, 'reglas encontradas');
            console.log('🔍 Reglas disponibles:', Object.keys(rulesData.rules));
            console.log('🔍 Estado de reglas:', Object.entries(rulesData.rules).map(([id, rule]) => ({ id, active: rule.active })));

            // Cargar cada regla en el mapa
            for (const [ruleId, ruleConfig] of Object.entries(rulesData.rules)) {
                if (ruleConfig.active) {
                    this.rules.set(ruleId, ruleConfig);
                    console.log(`✅ Regla cargada: ${ruleId} (${ruleConfig.name})`);
                } else {
                    console.log(`⏸️ Regla desactivada: ${ruleId} (${ruleConfig.name})`);
                }
            }

            console.log('📋 Total reglas activas:', this.rules.size);
            
            if (this.rules.size === 0) {
                console.warn('⚠️ No hay reglas activas. El sistema funcionará sin validaciones automáticas.');
            }

        } catch (error) {
            console.error('💥 Error cargando reglas:', error);
            throw error;
        }
    }

    /**
     * Evaluar reglas para un trigger específico
     * Esta es la función principal que reemplaza verificarCoincidenciaExacta()
     * @param {string} trigger - Evento que dispara la evaluación
     * @param {Object} context - Contexto de ejecución
     * @returns {Object|null} - Resultado de la primera regla que se cumple
     */
    evaluateRules(trigger, context = {}) {
        if (!this.isInitialized) {
            console.warn('⚠️ Business Rules Engine no está inicializado');
            return null;
        }

        console.log('🎯 Evaluando reglas para trigger:', trigger, context);

        // Obtener reglas que responden a este trigger, ordenadas por prioridad
        // PRIORIDAD 1 = MÁS ALTA (prevalece), se ejecuta AL FINAL para sobrescribir
        const applicableRules = Array.from(this.rules.entries())
            .filter(([ruleId, rule]) => rule.triggers.includes(trigger))
            .sort(([,a], [,b]) => b.priority - a.priority); // ← INVERTIDO: mayor prioridad al final

        console.log('📋 Reglas aplicables:', applicableRules.length);

        // Evaluar TODAS las reglas aplicables (por orden de prioridad)
        let firstMatchResult = null; // Para compatibilidad con código actual
        let executedRules = [];
        
        for (const [ruleId, rule] of applicableRules) {
            const categoryIcon = this.getCategoryIcon(rule.category);
            console.log(`🔍 Evaluando regla: ${ruleId} (${rule.name}) - ${categoryIcon} ${rule.category} - Prioridad: ${rule.priority}`);

            try {
                const conditionResult = this.queryEngine.evaluateCondition(rule.condition, context);
                
                if (conditionResult) {
                    console.log(`✅ Regla cumplida: ${ruleId}`);
                    
                    // Resolver variables de la regla
                    const variables = this.resolveRuleVariables(rule.variables, conditionResult);
                    
                    // Ejecutar acciones
                    this.actionExecutor.executeActions(rule.actions, context, variables);
                    
                    // Guardar información de la regla ejecutada
                    executedRules.push({
                        ruleId: ruleId,
                        ruleName: rule.name,
                        priority: rule.priority,
                        conditionResult: conditionResult
                    });
                    
                    // Guardar el primer resultado para compatibilidad
                    if (!firstMatchResult) {
                        firstMatchResult = {
                            ruleId: ruleId,
                            ruleName: rule.name,
                            conditionResult: conditionResult,
                            variables: variables,
                            executedRules: executedRules,
                            // Campos de compatibilidad con verificarCoincidenciaExacta()
                            value: conditionResult.vendorSku,
                            text: conditionResult.vendorSku,
                            description: conditionResult.item?.title,
                            unitPrice: conditionResult.unitPrice,
                            materialId: conditionResult.materialId,
                            quantity: conditionResult.quantity,
                            esCoincidenciaExacta: true
                        };
                    }
                } else {
                    console.log(`❌ Regla no cumplida: ${ruleId}`);
                }

            } catch (error) {
                console.error(`💥 Error evaluando regla ${ruleId}:`, error);
            }
        }
        
        // Log de resumen
        if (executedRules.length > 0) {
            console.log(`📊 Ejecutadas ${executedRules.length} reglas:`, 
                       executedRules.map(r => `${r.ruleId} (prioridad: ${r.priority})`));
        }
        
        // Retornar primer resultado para compatibilidad
        if (firstMatchResult) {
            return firstMatchResult;
        }

        console.log('❌ Ninguna regla se cumplió para trigger:', trigger);
        return null;
    }

    /**
     * Resolver variables de una regla basadas en el resultado de la condición
     */
    resolveRuleVariables(variablesConfig, conditionResult) {
        const variables = {};

        if (!variablesConfig) {
            return variables;
        }

        for (const [variableName, variableConfig] of Object.entries(variablesConfig)) {
            try {
                const value = this.resolveVariableValue(variableConfig, conditionResult);
                variables[variableName] = value;
                console.log(`📊 Variable resuelta: ${variableName} = ${value}`);
            } catch (error) {
                console.error(`💥 Error resolviendo variable ${variableName}:`, error);
                variables[variableName] = null;
            }
        }

        return variables;
    }

    /**
     * Resolver el valor de una variable individual
     */
    resolveVariableValue(variableConfig, conditionResult) {
        const sourcePath = variableConfig.source;
        
        // Navegar por el path (ej: "condition_result.vendorSku")
        const parts = sourcePath.split('.');
        let value = { condition_result: conditionResult };

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Función de compatibilidad que reemplaza verificarCoincidenciaExacta()
     * @param {string} vendorSkuFactura - SKU del vendor de la factura
     * @param {number} numeroOrdenCompra - Número de la orden de compra
     * @returns {Object|null} - Resultado compatible con código actual
     */
    verificarCoincidenciaExacta(vendorSkuFactura, numeroOrdenCompra) {
        console.log('🔄 verificarCoincidenciaExacta() llamada via Business Rules Engine');
        
        const context = {
            itemId: vendorSkuFactura,
            sapOrderId: numeroOrdenCompra
        };

        return this.evaluateRules('on_container_initialize', context);
    }

    /**
     * Función para aplicar restricciones a un container
     * Punto de entrada principal del Business Rules Engine
     */
    aplicarRestriccionesContainer(container, itemId, numeroOrdenCompra, containerIndex = 0, hasStatesGuardados = false) {
        console.log('🔄 aplicarRestriccionesContainer() llamada via Business Rules Engine');
        
        const context = {
            container: container,
            itemId: itemId,
            sapOrderId: numeroOrdenCompra,
            containerIndex: containerIndex,
            hasStatesGuardados: hasStatesGuardados
        };

        return this.evaluateRules('on_container_initialize', context);
    }

    /**
     * Recargar reglas (útil para desarrollo)
     */
    async reloadRules() {
        console.log('🔄 Recargando reglas...');
        this.rules.clear();
        await this.loadRules();
        console.log('✅ Reglas recargadas correctamente');
    }

    /**
     * Función de utilidad para activar/desactivar reglas dinámicamente
     */
    setRuleActive(ruleId, active) {
        if (window.BUSINESS_RULES && window.BUSINESS_RULES.rules[ruleId]) {
            window.BUSINESS_RULES.rules[ruleId].active = active;
            console.log(`🔄 Regla ${ruleId} ${active ? 'activada' : 'desactivada'}`);
            
            // Recargar reglas para aplicar cambios
            this.reloadRules();
        } else {
            console.error(`❌ Regla ${ruleId} no encontrada`);
        }
    }

    /**
     * Obtener información de reglas cargadas
     */
    getRulesInfo() {
        return {
            totalRules: this.rules.size,
            activeRules: Array.from(this.rules.keys()),
            isInitialized: this.isInitialized
        };
    }

    /**
     * Activar/desactivar una regla específica
     */
    toggleRule(ruleId, active) {
        if (this.rules.has(ruleId)) {
            const rule = this.rules.get(ruleId);
            rule.active = active;
            
            if (!active) {
                this.rules.delete(ruleId);
            }
            
            console.log(`🔄 Regla ${ruleId} ${active ? 'activada' : 'desactivada'}`);
        }
    }

    /**
     * Obtener icono para categoría de regla
     */
    getCategoryIcon(category) {
        const icons = {
            'business': '💼',
            'ux': '🎨', 
            'validation': '✅',
            'ui': '🖥️'
        };
        return icons[category] || '📋';
    }
}

// Crear instancia global del motor
window.businessRulesEngine = new BusinessRulesEngine();

// Exportar clase para uso en otros módulos
window.BusinessRulesEngine = BusinessRulesEngine;

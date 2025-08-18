/**
 * 📋 RULES PROVIDER - Proveedor de Reglas con StateManager
 * Proporciona reglas al BusinessRulesEngine considerando estados modificados
 * 
 * ✅ FUNCIONALIDADES:
 * - Carga reglas desde múltiples fuentes
 * - Integración con RulesStateManager
 * - Aplicación de overrides de localStorage
 * - 100% compatible con BusinessRulesEngine genérico
 */
class RulesProvider {
    constructor(stateManager = null) {
        this.stateManager = stateManager;
        this.rawRules = {};
        this.initialized = false;
        
        console.log('📋 RulesProvider creado con StateManager:', !!stateManager);
    }

    /**
     * 🚀 Inicializar el proveedor
     */
    async initialize() {
        console.log('🔄 Inicializando RulesProvider...');
        
        try {
            await this.loadRawRules();
            this.initialized = true;
            console.log('✅ RulesProvider inicializado correctamente');
            return true;
        } catch (error) {
            console.error('💥 Error inicializando RulesProvider:', error);
            return false;
        }
    }

    /**
     * 📥 Cargar reglas raw desde las fuentes disponibles
     */
    async loadRawRules() {
        this.rawRules = {};
        
        // Opción 1: Cargar desde window.BUSINESS_RULES_CATEGORY
        if (typeof window !== 'undefined' && window.BUSINESS_RULES_CATEGORY) {
            Object.keys(window.BUSINESS_RULES_CATEGORY).forEach(categoryName => {
                const categoryRules = window.BUSINESS_RULES_CATEGORY[categoryName];
                Object.assign(this.rawRules, categoryRules);
            });
            
            console.log(`📥 Cargadas ${Object.keys(this.rawRules).length} reglas desde categorías`);
        } else {
            console.warn('⚠️ No se encontraron categorías de reglas en window.BUSINESS_RULES_CATEGORY');
        }
        
        // TODO: Opción 2: Cargar desde archivos JSON, API, etc.
    }

    /**
     * 📋 Obtener reglas procesadas (con estados efectivos)
     * Esta es la función principal que usa BusinessRulesEngine
     */
    getRules() {
        if (!this.initialized) {
            console.warn('⚠️ RulesProvider no inicializado');
            return {};
        }

        const processedRules = {};
        
        Object.entries(this.rawRules).forEach(([ruleId, rawRule]) => {
            // Crear regla procesada con estado efectivo
            const processedRule = this.createProcessedRule(ruleId, rawRule);
            
            if (processedRule) {
                processedRules[ruleId] = processedRule;
            }
        });
        
        console.log(`📋 RulesProvider devuelve ${Object.keys(processedRules).length} reglas procesadas`);
        return processedRules;
    }

    /**
     * 🔧 Crear regla procesada con estados efectivos
     */
    createProcessedRule(ruleId, rawRule) {
        // Obtener estado efectivo de la regla
        const effectiveRuleActive = this.getEffectiveRuleState(ruleId, rawRule);
        
        if (!effectiveRuleActive) {
            // Regla inactiva, no incluir
            return null;
        }

        // Crear copia de la regla
        const processedRule = { ...rawRule, active: effectiveRuleActive };
        
        // Procesar acciones con estados efectivos
        if (rawRule.actions && Array.isArray(rawRule.actions)) {
            processedRule.actions = rawRule.actions
                .map((action, index) => {
                    const effectiveActionActive = this.getEffectiveActionState(ruleId, index, action);

                    return { ...action, active: effectiveActionActive };
                });
                // CRÍTICO: NO filtrar actions inactivas - el ActionExecutor las maneja
                // .filter(action => action.active); ← REMOVIDO
        }
        
        return processedRule;
    }

    /**
     * 💾 Obtener estado efectivo de una regla
     */
    getEffectiveRuleState(ruleId, rawRule) {
        if (this.stateManager && typeof this.stateManager.getRuleEffectiveState === 'function') {
            const effectiveRule = this.stateManager.getRuleEffectiveState(ruleId);
            return effectiveRule.active;
        }
        
        // Fallback: usar estado original
        return rawRule.active !== false;
    }

    /**
     * ⚙️ Obtener estado efectivo de una acción
     */
    getEffectiveActionState(ruleId, actionIndex, rawAction) {
        if (this.stateManager && typeof this.stateManager.getActionEffectiveState === 'function') {
            const effectiveAction = this.stateManager.getActionEffectiveState(ruleId, actionIndex);

            return effectiveAction.active;
        }
        

        // Fallback: usar estado original
        return rawAction.active !== false;
    }

    /**
     * 🔄 Recargar reglas (útil cuando cambian los estados)
     */
    async reload() {
        console.log('🔄 Recargando RulesProvider...');
        await this.loadRawRules();
        console.log('✅ RulesProvider recargado');
    }

    /**
     * 📊 Obtener estadísticas del proveedor
     */
    getStats() {
        const processedRules = this.getRules();
        const rawRulesCount = Object.keys(this.rawRules).length;
        const processedRulesCount = Object.keys(processedRules).length;
        const inactiveRulesCount = rawRulesCount - processedRulesCount;
        
        // Contar acciones
        let totalActions = 0;
        let activeActions = 0;
        
        Object.values(processedRules).forEach(rule => {
            if (rule.actions) {
                totalActions += rule.actions.length;
                activeActions += rule.actions.filter(action => action.active).length;
            }
        });
        
        return {
            initialized: this.initialized,
            hasStateManager: !!this.stateManager,
            rawRules: rawRulesCount,
            activeRules: processedRulesCount,
            inactiveRules: inactiveRulesCount,
            totalActions: totalActions,
            activeActions: activeActions,
            inactiveActions: totalActions - activeActions
        };
    }

    /**
     * 🔍 Obtener regla específica (procesada)
     */
    getRule(ruleId) {
        const allRules = this.getRules();
        return allRules[ruleId] || null;
    }

    /**
     * 📋 Obtener reglas por categoría
     */
    getRulesByCategory(category) {
        const allRules = this.getRules();
        const categoryRules = {};
        
        Object.entries(allRules).forEach(([ruleId, rule]) => {
            if (rule.category === category) {
                categoryRules[ruleId] = rule;
            }
        });
        
        return categoryRules;
    }
}

// Exportar clase para uso en otros módulos
if (typeof window !== 'undefined') {
    window.RulesProvider = RulesProvider;
}

// Para Node.js o módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RulesProvider;
}

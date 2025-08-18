/**
 * 🚀 BUSINESS RULES ENGINE - Motor Principal GENÉRICO
 * Coordina la evaluación de reglas y ejecución de acciones
 * 
 * ✅ 100% GENÉRICO Y REUTILIZABLE:
 * - Sin dependencias específicas del proyecto
 * - Inyección de dependencias completa
 * - Integración nativa con RulesStateManager
 * - 100% portable a otros proyectos
 */
class BusinessRulesEngine {
    constructor(queryEngine = null, actionExecutor = null, stateManager = null, rulesProvider = null) {
        this.rules = new Map();
        
        // 🔌 INYECCIÓN DE DEPENDENCIAS
        this.queryEngine = queryEngine || new GenericQueryEngine();
        this.actionExecutor = actionExecutor || new ActionExecutor();
        this.stateManager = stateManager || null; // Para leer estados modificados
        this.rulesProvider = rulesProvider || null; // Para cargar reglas
        
        this.isInitialized = false;
        
        console.log('🏗️ BusinessRulesEngine (PURE) creado con:', {
            queryEngine: this.queryEngine.constructor.name,
            actionExecutor: this.actionExecutor.constructor.name,
            stateManager: this.stateManager ? this.stateManager.constructor.name : 'none',
            rulesProvider: this.rulesProvider ? 'custom' : 'default'
        });
    }

    /**
     * Inicializar el motor de reglas
     */
    async initialize() {
        console.log('🔄 Inicializando Business Rules Engine (PURE)...');
        
        try {
            this.loadRules();
            this.isInitialized = true;
            console.log('✅ Business Rules Engine (PURE) inicializado correctamente');
            return true;
        } catch (error) {
            console.error('💥 Error inicializando Business Rules Engine (PURE):', error);
            return false;
        }
    }

    /**
     * 📋 Cargar todas las reglas (GENÉRICO)
     * Usa rulesProvider si está disponible, sino busca en window.BUSINESS_RULES_CATEGORY
     */
    loadRules() {
        let allRules = {};
        
        // Opción 1: Usar rulesProvider inyectado (preferido)
        if (this.rulesProvider && typeof this.rulesProvider.getRules === 'function') {
            allRules = this.rulesProvider.getRules();
            console.log('📋 Reglas cargadas desde rulesProvider inyectado');
        }
        // Opción 2: Fallback a window.BUSINESS_RULES_CATEGORY (compatibilidad)
        else if (typeof window !== 'undefined' && window.BUSINESS_RULES_CATEGORY) {
            Object.keys(window.BUSINESS_RULES_CATEGORY).forEach(categoryName => {
                const categoryRules = window.BUSINESS_RULES_CATEGORY[categoryName];
                Object.assign(allRules, categoryRules);
            });
            console.log('📋 Reglas cargadas desde window.BUSINESS_RULES_CATEGORY (fallback)');
        }
        else {
            console.warn('⚠️ No se encontró fuente de reglas (rulesProvider o window.BUSINESS_RULES_CATEGORY)');
            return;
        }

        this.processRules(allRules);
    }

    /**
     * 🔄 Procesar reglas considerando estados modificados
     */
    processRules(allRules) {
        let activeCount = 0;
        let inactiveCount = 0;

        Object.entries(allRules).forEach(([ruleId, rule]) => {
            // 💾 INTEGRACIÓN CON STATEMANAGER: Obtener estado efectivo
            const effectiveActive = this.getEffectiveRuleState(ruleId, rule);
            
            if (effectiveActive) {
                // Crear copia de la regla con acciones efectivas
                const effectiveRule = this.createEffectiveRule(rule, ruleId);
                this.rules.set(ruleId, effectiveRule);
                activeCount++;
                console.log(`✅ Regla cargada: ${ruleId} (${rule.name}) - Estado: ${effectiveActive}`);
            } else {
                inactiveCount++;
                console.log(`⏸️ Regla inactiva: ${ruleId} (${rule.name}) - Estado: ${effectiveActive}`);
            }
        });

        console.log(`📊 Reglas procesadas: ${activeCount} activas, ${inactiveCount} inactivas`);
        
        if (activeCount === 0) {
            console.warn('⚠️ No hay reglas activas cargadas');
        }
    }

    /**
     * 💾 Obtener estado efectivo de una regla (considerando overrides)
     */
    getEffectiveRuleState(ruleId, rule) {
        if (this.stateManager && typeof this.stateManager.getRuleEffectiveState === 'function') {
            const effectiveRule = this.stateManager.getRuleEffectiveState(ruleId);
            return effectiveRule.active;
        }
        
        // Fallback: usar estado original
        return rule.active;
    }

    /**
     * 🔧 Crear regla efectiva con acciones filtradas por estado
     */
    createEffectiveRule(originalRule, ruleId) {
        const effectiveRule = { ...originalRule };
        
        // Filtrar acciones por estado efectivo
        if (this.stateManager && originalRule.actions) {
            effectiveRule.actions = originalRule.actions.filter((action, index) => {
                if (typeof this.stateManager.getActionEffectiveState === 'function') {
                    const effectiveAction = this.stateManager.getActionEffectiveState(ruleId, index);
                    return effectiveAction.active;
                }
                return action.active !== false; // Fallback: incluir si no está explícitamente inactiva
            });
        }
        
        return effectiveRule;
    }

    /**
     * 🔍 Evaluar reglas para un trigger específico (GENÉRICO)
     */
    evaluateRules(trigger, context) {
        if (!this.isInitialized) {
            console.warn('⚠️ Business Rules Engine no inicializado');
            return null;
        }

        // Filtrar reglas aplicables
        const applicableRules = Array.from(this.rules.entries())
            .filter(([ruleId, rule]) => rule.triggers && rule.triggers.includes(trigger))
            .sort(([,a], [,b]) => (b.priority || 0) - (a.priority || 0)); // Prioridad descendente

        if (applicableRules.length === 0) {

            return null;
        }



        let firstMatchResult = null;
        let executedRules = [];

        for (const [ruleId, rule] of applicableRules) {
            const categoryIcon = this.getCategoryIcon(rule.category);


            try {
                const conditionResult = this.queryEngine.evaluateCondition(rule.condition, context);
                
                if (conditionResult) {
                    console.log(`✅ Regla cumplida: ${ruleId}`);
                    
                    // Resolver variables
                    const resolvedVariables = this.resolveRuleVariables(rule.variables, conditionResult);
                    
                    // Ejecutar acciones (solo las activas)
                    if (rule.actions && rule.actions.length > 0) {
                        this.actionExecutor.executeActions(rule.actions, context, resolvedVariables);
                    }
                    
                    executedRules.push(ruleId);
                    
                    // Guardar primer resultado para compatibilidad
                    if (!firstMatchResult) {
                        firstMatchResult = { ...conditionResult, ruleId };
                    }
                } else {
                    console.log(`❌ Regla no cumplida: ${ruleId}`);
                }
            } catch (error) {
                console.error(`💥 Error evaluando regla ${ruleId}:`, error);
            }
        }

        if (executedRules.length > 0) {
            console.log(`🎯 Reglas ejecutadas: ${executedRules.join(', ')}`);
        }

        return firstMatchResult;
    }

    /**
     * 🔧 Resolver variables de una regla (GENÉRICO)
     */
    resolveRuleVariables(variables, conditionResult) {
        const resolved = {};
        
        if (variables) {
            Object.entries(variables).forEach(([varName, varConfig]) => {
                if (varConfig.source) {
                    const path = varConfig.source.split('.');
                    let value = conditionResult;
                    
                    for (const key of path) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        } else {
                            value = undefined;
                            break;
                        }
                    }
                    
                    resolved[varName] = value;
                }
            });
        }
        
        return resolved;
    }

    /**
     * 🔄 Recargar reglas (útil para desarrollo y cambios dinámicos)
     */
    async reloadRules() {
        console.log('🔄 Recargando reglas...');
        this.rules.clear();
        this.loadRules();
        console.log('✅ Reglas recargadas');
    }

    /**
     * 📊 Obtener información de reglas (GENÉRICO)
     */
    getRulesInfo() {
        return {
            totalRules: this.rules.size,
            activeRules: Array.from(this.rules.keys()),
            isInitialized: this.isInitialized,
            hasStateManager: !!this.stateManager,
            hasRulesProvider: !!this.rulesProvider
        };
    }

    /**
     * 🎨 Obtener icono para categoría de regla (GENÉRICO)
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

    /**
     * 🔄 Sincronizar con cambios de estado (llamar después de modificaciones)
     */
    async syncWithStateManager() {
        if (this.stateManager) {
            console.log('🔄 Sincronizando con StateManager...');
            await this.reloadRules();
        }
    }
}

// Exportar clase para uso en otros módulos (SIN INSTANCIA GLOBAL)
if (typeof window !== 'undefined') {
    window.BusinessRulesEngine = BusinessRulesEngine;
}

// Para Node.js o módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessRulesEngine;
}
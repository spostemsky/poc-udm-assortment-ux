/**
 * 🚀 BUSINESS RULES ENGINE - Motor Principal
 * Coordina la evaluación de reglas y ejecución de acciones
 * 
 * ✅ GENÉRICO Y REUTILIZABLE:
 * - Sin dependencias específicas del proyecto
 * - Inyección de dependencias configurable
 * - 100% portable a otros proyectos
 */
class BusinessRulesEngine {
    constructor(queryEngine = null, actionExecutor = null) {
        this.rules = new Map();
        
        // 🔌 INYECCIÓN DE DEPENDENCIAS
        this.queryEngine = queryEngine || new GenericQueryEngine();
        this.actionExecutor = actionExecutor || new ActionExecutor();
        
        this.isInitialized = false;
        
        console.log('🏗️ BusinessRulesEngine creado con:', {
            queryEngine: this.queryEngine.constructor.name,
            actionExecutor: this.actionExecutor.constructor.name
        });
    }

    /**
     * Inicializar el motor de reglas
     */
    async initialize() {
        console.log('🔄 Inicializando Business Rules Engine...');
        
        try {
            this.loadRules();
            this.isInitialized = true;
            console.log('✅ Business Rules Engine inicializado correctamente');
            return true;
        } catch (error) {
            console.error('💥 Error inicializando Business Rules Engine:', error);
            return false;
        }
    }

    /**
     * Cargar todas las reglas desde las categorías
     */
    loadRules() {
        if (!window.BUSINESS_RULES_CATEGORY) {
            console.warn('⚠️ No se encontraron categorías de reglas cargadas');
            return;
        }

        // Combinar todas las categorías de reglas
        const allRules = {};
        Object.keys(window.BUSINESS_RULES_CATEGORY).forEach(categoryName => {
            const categoryRules = window.BUSINESS_RULES_CATEGORY[categoryName];
            Object.assign(allRules, categoryRules);
        });

        let activeCount = 0;
        let inactiveCount = 0;

        Object.entries(allRules).forEach(([ruleId, rule]) => {
            if (rule.active) {
                this.rules.set(ruleId, rule);
                activeCount++;
                console.log(`✅ Regla cargada: ${ruleId} (${rule.name})`);
            } else {
                inactiveCount++;
                console.log(`⏸️ Regla inactiva: ${ruleId} (${rule.name})`);
            }
        });

        console.log(`📊 Reglas cargadas: ${activeCount} activas, ${inactiveCount} inactivas`);
        
        if (activeCount === 0) {
            console.warn('⚠️ No hay reglas activas cargadas');
        }
    }

    /**
     * Evaluar reglas para un trigger específico
     */
    evaluateRules(trigger, context) {
        if (!this.isInitialized) {
            console.warn('⚠️ Business Rules Engine no inicializado');
            return null;
        }

        // Filtrar reglas aplicables
        const applicableRules = Array.from(this.rules.entries())
            .filter(([ruleId, rule]) => rule.triggers.includes(trigger))
            .sort(([,a], [,b]) => b.priority - a.priority); // Prioridad descendente

        if (applicableRules.length === 0) {
            console.log(`🔍 No hay reglas aplicables para trigger: ${trigger}`);
            return null;
        }

        console.log(`🔍 Evaluando ${applicableRules.length} reglas para trigger: ${trigger}`);

        let firstMatchResult = null;
        let executedRules = [];

        for (const [ruleId, rule] of applicableRules) {
            const categoryIcon = this.getCategoryIcon(rule.category);
            console.log(`🔍 Evaluando regla: ${ruleId} (${rule.name}) - ${categoryIcon} ${rule.category} - Prioridad: ${rule.priority}`);

            try {
                const conditionResult = this.queryEngine.evaluateCondition(rule.condition, context);
                
                if (conditionResult) {
                    console.log(`✅ Regla cumplida: ${ruleId}`);
                    
                    // Resolver variables
                    const resolvedVariables = this.resolveRuleVariables(rule.variables, conditionResult);
                    
                    // Ejecutar acciones
                    this.actionExecutor.executeActions(rule.actions, context, resolvedVariables);
                    
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
     * Resolver variables de una regla
     */
    resolveRuleVariables(variables, conditionResult) {
        const resolved = {};
        
        if (variables) {
            Object.entries(variables).forEach(([varName, varConfig]) => {
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
            });
        }
        
        return resolved;
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
     * Función de compatibilidad para verificarCoincidenciaExacta
     */
    verificarCoincidenciaExacta(vendorSkuFactura, numeroOrdenCompra) {
        console.log('🔄 verificarCoincidenciaExacta() via Business Rules Engine');
        
        if (!this.isInitialized) {
            console.warn('⚠️ Business Rules Engine no disponible');
            return null;
        }

        // Simular contexto para compatibilidad
        const context = {
            itemId: vendorSkuFactura, // Aproximación
            sapOrderId: numeroOrdenCompra
        };

        const result = this.evaluateRules('on_container_initialize', context);
        return result;
    }

    /**
     * Recargar reglas (útil para desarrollo)
     */
    async reloadRules() {
        console.log('🔄 Recargando reglas...');
        this.rules.clear();
        this.loadRules();
    }

    /**
     * Activar/desactivar una regla específica
     */
    setRuleActive(ruleId, active) {
        // Buscar en todas las categorías
        let found = false;
        Object.keys(window.BUSINESS_RULES_CATEGORY).forEach(categoryName => {
            const categoryRules = window.BUSINESS_RULES_CATEGORY[categoryName];
            if (categoryRules[ruleId]) {
                categoryRules[ruleId].active = active;
                found = true;
            }
        });

        if (found) {
            // Recargar reglas para aplicar el cambio
            this.reloadRules();
            console.log(`🔄 Regla ${ruleId} ${active ? 'activada' : 'desactivada'}`);
        } else {
            console.warn(`⚠️ Regla ${ruleId} no encontrada`);
        }
    }

    /**
     * Obtener información de reglas
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

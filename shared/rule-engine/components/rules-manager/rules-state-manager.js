/**
 * 💾 RULES STATE MANAGER
 * Gestor de estado para el componente Rules Manager
 * Maneja la persistencia en localStorage y reset de reglas
 * 
 * ✅ CARACTERÍSTICAS:
 * - Persistencia automática en localStorage
 * - Reset a configuración original
 * - Gestión de overrides por regla y acción
 * - Completamente portable entre proyectos
 */
class RulesStateManager {
    constructor(config = {}) {
        this.storageKey = config.storageKey || 'business_rules_overrides';
        this.originalRules = null;
        this.initialized = false;
        
        console.log(`💾 RulesStateManager inicializado con storage key: ${this.storageKey}`);
    }

    /**
     * 🚀 Inicializar con las reglas originales del sistema
     */
    initialize() {
        if (this.initialized) {
            return;
        }

        // Cargar reglas originales desde el sistema
        this.loadOriginalRules();
        this.initialized = true;
        
        console.log('✅ RulesStateManager inicializado con', Object.keys(this.originalRules).length, 'reglas');
    }

    /**
     * 📖 Cargar reglas originales desde las categorías
     */
    loadOriginalRules() {
        this.originalRules = {};
        
        if (window.BUSINESS_RULES_CATEGORY) {
            Object.keys(window.BUSINESS_RULES_CATEGORY).forEach(categoryName => {
                const categoryRules = window.BUSINESS_RULES_CATEGORY[categoryName];
                Object.assign(this.originalRules, categoryRules);
            });
        }
        
        console.log('📖 Reglas originales cargadas:', Object.keys(this.originalRules));
    }

    /**
     * 💾 Obtener overrides actuales del localStorage
     */
    getOverrides() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                return this.createEmptyOverrides();
            }
            
            const overrides = JSON.parse(stored);
            
            // Validar estructura
            if (!overrides.version || !overrides.rules) {
                console.warn('⚠️ Estructura de overrides inválida, creando nueva');
                return this.createEmptyOverrides();
            }
            
            return overrides;
        } catch (error) {
            console.error('💥 Error leyendo overrides del localStorage:', error);
            return this.createEmptyOverrides();
        }
    }

    /**
     * 📝 Crear estructura vacía de overrides
     */
    createEmptyOverrides() {
        return {
            version: "1.0",
            last_modified: new Date().toISOString(),
            rules: {}
        };
    }

    /**
     * 💾 Guardar overrides en localStorage
     */
    saveOverrides(overrides) {
        try {
            overrides.last_modified = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(overrides, null, 2));
            console.log('💾 Overrides guardados correctamente');
        } catch (error) {
            console.error('💥 Error guardando overrides:', error);
        }
    }

    /**
     * 🔄 Guardar estado de una regla completa
     */
    saveRuleState(ruleId, active) {
        const overrides = this.getOverrides();
        
        if (!overrides.rules[ruleId]) {
            overrides.rules[ruleId] = {};
        }
        
        overrides.rules[ruleId].active = active;
        this.saveOverrides(overrides);
        
        console.log(`🔄 Estado de regla guardado: ${ruleId} = ${active}`);
    }

    /**
     * ⚙️ Guardar estado de una acción específica
     */
    saveActionState(ruleId, actionIndex, active) {
        const overrides = this.getOverrides();
        
        if (!overrides.rules[ruleId]) {
            overrides.rules[ruleId] = {};
        }
        
        if (!overrides.rules[ruleId].actions) {
            overrides.rules[ruleId].actions = {};
        }
        
        overrides.rules[ruleId].actions[actionIndex] = { active };
        this.saveOverrides(overrides);
        
        console.log(`⚙️ Estado de acción guardado: ${ruleId}[${actionIndex}] = ${active}`);
    }

    /**
     * 📊 Obtener estado efectivo de una regla
     */
    getRuleEffectiveState(ruleId) {
        if (!this.originalRules[ruleId]) {
            console.warn(`⚠️ Regla no encontrada: ${ruleId}`);
            return null;
        }

        const originalRule = this.originalRules[ruleId];
        const overrides = this.getOverrides();
        const ruleOverrides = overrides.rules[ruleId] || {};

        return {
            id: ruleId,
            name: originalRule.name,
            description: originalRule.description,
            category: originalRule.category,
            priority: originalRule.priority,
            active: ruleOverrides.active !== undefined ? ruleOverrides.active : originalRule.active,
            actions: this.getActionsEffectiveState(ruleId),
            original: originalRule
        };
    }

    /**
     * ⚙️ Obtener estado efectivo de las acciones de una regla
     */
    getActionsEffectiveState(ruleId) {
        const originalRule = this.originalRules[ruleId];
        if (!originalRule || !originalRule.actions) {
            return [];
        }

        const overrides = this.getOverrides();
        const ruleOverrides = overrides.rules[ruleId] || {};
        const actionOverrides = ruleOverrides.actions || {};

        return originalRule.actions.map((action, index) => ({
            ...action,
            index,
            active: actionOverrides[index] ? actionOverrides[index].active : (action.active !== undefined ? action.active : true)
        }));
    }

    /**
     * 📋 Obtener todas las reglas con su estado efectivo
     */
    getAllRulesEffectiveState() {
        const allRules = {};
        
        Object.keys(this.originalRules).forEach(ruleId => {
            allRules[ruleId] = this.getRuleEffectiveState(ruleId);
        });
        
        return allRules;
    }

    /**
     * 📊 Obtener estadísticas de reglas
     */
    getRulesStats() {
        const allRules = this.getAllRulesEffectiveState();
        const categories = {};
        let totalRules = 0;
        let activeRules = 0;

        Object.values(allRules).forEach(rule => {
            totalRules++;
            
            if (rule.active) {
                activeRules++;
            }

            const category = rule.category || 'unknown';
            if (!categories[category]) {
                categories[category] = { total: 0, active: 0 };
            }
            
            categories[category].total++;
            if (rule.active) {
                categories[category].active++;
            }
        });

        return {
            totalRules,
            activeRules,
            categories
        };
    }

    /**
     * 🔄 Resetear a configuración original
     */
    resetToOriginal() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🔄 Overrides eliminados - reglas reseteadas a configuración original');
            return true;
        } catch (error) {
            console.error('💥 Error reseteando reglas:', error);
            return false;
        }
    }

    /**
     * 📅 Obtener información de último reset
     */
    getLastResetInfo() {
        const overrides = this.getOverrides();
        
        if (!overrides.last_modified || Object.keys(overrides.rules).length === 0) {
            return { hasChanges: false, lastReset: 'Never' };
        }
        
        return {
            hasChanges: true,
            lastModified: new Date(overrides.last_modified).toLocaleString(),
            changedRules: Object.keys(overrides.rules).length
        };
    }

    /**
     * 🔍 Verificar si una regla tiene cambios respecto al original
     */
    hasRuleChanges(ruleId) {
        const overrides = this.getOverrides();
        return overrides.rules[ruleId] !== undefined;
    }

    /**
     * 🔍 Verificar si una acción tiene cambios respecto al original
     */
    hasActionChanges(ruleId, actionIndex) {
        const overrides = this.getOverrides();
        return overrides.rules[ruleId]?.actions?.[actionIndex] !== undefined;
    }

    /**
     * 🧹 Limpiar overrides vacíos (optimización de almacenamiento)
     */
    cleanupEmptyOverrides() {
        const overrides = this.getOverrides();
        let cleaned = false;

        Object.keys(overrides.rules).forEach(ruleId => {
            const ruleOverride = overrides.rules[ruleId];
            
            // Limpiar acciones vacías
            if (ruleOverride.actions) {
                const hasActionOverrides = Object.keys(ruleOverride.actions).length > 0;
                if (!hasActionOverrides) {
                    delete ruleOverride.actions;
                    cleaned = true;
                }
            }
            
            // Limpiar reglas vacías
            const hasRuleOverrides = Object.keys(ruleOverride).length > 0;
            if (!hasRuleOverrides) {
                delete overrides.rules[ruleId];
                cleaned = true;
            }
        });

        if (cleaned) {
            this.saveOverrides(overrides);
            console.log('🧹 Overrides vacíos limpiados');
        }
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.RulesStateManager = RulesStateManager;
}

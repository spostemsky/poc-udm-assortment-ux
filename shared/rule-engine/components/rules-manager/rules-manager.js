/**
 * 🎛️ RULES MANAGER COMPONENT
 * Componente principal para gestión visual de reglas de negocio
 * 
 * ✅ CARACTERÍSTICAS:
 * - 100% portable entre proyectos
 * - Auto-detección de reglas existentes
 * - Persistencia automática en localStorage
 * - Temas configurables (default, dark, minimal)
 * - Posiciones flexibles (left, right, top, bottom)
 * - API de eventos para integración
 */
class RulesManager {
    constructor(config = {}) {
        // ✅ CONFIGURACIÓN DINÁMICA
        this.config = {
            container: config.container || '#rules-manager-panel',
            engine: config.engine || window.businessRulesEngine,
            storageKey: config.storageKey || 'business_rules_overrides',
            theme: config.theme || 'default',
            position: config.position || 'left',
            searchEnabled: config.searchEnabled !== false,
            resetEnabled: config.resetEnabled !== false,
            autoSave: config.autoSave !== false,
            
            // Callbacks
            onRuleToggle: config.onRuleToggle || (() => {}),
            onActionToggle: config.onActionToggle || (() => {}),
            onReset: config.onReset || (() => {}),
            onReady: config.onReady || (() => {})
        };

        // Estado interno
        this.stateManager = null;
        this.containerElement = null;
        this.searchTerm = '';
        this.expandedRules = new Set();
        this.initialized = false;

        console.log('🎛️ RulesManager inicializando con configuración:', this.config);
        
        // Inicializar automáticamente
        this.init();
    }

    /**
     * 🚀 Inicializar el componente
     */
    async init() {
        try {
            // Esperar a que el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.init());
                return;
            }

            // Verificar contenedor
            this.containerElement = typeof this.config.container === 'string' 
                ? document.querySelector(this.config.container)
                : this.config.container;

            if (!this.containerElement) {
                console.error(`❌ Contenedor no encontrado: ${this.config.container}`);
                return;
            }

            // Inicializar state manager
            this.stateManager = new RulesStateManager({
                storageKey: this.config.storageKey
            });

            // Esperar a que las reglas estén disponibles
            await this.waitForRulesEngine();
            
            // Inicializar state manager con reglas
            this.stateManager.initialize();

            // Crear la interfaz
            this.render();
            
            // Configurar eventos
            this.setupEventListeners();
            
            this.initialized = true;
            console.log('✅ RulesManager inicializado correctamente');
            
            // Callback de ready
            this.config.onReady(this);
            
        } catch (error) {
            console.error('💥 Error inicializando RulesManager:', error);
        }
    }

    /**
     * ⏳ Esperar a que el engine de reglas esté disponible
     */
    async waitForRulesEngine() {
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            if (window.BUSINESS_RULES_CATEGORY && this.config.engine) {
                return;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        console.warn('⚠️ Timeout esperando rules engine - continuando con detección automática');
    }

    /**
     * 🎨 Renderizar la interfaz completa
     */
    render() {
        // Aplicar tema
        this.containerElement.setAttribute('data-rules-theme', this.config.theme);
        
        // Crear HTML principal
        this.containerElement.innerHTML = this.getMainHTML();
        
        // Renderizar contenido
        this.renderContent();
        
        // Cargar estilos si no están cargados
        this.loadStyles();
    }

    /**
     * 📝 Generar HTML principal del componente
     */
    getMainHTML() {
        const stats = this.stateManager.getRulesStats();
        const resetInfo = this.stateManager.getLastResetInfo();

        return `
            <div class="rules-manager-container">
                <div class="rules-manager-header">
                    <h3 class="rules-manager-title">
                        🎛️ Business Rules Manager
                    </h3>
                    
                    <div class="rules-manager-stats">
                        <span class="rules-stats-text">
                            Active: ${stats.activeRules}/${stats.totalRules} rules
                        </span>
                        ${this.config.resetEnabled ? `
                            <button class="rules-reset-btn" data-action="reset">
                                🔄 Reset
                            </button>
                        ` : ''}
                    </div>
                    
                    ${this.config.searchEnabled ? `
                        <div class="rules-search-container">
                            <input 
                                type="text" 
                                class="rules-search-input" 
                                placeholder="🔍 Search rules..." 
                                data-search="input"
                                value="${this.searchTerm}"
                            >
                        </div>
                    ` : ''}
                </div>
                
                <div class="rules-manager-content" data-content="main">
                    <!-- Contenido dinámico -->
                </div>
                
                <div class="rules-manager-footer">
                    <div class="rules-footer-info">
                        <span>💾 Changes saved automatically</span>
                        <span>🔄 Last reset: ${resetInfo.lastReset || 'Never'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 🎨 Renderizar contenido principal (categorías y reglas)
     */
    renderContent() {
        const contentContainer = this.containerElement.querySelector('[data-content="main"]');
        const allRules = this.stateManager.getAllRulesEffectiveState();
        const stats = this.stateManager.getRulesStats();
        
        // Filtrar reglas por búsqueda
        const filteredRules = this.filterRulesBySearch(allRules);
        
        // Agrupar por categorías
        const rulesByCategory = this.groupRulesByCategory(filteredRules);
        
        // Generar HTML por categoría
        let contentHTML = '';
        
        if (Object.keys(filteredRules).length === 0) {
            contentHTML = `
                <div class="rules-no-results">
                    ${this.searchTerm ? '🔍 No rules found matching your search' : '📋 No rules configured'}
                </div>
            `;
        } else {
            Object.keys(rulesByCategory).forEach(category => {
                const categoryRules = rulesByCategory[category];
                const categoryStats = stats.categories[category] || { total: 0, active: 0 };
                
                contentHTML += this.getCategoryHTML(category, categoryRules, categoryStats);
            });
        }
        
        contentContainer.innerHTML = contentHTML;
    }

    /**
     * 📂 Generar HTML de una categoría
     */
    getCategoryHTML(category, rules, stats) {
        const categoryIcon = this.getCategoryIcon(category);
        const categoryName = category.toUpperCase();
        
        return `
            <div class="rules-category" data-category="${category}">
                <div class="rules-category-header">
                    <div class="rules-category-title">
                        ${categoryIcon} ${categoryName}
                    </div>
                    <div class="rules-category-stats">
                        ${stats.active}/${stats.total}
                    </div>
                </div>
                
                <div class="rules-category-content">
                    ${rules.map(rule => this.getRuleHTML(rule)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * 📋 Generar HTML de una regla
     */
    getRuleHTML(rule) {
        const isExpanded = this.expandedRules.has(rule.id);
        const hasChanges = this.stateManager.hasRuleChanges(rule.id);
        
        return `
            <div class="rules-rule-item ${rule.active ? 'active' : 'inactive'} ${isExpanded ? 'expanded' : ''}" 
                 data-rule-id="${rule.id}">
                
                <div class="rules-rule-header" data-action="toggle-expand">
                    <div class="rules-rule-info">
                        <h4 class="rules-rule-name">
                            ${hasChanges ? '🔸' : '⚪'} ${rule.name}
                        </h4>
                        <p class="rules-rule-description">
                            ${rule.description}
                        </p>
                    </div>
                    
                    <div class="rules-rule-meta">
                        <div class="rules-priority-badge">
                            P${rule.priority}
                        </div>
                        
                        <div class="rules-toggle ${rule.active ? 'active' : ''}" 
                             data-action="toggle-rule"
                             data-rule-id="${rule.id}">
                        </div>
                        
                        <span class="rules-expand-icon">▼</span>
                    </div>
                </div>
                
                <div class="rules-actions-container">
                    <div class="rules-actions-list">
                        ${rule.actions.map((action, index) => this.getActionHTML(rule.id, action, index)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * ⚙️ Generar HTML de una acción
     */
    getActionHTML(ruleId, action, index) {
        const hasChanges = this.stateManager.hasActionChanges(ruleId, index);
        
        return `
            <div class="rules-action-item ${action.active ? 'active' : 'inactive'}" 
                 data-rule-id="${ruleId}" 
                 data-action-index="${index}">
                
                <div class="rules-action-info">
                    <div class="rules-action-type">
                        ${hasChanges ? '🔸' : '⚪'} ${action.type}
                    </div>
                    <div class="rules-action-message">
                        ${action.message || action.target || 'Sin descripción disponible'}
                    </div>
                </div>
                
                <div class="rules-action-toggle ${action.active ? 'active' : ''}" 
                     data-action="toggle-action"
                     data-rule-id="${ruleId}"
                     data-action-index="${index}">
                </div>
            </div>
        `;
    }

    /**
     * 🔍 Filtrar reglas por término de búsqueda
     */
    filterRulesBySearch(allRules) {
        if (!this.searchTerm) {
            return allRules;
        }

        const filtered = {};
        const searchLower = this.searchTerm.toLowerCase();

        Object.keys(allRules).forEach(ruleId => {
            const rule = allRules[ruleId];
            const matchesName = rule.name.toLowerCase().includes(searchLower);
            const matchesDescription = rule.description.toLowerCase().includes(searchLower);
            const matchesCategory = rule.category.toLowerCase().includes(searchLower);
            
            if (matchesName || matchesDescription || matchesCategory) {
                filtered[ruleId] = rule;
            }
        });

        return filtered;
    }

    /**
     * 📂 Agrupar reglas por categoría
     */
    groupRulesByCategory(rules) {
        const grouped = {};

        Object.values(rules).forEach(rule => {
            const category = rule.category || 'unknown';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(rule);
        });

        // Ordenar reglas por prioridad dentro de cada categoría
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => (a.priority || 999) - (b.priority || 999));
        });

        return grouped;
    }

    /**
     * 🎯 Configurar event listeners
     */
    setupEventListeners() {
        // Delegación de eventos en el contenedor principal
        this.containerElement.addEventListener('click', this.handleClick.bind(this));
        
        // Búsqueda
        if (this.config.searchEnabled) {
            const searchInput = this.containerElement.querySelector('[data-search="input"]');
            if (searchInput) {
                searchInput.addEventListener('input', this.handleSearch.bind(this));
            }
        }
    }

    /**
     * 🖱️ Manejar clicks en el componente
     */
    handleClick(event) {
        const action = event.target.getAttribute('data-action');
        
        switch (action) {
            case 'toggle-rule':
                this.handleRuleToggle(event);
                break;
            case 'toggle-action':
                this.handleActionToggle(event);
                break;
            case 'toggle-expand':
                this.handleExpandToggle(event);
                break;
            case 'reset':
                this.handleReset();
                break;
        }
    }

    /**
     * 🔄 Manejar toggle de regla
     */
    handleRuleToggle(event) {
        const ruleId = event.target.getAttribute('data-rule-id');
        const currentRule = this.stateManager.getRuleEffectiveState(ruleId);
        const newActive = !currentRule.active;
        
        // Guardar estado
        this.stateManager.saveRuleState(ruleId, newActive);
        
        // Re-renderizar
        this.renderContent();
        
        // Aplicar cambios al engine
        this.applyRuleChanges(ruleId);
        
        // Callback
        this.config.onRuleToggle(ruleId, newActive, currentRule);
        
        // Notificación
        this.showNotification(
            `✅ Rule "${currentRule.name}" ${newActive ? 'activated' : 'deactivated'}`
        );
        
        console.log(`🔄 Rule toggled: ${ruleId} = ${newActive}`);
    }

    /**
     * ⚙️ Manejar toggle de acción
     */
    handleActionToggle(event) {
        const ruleId = event.target.getAttribute('data-rule-id');
        const actionIndex = parseInt(event.target.getAttribute('data-action-index'));
        const currentRule = this.stateManager.getRuleEffectiveState(ruleId);
        const currentAction = currentRule.actions[actionIndex];
        const newActive = !currentAction.active;
        
        // Guardar estado
        this.stateManager.saveActionState(ruleId, actionIndex, newActive);
        
        // Verificar si todas las acciones están inactivas
        this.checkAndUpdateRuleState(ruleId);
        
        // Re-renderizar
        this.renderContent();
        
        // Aplicar cambios al engine
        this.applyRuleChanges(ruleId);
        
        // Callback
        this.config.onActionToggle(ruleId, actionIndex, newActive, currentAction);
        
        // Notificación
        this.showNotification(
            `⚙️ Action "${currentAction.message || currentAction.type}" ${newActive ? 'activated' : 'deactivated'}`
        );
        
        console.log(`⚙️ Action toggled: ${ruleId}[${actionIndex}] = ${newActive}`);
    }

    /**
     * 🔄 Verificar y actualizar estado de regla basado en acciones
     */
    checkAndUpdateRuleState(ruleId) {
        const currentRule = this.stateManager.getRuleEffectiveState(ruleId);
        
        // Verificar si todas las acciones están inactivas
        const allActionsInactive = currentRule.actions.every(action => !action.active);
        
        if (allActionsInactive && currentRule.active) {
            // Auto-desactivar regla si todas las acciones están inactivas
            console.log(`🔄 Auto-desactivando regla ${ruleId}: todas las acciones están inactivas`);
            this.stateManager.saveRuleState(ruleId, false);
            
            // Notificación
            this.showNotification(
                `⚠️ Regla "${currentRule.name}" desactivada automáticamente (todas las acciones inactivas)`,
                'warning'
            );
            
            // Callback
            this.config.onRuleToggle(ruleId, false, currentRule);
            
        } else if (!allActionsInactive && !currentRule.active) {
            // Auto-activar regla si al menos una acción está activa y la regla estaba inactiva
            console.log(`🔄 Auto-activando regla ${ruleId}: al menos una acción está activa`);
            this.stateManager.saveRuleState(ruleId, true);
            
            // Notificación
            this.showNotification(
                `✅ Regla "${currentRule.name}" activada automáticamente`,
                'success'
            );
            
            // Callback
            this.config.onRuleToggle(ruleId, true, currentRule);
        }
    }

    /**
     * 📂 Manejar expansión/colapso de regla
     */
    handleExpandToggle(event) {
        const ruleItem = event.target.closest('.rules-rule-item');
        const ruleId = ruleItem.getAttribute('data-rule-id');
        
        if (this.expandedRules.has(ruleId)) {
            this.expandedRules.delete(ruleId);
            ruleItem.classList.remove('expanded');
        } else {
            this.expandedRules.add(ruleId);
            ruleItem.classList.add('expanded');
        }
    }

    /**
     * 🔍 Manejar búsqueda
     */
    handleSearch(event) {
        this.searchTerm = event.target.value;
        this.renderContent();
    }

    /**
     * 🔄 Manejar reset completo
     */
    handleReset() {
        const confirmed = confirm(
            '¿Estás seguro de que quieres resetear todas las reglas a su configuración original?\n\n' +
            'Esta acción eliminará todos los cambios personalizados.'
        );
        
        if (confirmed) {
            const success = this.stateManager.resetToOriginal();
            
            if (success) {
                // Limpiar término de búsqueda
                this.searchTerm = '';
                
                // Re-renderizar contenido solamente (mantiene event listeners)
                this.renderContent();
                
                // Limpiar el input de búsqueda
                const searchInput = this.containerElement.querySelector('[data-search="input"]');
                if (searchInput) {
                    searchInput.value = '';
                }
                
                // Aplicar cambios al engine
                this.applyAllRules();
                
                // Callback
                this.config.onReset();
                
                // Notificación
                this.showNotification('🔄 All rules reset to original configuration');
                
                console.log('🔄 All rules reset to original configuration');
            } else {
                this.showNotification('❌ Error resetting rules', 'error');
            }
        }
    }

    /**
     * 🎨 Aplicar cambios de una regla específica al engine
     */
    applyRuleChanges(ruleId) {
        console.log(`🎨 Applying changes for rule: ${ruleId}`);
        
        // COMUNICACIÓN INTER-VENTANA: Disparar evento personalizado global
        this.broadcastRuleChange(ruleId);
        
        // Si estamos en la misma ventana, aplicar directamente
        if (window.syncBusinessRulesWithManager) {
            console.log('🔄 Sincronizando reglas en la misma ventana...');
            window.syncBusinessRulesWithManager();
        }
    }

    /**
     * 🎨 Aplicar todas las reglas al engine
     */
    /**
     * 📡 Comunicar cambio de regla a otras ventanas/pestañas
     */
    broadcastRuleChange(ruleId) {
        console.log(`🚀 INICIANDO broadcast para regla: ${ruleId}`);
        try {
            // OPCIÓN 1: LocalStorage event (funciona entre pestañas)
            const changeEvent = {
                type: 'rule_change',
                ruleId: ruleId,
                timestamp: Date.now(),
                storageKey: this.config.storageKey
            };
            
            console.log('📡 Disparando evento localStorage...');
            // Disparar evento de storage para comunicación inter-pestaña
            localStorage.setItem('rules_change_trigger', JSON.stringify(changeEvent));
            localStorage.removeItem('rules_change_trigger'); // Trigger del evento
            
            console.log('🎯 Disparando custom event...');
            // OPCIÓN 2: Custom event (funciona en la misma ventana)
            const customEvent = new CustomEvent('rulesChanged', {
                detail: changeEvent
            });
            window.dispatchEvent(customEvent);
            
            console.log(`✅ Broadcast completado para regla: ${ruleId}`);
            
        } catch (error) {
            console.error('💥 Error broadcasting rule change:', error);
        }
    }

    applyAllRules() {
        console.log('🎨 Applying all rules to engine');
        
        // Broadcast para todas las reglas
        this.broadcastRuleChange('*');
    }

    /**
     * 📱 Mostrar notificación
     */
    showNotification(message, type = 'success') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `rules-notification ${type}`;
        notification.textContent = message;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    /**
     * 🎨 Cargar estilos del componente
     */
    loadStyles() {
        const styleId = 'rules-manager-styles';
        
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = this.getStylesPath();
            document.head.appendChild(link);
        }
    }

    /**
     * 📍 Obtener ruta de los estilos
     */
    getStylesPath() {
        // Intentar detectar la ruta automáticamente
        const scripts = document.querySelectorAll('script[src]');
        for (let script of scripts) {
            if (script.src.includes('rules-manager.js')) {
                return script.src.replace('rules-manager.js', 'rules-manager.css');
            }
        }
        
        // Fallback
        return '../shared/rule-engine/components/rules-manager/rules-manager.css';
    }

    /**
     * 🎯 Obtener icono de categoría
     */
    getCategoryIcon(category) {
        const icons = {
            business: '💼',
            ux: '🎨',
            ui: '🖥️',
            validation: '✅',
            unknown: '❓'
        };
        
        return icons[category] || icons.unknown;
    }

    /**
     * 📊 API pública - Obtener estadísticas
     */
    getStats() {
        return this.stateManager ? this.stateManager.getRulesStats() : null;
    }

    /**
     * 📋 API pública - Obtener todas las reglas
     */
    getAllRules() {
        return this.stateManager ? this.stateManager.getAllRulesEffectiveState() : null;
    }

    /**
     * 🔄 API pública - Refrescar interfaz
     */
    refresh() {
        if (this.initialized) {
            this.renderContent();
        }
    }

    /**
     * 🎨 API pública - Cambiar tema
     */
    setTheme(theme) {
        this.config.theme = theme;
        if (this.containerElement) {
            this.containerElement.setAttribute('data-rules-theme', theme);
        }
    }

    /**
     * 🗑️ API pública - Destruir componente
     */
    destroy() {
        if (this.containerElement) {
            this.containerElement.innerHTML = '';
            this.containerElement.removeAttribute('data-rules-theme');
        }
        
        this.initialized = false;
        console.log('🗑️ RulesManager destruido');
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.RulesManager = RulesManager;
}

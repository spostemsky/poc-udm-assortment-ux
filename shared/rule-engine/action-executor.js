/**
 * ⚡ ACTION EXECUTOR - Ejecutor de Acciones
 * Maneja todas las acciones definidas en las reglas del Business Rules Engine
 */
class ActionExecutor {
    constructor() {
        this.actionHandlers = new Map();
        this.setupDefaultActions();
    }

    /**
     * Configurar manejadores de acciones por defecto
     */
    setupDefaultActions() {
        this.actionHandlers.set('preselect_dropdown', this.preselectDropdown.bind(this));
        this.actionHandlers.set('disable_dropdown', this.disableDropdown.bind(this));
        this.actionHandlers.set('hide_element', this.hideElement.bind(this));
        this.actionHandlers.set('set_container_attribute', this.setContainerAttribute.bind(this));
        this.actionHandlers.set('collapse_container', this.collapseContainer.bind(this));
        this.actionHandlers.set('filter_container', this.filterContainer.bind(this));
        this.actionHandlers.set('show_container_normal', this.showContainerNormal.bind(this));
    }

    /**
     * Ejecutar una lista de acciones
     */
    executeActions(actions, context, variables) {
        if (!Array.isArray(actions)) {
            console.warn('⚠️ Actions debe ser un array');
            return;
        }

        actions.forEach(action => {
            this.executeAction(action, context, variables);
        });
    }

    /**
     * Ejecutar una acción específica
     */
    executeAction(action, context, variables) {

        // ✅ VERIFICAR SI LA ACCIÓN ESTÁ ACTIVA
        if (action.active === false) {
            return;
        }

        const handler = this.actionHandlers.get(action.type);
        if (handler) {
            handler(action, context, variables);
        } else {
            console.warn(`⚠️ Tipo de acción no soportado: ${action.type}`);
        }
    }

    /**
     * Pre-seleccionar un valor en un dropdown
     * Implementa acciones del Business Rules Engine
     */
    preselectDropdown(action, context, variables) {
        const container = context.container;
        if (!container) return;

        const dropdown = container.querySelector('.custom-dropdown');
        if (!dropdown) return;

        const value = this.resolveVariableValue(action.value, variables, context);
        const displayText = this.resolveVariableValue(action.display_text, variables, context);
        const message = this.resolveVariableValue(action.message, variables, context);

        // Pre-seleccionar el valor
        dropdown.setAttribute('data-value', value);

        // Actualizar visualización
        const placeholderSpan = dropdown.querySelector('.custom-dropdown-selected span:not(.custom-dropdown-arrow)');
        if (placeholderSpan) {
            placeholderSpan.textContent = displayText;
            placeholderSpan.className = '';
        }

        // Actualizar descripción
        const descriptionDiv = container.querySelector('.product-description');
        if (descriptionDiv) {
            descriptionDiv.textContent = message;
        }

        console.log('✅ Dropdown pre-seleccionado:', value);
    }

    /**
     * Deshabilitar dropdown
     * Implementa acciones del Business Rules Engine
     */
    disableDropdown(action, context, variables) {
        const container = context.container;
        if (!container) return;

        const dropdown = container.querySelector('.custom-dropdown');
        if (!dropdown) return;

        const selectedDiv = dropdown.querySelector('.custom-dropdown-selected');
        if (selectedDiv && action.visual_style) {
            Object.assign(selectedDiv.style, action.visual_style);
            selectedDiv.replaceWith(selectedDiv.cloneNode(true));
        }

        // Ocultar opciones
        const optionsContainer = dropdown.querySelector('.custom-dropdown-options');
        if (optionsContainer) {
            optionsContainer.style.display = 'none';
        }

        console.log('✅ Dropdown deshabilitado');
    }

    /**
     * Ocultar elemento
     * Implementa acciones del Business Rules Engine
     */
    hideElement(action, context, variables) {
        const container = context.container;
        if (!container) return;

        const elements = container.querySelectorAll(action.target);
        elements.forEach(element => {
            element.style.display = 'none';
        });

        console.log('✅ Elementos ocultados:', action.target);
    }

    /**
     * Establecer atributo en contenedor
     * Implementa acciones del Business Rules Engine
     */
    setContainerAttribute(action, context, variables) {
        const container = context.container;
        if (!container) return;

        const value = this.resolveVariableValue(action.value, variables);
        container.setAttribute(action.attribute, value);

        console.log('✅ Atributo establecido:', action.attribute, '=', value);
    }

    /**
     * Colapsar contenedor
     * Reemplaza la lógica hardcodeada en inicializarContenedor()
     */
    collapseContainer(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.error('❌ No se encontró container para collapse_container');
            return;
        }

        console.log('📦 Colapsando contenedor por regla UX');

        // Buscar elementos de colapso
        const collapseIcon = container.querySelector('.collapse-icon');
        const collapsibleContent = container.querySelector('.collapsible-content');

        if (collapseIcon && collapsibleContent) {
            // Aplicar clases de colapso (misma lógica que el código original)
            collapseIcon.classList.add('collapsed');
            collapsibleContent.classList.add('collapsed');
            
            console.log('✅ Contenedor colapsado correctamente');
        } else {
            console.warn('⚠️ No se encontraron elementos de colapso en el contenedor');
        }
    }

    /**
     * Resolver valor de variable
     */
    resolveVariableValue(value, variables, context) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2);
            
            // Primero intentar desde variables resueltas
            if (variables && variables[varName]) {
                return variables[varName];
            }
            
            // Si no está en variables, intentar desde atributos del contenedor (para análisis batch)
            if (context && context.container) {
                const container = context.container;
                switch (varName) {
                    case 'matched_vendor_sku':
                        return container.getAttribute('data-analysis-matched-sku');
                    case 'material_id':
                    case 'via_material_id':
                        // Este dato no se guarda en atributos, usar desde variables
                        break;
                }
            }
            
            return value; // Fallback: devolver el valor original
        }
        return value;
    }

    /**
     * Agregar manejador de acción personalizado
     */
    addActionHandler(actionType, handler) {
        this.actionHandlers.set(actionType, handler);
    }

    /**
     * Remover manejador de acción
     */
    removeActionHandler(actionType) {
        this.actionHandlers.delete(actionType);
    }

    /**
     * Filtrar contenedor (no mostrarlo)
     * Esta acción se ejecuta durante la generación de contenedores, no después
     * @param {Object} action - Configuración de la acción
     * @param {Object} context - Contexto de ejecución
     * @param {Object} variables - Variables disponibles
     */
    filterContainer(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.warn('⚠️ No se encontró contenedor para filtrar');
            return;
        }

        // Marcar contenedor como filtrado
        container.setAttribute('data-bre-filtered', 'true');
        container.style.display = 'none';
        
        // Agregar clase CSS para identificación
        container.classList.add('bre-filtered');
        
        console.log(`🚫 Contenedor filtrado por BRE: ${container.id} - ${action.message || 'Sin mensaje'}`);
    }

    /**
     * Mostrar contenedor normalmente
     * Esta acción confirma que el contenedor debe mostrarse sin restricciones
     * @param {Object} action - Configuración de la acción
     * @param {Object} context - Contexto de ejecución
     * @param {Object} variables - Variables disponibles
     */
    showContainerNormal(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.warn('⚠️ No se encontró contenedor para mostrar normalmente');
            return;
        }

        // Marcar contenedor como normal
        container.setAttribute('data-bre-show-normal', 'true');
        
        // Asegurar que esté visible
        container.style.display = 'block';
        
        // Agregar clase CSS para identificación
        container.classList.add('bre-show-normal');
        
        console.log(`📝 Contenedor mostrado normalmente: ${container.id} - ${action.message || 'Sin mensaje'}`);
    }
}

// Exportar para uso en otros módulos
window.ActionExecutor = ActionExecutor;

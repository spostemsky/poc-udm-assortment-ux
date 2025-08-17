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
        const handler = this.actionHandlers.get(action.type);
        if (handler) {
            console.log(`🎬 Ejecutando acción: ${action.type}`);
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

        const value = this.resolveVariableValue(action.value, variables);
        const displayText = this.resolveVariableValue(action.display_text, variables);
        const description = this.resolveVariableValue(action.description, variables);

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
            descriptionDiv.textContent = description;
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
    resolveVariableValue(value, variables) {
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2);
            return variables[varName] || value;
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
}

// Exportar para uso en otros módulos
window.ActionExecutor = ActionExecutor;

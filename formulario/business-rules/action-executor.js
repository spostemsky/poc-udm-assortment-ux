/**
 * ActionExecutor - Ejecutor de acciones para reglas de negocio
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
     * @param {Array} actions - Array de configuraciones de acciones
     * @param {Object} context - Contexto de ejecución (container, variables, etc.)
     * @param {Object} variables - Variables resueltas de la regla
     */
    executeActions(actions, context, variables = {}) {
        console.log('⚡ Ejecutando acciones:', actions.length, 'acciones');
        console.log('📦 Contexto recibido:', context);
        console.log('📊 Variables recibidas:', variables);

        for (const action of actions) {
            try {
                this.executeAction(action, context, variables);
            } catch (error) {
                console.error('💥 Error ejecutando acción:', action.type, error);
            }
        }
    }

    /**
     * Ejecutar una acción individual
     */
    executeAction(action, context, variables) {
        const handler = this.actionHandlers.get(action.type);
        
        if (handler) {
            console.log(`🎯 Ejecutando: ${action.type}`);
            handler(action, context, variables);
        } else {
            console.warn('⚠️ Tipo de acción no soportado:', action.type);
        }
    }

    /**
     * Preseleccionar valor en dropdown
     * Implementa acciones del Business Rules Engine
     */
    preselectDropdown(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.error('❌ No se encontró container para preselect_dropdown');
            return;
        }

        // Buscar dropdown en el container
        const dropdown = container.querySelector('.custom-dropdown');
        if (!dropdown) {
            console.error('❌ No se encontró dropdown en container');
            return;
        }

        // Resolver variables en los valores
        const value = this.resolveVariables(action.value, variables);
        const displayText = this.resolveVariables(action.display_text, variables);
        const description = this.resolveVariables(action.description, variables);

        console.log('🎯 Preseleccionando dropdown:', { value, displayText, description });

        // Establecer valor del dropdown
        dropdown.setAttribute('data-value', value);

        // Actualizar visualización del dropdown
        const placeholderSpan = dropdown.querySelector('.custom-dropdown-selected span:not(.custom-dropdown-arrow)');
        if (placeholderSpan) {
            placeholderSpan.textContent = displayText;
            placeholderSpan.className = ''; // Remover clase de placeholder
        }

        // Actualizar descripción del producto
        const section = dropdown.closest('.section');
        if (section) {
            const descriptionDiv = section.querySelector('.product-description');
            if (descriptionDiv && description) {
                descriptionDiv.textContent = description;
            }
        }

        console.log('✅ Dropdown preseleccionado correctamente');
    }

    /**
     * Deshabilitar dropdown
     * Implementa acciones del Business Rules Engine
     */
    disableDropdown(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.error('❌ No se encontró container para disable_dropdown');
            return;
        }

        const dropdown = container.querySelector('.custom-dropdown');
        if (!dropdown) {
            console.error('❌ No se encontró dropdown para deshabilitar');
            return;
        }

        console.log('🔒 Deshabilitando dropdown');

        // Aplicar estilos visuales
        const selectedDiv = dropdown.querySelector('.custom-dropdown-selected');
        if (selectedDiv && action.visual_style) {
            Object.assign(selectedDiv.style, action.visual_style);
        }

        // Deshabilitar funcionalmente clonando el elemento (remueve event listeners)
        const newDropdown = dropdown.cloneNode(true);
        dropdown.parentNode.replaceChild(newDropdown, dropdown);

        console.log('✅ Dropdown deshabilitado correctamente');
    }

    /**
     * Ocultar elemento
     * Implementa acciones del Business Rules Engine
     */
    hideElement(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.error('❌ No se encontró container para hide_element');
            return;
        }

        const element = container.querySelector(action.target);
        if (element) {
            console.log('👁️ Ocultando elemento:', action.target);
            element.style.display = 'none';
        } else {
            console.warn('⚠️ No se encontró elemento a ocultar:', action.target);
        }
    }

    /**
     * Establecer atributo en container
     * Implementa acciones del Business Rules Engine
     */
    setContainerAttribute(action, context, variables) {
        const container = context.container;
        if (!container) {
            console.error('❌ No se encontró container para set_container_attribute');
            return;
        }

        const value = this.resolveVariables(action.value, variables);
        
        console.log('🏷️ Estableciendo atributo:', action.attribute, '=', value);
        container.setAttribute(action.attribute, value);
    }

    /**
     * Resolver variables en strings ({{variable_name}})
     */
    resolveVariables(template, variables) {
        if (typeof template !== 'string') {
            return template;
        }

        return template.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
            const value = variables[variableName];
            return value !== undefined ? value : match;
        });
    }

    /**
     * Agregar manejador de acción personalizado
     */
    addActionHandler(actionType, handler) {
        this.actionHandlers.set(actionType, handler);
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
     * Remover manejador de acción
     */
    removeActionHandler(actionType) {
        this.actionHandlers.delete(actionType);
    }
}

// Exportar para uso en otros módulos
window.ActionExecutor = ActionExecutor;

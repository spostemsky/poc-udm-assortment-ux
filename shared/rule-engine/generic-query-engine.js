/**
 * 🔍 GENERIC QUERY ENGINE
 * Motor de consultas genérico y desacoplado para evaluación de condiciones
 * 
 * ✅ CARACTERÍSTICAS:
 * - Sin dependencias externas (localStorage, DOM, etc.)
 * - Inyección de dependencias configurable
 * - Operadores extensibles
 * - Completamente reutilizable
 */
class GenericQueryEngine {
    constructor(config = {}) {
        // 🔌 PROVEEDORES INYECTABLES
        this.dataProviders = new Map();
        this.contextProviders = new Map();
        this.fieldResolvers = new Map();
        this.operators = new Map();
        
        // 🛠️ CONFIGURACIÓN INICIAL
        this.setupDataProviders(config.dataProviders || {});
        this.setupContextProviders(config.contextProviders || {});
        this.setupFieldResolvers(config.fieldResolvers || {});
        this.setupOperators(config.operators || {});
    }

    /**
     * 🔌 Configurar proveedores de datos
     * @param {Object} providers - Funciones que devuelven datos por entidad
     */
    setupDataProviders(providers) {
        Object.entries(providers).forEach(([entityName, providerFn]) => {
            if (typeof providerFn === 'function') {
                this.dataProviders.set(entityName, providerFn);
            }
        });
    }

    /**
     * 🔌 Configurar proveedores de contexto
     * @param {Object} providers - Funciones que obtienen contexto actual
     */
    setupContextProviders(providers) {
        Object.entries(providers).forEach(([contextName, providerFn]) => {
            if (typeof providerFn === 'function') {
                this.contextProviders.set(contextName, providerFn);
            }
        });
    }

    /**
     * 🔌 Configurar resolvers de campos
     * @param {Object} resolvers - Funciones que resuelven campos específicos
     */
    setupFieldResolvers(resolvers) {
        Object.entries(resolvers).forEach(([fieldName, resolverFn]) => {
            if (typeof resolverFn === 'function') {
                this.fieldResolvers.set(fieldName, resolverFn);
            }
        });
    }

    /**
     * 🔌 Configurar operadores de evaluación
     * @param {Object} operators - Funciones que evalúan condiciones específicas
     */
    setupOperators(operators) {
        // Operadores por defecto
        this.operators.set('equals', (a, b) => a === b);
        this.operators.set('not_equals', (a, b) => a !== b);
        this.operators.set('exists', (a) => a != null);
        this.operators.set('not_exists', (a) => a == null);
        this.operators.set('contains', (a, b) => a && a.includes && a.includes(b));
        
        // Operadores personalizados
        Object.entries(operators).forEach(([operatorName, operatorFn]) => {
            if (typeof operatorFn === 'function') {
                this.operators.set(operatorName, operatorFn);
            }
        });
    }

    /**
     * 🔍 Evaluar una condición
     * @param {Object} condition - Condición a evaluar
     * @param {Object} context - Contexto de evaluación
     * @returns {*} Resultado de la evaluación
     */
    evaluateCondition(condition, context) {
        try {
            const conditionType = condition.type;
            
            // ✅ TIPOS DE CONDICIÓN GENÉRICOS
            switch (conditionType) {
                case 'analysis_result_check':
                    return this.evaluateAnalysisResultCheck(condition, context);
                case 'field_exact_match':
                    return this.evaluateFieldExactMatch(condition, context);
                case 'dom_element_value_equals':
                    return this.evaluateDomElementValue(condition, context);
                case 'form_field_comparison':
                    return this.evaluateFormFieldComparison(condition, context);
                case 'dom_count_check':
                    return this.evaluateDomCountCheck(condition, context);
                case 'multiple_elements_state':
                    return this.evaluateMultipleElementsState(condition, context);
                case 'container_position_check':
                    return this.evaluateContainerPosition(condition, context);
                case 'custom_condition':
                    return this.evaluateCustomCondition(condition, context);
                default:
                    console.warn(`⚠️ Tipo de condición no soportado: ${conditionType}`);
                    return null;
            }
        } catch (error) {
            console.error(`💥 Error evaluando condición ${condition.type}:`, error);
            return null;
        }
    }

    /**
     * 🔍 Evaluar condición basada en resultados de análisis
     */
    evaluateAnalysisResultCheck(condition, context) {
        const fieldResolver = this.fieldResolvers.get('analysis_result');
        if (!fieldResolver) {
            console.warn('⚠️ Field resolver para analysis_result no configurado');
            return false;
        }

        const actualValue = fieldResolver(condition.field, context);
        const expectedValue = condition.value;
        const operator = condition.operator || 'equals';

        const operatorFn = this.operators.get(operator);
        if (!operatorFn) {
            console.warn(`⚠️ Operador no reconocido: ${operator}`);
            return false;
        }

        return operatorFn(actualValue, expectedValue);
    }

    /**
     * 🔍 Evaluar coincidencia exacta entre campos
     */
    evaluateFieldExactMatch(condition, context) {
        const fieldResolver = this.fieldResolvers.get('field_match');
        if (!fieldResolver) {
            console.warn('⚠️ Field resolver para field_match no configurado');
            return null;
        }

        return fieldResolver(condition, context);
    }

    /**
     * 🔍 Evaluar posición del contenedor
     */
    evaluateContainerPosition(condition, context) {
        const fieldResolver = this.fieldResolvers.get('container_position');
        if (!fieldResolver) {
            console.warn('⚠️ Field resolver para container_position no configurado');
            return null;
        }

        return fieldResolver(condition, context);
    }

    /**
     * 🔍 Evaluar condición personalizada
     */
    evaluateCustomCondition(condition, context) {
        const customEvaluator = this.fieldResolvers.get(condition.evaluator);
        if (!customEvaluator) {
            console.warn(`⚠️ Evaluador personalizado no encontrado: ${condition.evaluator}`);
            return null;
        }

        return customEvaluator(condition, context);
    }

    /**
     * 🔍 Obtener datos de una entidad
     * @param {string} entityName - Nombre de la entidad
     * @returns {Array} Datos de la entidad
     */
    getEntityData(entityName) {
        const provider = this.dataProviders.get(entityName);
        if (!provider) {
            console.warn(`⚠️ Data provider no encontrado para entidad: ${entityName}`);
            return [];
        }

        try {
            return provider() || [];
        } catch (error) {
            console.error(`💥 Error obteniendo datos para ${entityName}:`, error);
            return [];
        }
    }

    /**
     * 🔍 Obtener contexto actual
     * @param {string} contextName - Nombre del contexto
     * @returns {*} Valor del contexto
     */
    getContext(contextName) {
        const provider = this.contextProviders.get(contextName);
        if (!provider) {
            console.warn(`⚠️ Context provider no encontrado: ${contextName}`);
            return null;
        }

        try {
            return provider();
        } catch (error) {
            console.error(`💥 Error obteniendo contexto ${contextName}:`, error);
            return null;
        }
    }

    // 📝 PLACEHOLDER METHODS - Implementados por field resolvers
    evaluateDomElementValue(condition, context) { 
        return this.evaluateCustomCondition({ ...condition, evaluator: 'dom_element_value' }, context);
    }
    
    evaluateFormFieldComparison(condition, context) { 
        return this.evaluateCustomCondition({ ...condition, evaluator: 'form_field_comparison' }, context);
    }
    
    evaluateDomCountCheck(condition, context) { 
        return this.evaluateCustomCondition({ ...condition, evaluator: 'dom_count_check' }, context);
    }
    
    evaluateMultipleElementsState(condition, context) { 
        return this.evaluateCustomCondition({ ...condition, evaluator: 'multiple_elements_state' }, context);
    }
}

// 🌐 EXPORTAR PARA USO GLOBAL
if (typeof window !== 'undefined') {
    window.GenericQueryEngine = GenericQueryEngine;
}

// 📦 EXPORTAR PARA MÓDULOS (Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenericQueryEngine;
}

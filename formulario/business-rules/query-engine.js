/**
 * QueryEngine - Evaluador de condiciones para reglas de negocio
 * Reemplaza la lógica de verificarCoincidenciaExacta() con un sistema configurable
 */
class QueryEngine {
    constructor() {
        this.dataProviders = new Map();
        this.setupDefaultProviders();
    }

    /**
     * Configurar proveedores de datos por defecto
     */
    setupDefaultProviders() {
        // Proveedor para datos de facturas (compatible con el sistema actual)
        this.dataProviders.set('facturas', () => {
            // Intentar múltiples fuentes de datos de facturas
            let facturas = localStorage.getItem('facturas');
            if (!facturas) {
                facturas = localStorage.getItem('poc_data_facturas');
            }
            return facturas ? JSON.parse(facturas) : [];
        });

        // Proveedor para datos de órdenes (compatible con el sistema actual)
        this.dataProviders.set('ordenes', () => {
            // Intentar múltiples fuentes de datos de órdenes
            let ordenes = localStorage.getItem('ordenes');
            if (!ordenes) {
                ordenes = localStorage.getItem('poc_data_ordenes');
            }
            return ordenes ? JSON.parse(ordenes) : [];
        });

        // Proveedor para contexto actual del formulario
        this.dataProviders.set('current_context', () => {
            return {
                selected_factura_id: this.getCurrentFacturaId(),
                current_item_id: this.getCurrentItemId(),
                sap_order_id: this.getCurrentSapOrderId()
            };
        });
    }

    /**
     * Evaluar una condición de regla
     * @param {Object} condition - Configuración de la condición
     * @param {Object} context - Contexto de ejecución (container, itemId, etc.)
     * @returns {Object|null} - Resultado de la evaluación o null si no se cumple
     */
    evaluateCondition(condition, context = {}) {
        console.log('🔍 Evaluando condición:', condition.type, context);

        switch (condition.type) {
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
            default:
                console.warn('⚠️ Tipo de condición no soportado:', condition.type);
                return null;
        }
    }

    /**
     * Evaluar coincidencia exacta entre campos de diferentes entidades
     * Reemplaza la lógica de verificarCoincidenciaExacta()
     */
    evaluateFieldExactMatch(condition, context) {
        try {
            // Obtener valor origen (vendor_sku de factura)
            const sourceValue = this.getFieldValue(condition.source, context);
            if (!sourceValue) {
                console.log('❌ No se encontró valor origen');
                return null;
            }

            // Obtener datos destino (detalles de orden)
            const targetData = this.getFieldValue(condition.target, context);
            if (!targetData || !Array.isArray(targetData)) {
                console.log('❌ No se encontraron datos destino');
                return null;
            }

            // Buscar coincidencia exacta
            const match = targetData.find(item => {
                const targetValue = this.extractNestedValue(item, condition.target.field.split('.').pop());
                return targetValue === sourceValue;
            });

            if (match) {
                console.log('✅ Coincidencia encontrada:', match);
                return {
                    matched: true,
                    sourceValue: sourceValue,
                    matchedItem: match,
                    // Mapear campos para compatibilidad con código actual
                    vendorSku: match.vendorSku,
                    item: match.item,
                    unitPrice: match.unitPrice,
                    materialId: match.materialId,
                    quantity: match.quantity
                };
            }

            console.log('❌ No se encontró coincidencia para:', sourceValue);
            return null;

        } catch (error) {
            console.error('💥 Error evaluando field_exact_match:', error);
            return null;
        }
    }

    /**
     * Obtener valor de un campo basado en la configuración
     */
    getFieldValue(fieldConfig, context) {
        const entityData = this.dataProviders.get(fieldConfig.entity)();
        
        switch (fieldConfig.context) {
            case 'current_factura_item':
                return this.getCurrentFacturaItemValue(entityData, fieldConfig.field, context);
            
            case 'related_orden_by_sap_order_id':
                return this.getRelatedOrdenData(entityData, context);
            
            default:
                console.warn('⚠️ Contexto no soportado:', fieldConfig.context);
                return null;
        }
    }

    /**
     * Obtener valor del item actual de la factura
     */
    getCurrentFacturaItemValue(facturasData, field, context) {
        const currentFacturaId = context.facturaId || this.getCurrentFacturaId();
        const currentItemId = context.itemId || this.getCurrentItemId();

        if (!currentFacturaId || !currentItemId) {
            console.log('❌ Faltan IDs de contexto:', { currentFacturaId, currentItemId });
            return null;
        }

        // Buscar factura actual
        const currentFactura = facturasData.find(f => f.external_id === currentFacturaId);
        if (!currentFactura || !currentFactura.details) {
            console.log('❌ No se encontró factura o detalles:', currentFacturaId);
            return null;
        }

        // Buscar item actual por vendor_sku (que es lo que se pasa como itemId)
        const currentItem = currentFactura.details.find(detail => detail.vendor_sku === currentItemId);
        if (!currentItem) {
            console.log('❌ No se encontró item:', currentItemId);
            return null;
        }

        // Extraer valor del campo especificado
        return this.extractNestedValue(currentItem, field.replace('details[].', ''));
    }

    /**
     * Obtener datos de la orden relacionada por sap_order_id
     */
    getRelatedOrdenData(ordenesData, context) {
        const sapOrderId = context.sapOrderId || this.getCurrentSapOrderId();
        
        if (!sapOrderId) {
            console.log('❌ No se encontró sap_order_id');
            return null;
        }

        // Buscar orden correspondiente
        const relatedOrden = ordenesData.find(orden => orden.sapOrderId === sapOrderId);
        if (!relatedOrden || !relatedOrden.details) {
            console.log('❌ No se encontró orden relacionada:', sapOrderId);
            return null;
        }

        return relatedOrden.details;
    }

    /**
     * Extraer valor de un campo anidado (ej: "vendorSku", "item.title")
     */
    extractNestedValue(obj, fieldPath) {
        const parts = fieldPath.split('.');
        let value = obj;
        
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
     * Obtener ID de la factura actualmente seleccionada
     */
    getCurrentFacturaId() {
        const selectFacturas = document.getElementById('invoice-select');
        return selectFacturas ? selectFacturas.value : null;
    }

    /**
     * Obtener ID del item actual (se pasa como parámetro en el contexto)
     */
    getCurrentItemId() {
        // Este valor se pasa desde el contexto de ejecución
        return null; // Se debe proporcionar en el contexto
    }

    /**
     * Obtener sap_order_id de la factura actual
     */
    getCurrentSapOrderId() {
        const facturaId = this.getCurrentFacturaId();
        if (!facturaId) return null;

        const facturasData = this.dataProviders.get('facturas')();
        const currentFactura = facturasData.find(f => f.external_id === facturaId);
        
        return currentFactura ? currentFactura.sap_order_id : null;
    }

    /**
     * Evaluar valor de elemento DOM
     */
    evaluateDomElementValue(condition, context) {
        try {
            const element = document.querySelector(condition.source.selector);
            if (!element) {
                console.log('❌ Elemento no encontrado:', condition.source.selector);
                return null;
            }

            let actualValue;
            if (condition.source.attribute) {
                actualValue = element.getAttribute(condition.source.attribute);
            } else {
                actualValue = element.value || element.textContent;
            }

            const matches = actualValue === condition.value;
            console.log(`🔍 DOM Check: ${condition.source.selector} = "${actualValue}" vs "${condition.value}" → ${matches}`);

            return matches ? { matched: true, actualValue, expectedValue: condition.value } : null;

        } catch (error) {
            console.error('💥 Error evaluando DOM element value:', error);
            return null;
        }
    }

    /**
     * Evaluar comparación entre campos del formulario
     */
    evaluateFormFieldComparison(condition, context) {
        try {
            const sourceElement = document.querySelector(`[name="${condition.source.field}"], #${condition.source.field}, .${condition.source.field}`);
            const targetElement = document.querySelector(`[name="${condition.target.field}"], #${condition.target.field}, .${condition.target.field}`);

            if (!sourceElement || !targetElement) {
                console.log('❌ Campos no encontrados:', condition.source.field, condition.target.field);
                return null;
            }

            let sourceValue = this.parseValue(sourceElement.value, condition.source.type);
            let targetValue = this.parseValue(targetElement.value, condition.target.type);

            const result = this.compareValues(sourceValue, targetValue, condition.operator);
            console.log(`🔍 Form Comparison: ${sourceValue} ${condition.operator} ${targetValue} → ${result}`);

            return result ? { matched: true, sourceValue, targetValue, operator: condition.operator } : null;

        } catch (error) {
            console.error('💥 Error evaluando form field comparison:', error);
            return null;
        }
    }

    /**
     * Evaluar conteo de elementos DOM
     */
    evaluateDomCountCheck(condition, context) {
        try {
            const elements = document.querySelectorAll(condition.source.selector);
            const count = elements.length;

            const result = this.compareValues(count, condition.value, condition.operator);
            console.log(`🔍 DOM Count: ${condition.source.selector} count=${count} ${condition.operator} ${condition.value} → ${result}`);

            return result ? { matched: true, count, expectedValue: condition.value, operator: condition.operator } : null;

        } catch (error) {
            console.error('💥 Error evaluando DOM count check:', error);
            return null;
        }
    }

    /**
     * Evaluar estado de múltiples elementos
     */
    evaluateMultipleElementsState(condition, context) {
        try {
            const elements = document.querySelectorAll(condition.source.selector);
            const states = Array.from(elements).map(el => {
                if (condition.source.check === 'has_attribute') {
                    return el.hasAttribute(condition.source.attribute);
                } else if (condition.source.check === 'attribute_value') {
                    return el.getAttribute(condition.source.attribute) === condition.source.value;
                } else if (condition.source.check === 'is_visible') {
                    return el.style.display !== 'none' && !el.hidden;
                }
                return false;
            });

            const matchingCount = states.filter(Boolean).length;
            const result = this.compareValues(matchingCount, condition.expected_count, condition.operator || 'equals');

            console.log(`🔍 Multiple Elements: ${matchingCount}/${elements.length} elements match criteria`);

            return result ? { matched: true, matchingCount, totalCount: elements.length } : null;

        } catch (error) {
            console.error('💥 Error evaluando multiple elements state:', error);
            return null;
        }
    }

    /**
     * Parsear valor según tipo
     */
    parseValue(value, type) {
        switch (type) {
            case 'number':
                return parseFloat(value) || 0;
            case 'boolean':
                return value === 'true' || value === true;
            default:
                return value;
        }
    }

    /**
     * Comparar valores con operador
     */
    compareValues(a, b, operator) {
        switch (operator) {
            case 'equals':
                return a === b;
            case 'not_equals':
                return a !== b;
            case 'greater_than':
                return a > b;
            case 'greater_than_or_equal':
                return a >= b;
            case 'less_than':
                return a < b;
            case 'less_than_or_equal':
                return a <= b;
            case 'contains':
                return String(a).includes(String(b));
            default:
                console.warn('⚠️ Operador no soportado:', operator);
                return false;
        }
    }

    /**
     * Evaluar posición del contenedor
     */
    evaluateContainerPosition(condition, context) {
        try {
            const containerIndex = context.containerIndex || 0;
            const hasStatesGuardados = context.hasStatesGuardados || false;

            // Si hay estados guardados, no aplicar regla UX de colapsar
            if (condition.source.exclude_saved_states && hasStatesGuardados) {
                console.log('🔍 Container Position: Estados guardados detectados, saltando regla UX');
                return null;
            }

            let matches = false;
            if (condition.source.position === 'first') {
                matches = containerIndex === 0;
            } else if (condition.source.position === 'not_first') {
                matches = containerIndex > 0;
            } else if (condition.source.position === 'last') {
                // Necesitaríamos el total de contenedores para esto
                matches = false; // Por implementar
            }

            console.log(`🔍 Container Position: index=${containerIndex}, position=${condition.source.position}, matches=${matches}`);

            return matches ? { matched: true, containerIndex, position: condition.source.position } : null;

        } catch (error) {
            console.error('💥 Error evaluando container position:', error);
            return null;
        }
    }
}

// Exportar para uso en otros módulos
window.QueryEngine = QueryEngine;

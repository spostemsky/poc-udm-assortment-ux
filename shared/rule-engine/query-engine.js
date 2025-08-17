/**
 * 🔍 QUERY ENGINE - Evaluador de Condiciones
 * Evalúa condiciones definidas en las reglas de negocio
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
        // Proveedor para facturas
        this.dataProviders.set('facturas', () => {
            const facturas = JSON.parse(localStorage.getItem('facturas') || '[]');
            if (facturas.length === 0) {
                // Fallback para datos con prefijo poc_data_
                return JSON.parse(localStorage.getItem('poc_data_facturas') || '[]');
            }
            return facturas;
        });
        
        // Proveedor para órdenes
        this.dataProviders.set('ordenes', () => {
            const ordenes = JSON.parse(localStorage.getItem('ordenes') || '[]');
            if (ordenes.length === 0) {
                // Fallback para datos con prefijo poc_data_
                return JSON.parse(localStorage.getItem('poc_data_ordenes') || '[]');
            }
            return ordenes;
        });
    }

    /**
     * Evaluar una condición
     */
    evaluateCondition(condition, context) {
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
     */
    evaluateFieldExactMatch(condition, context) {
        try {
            const sourceEntity = condition.source.entity;
            const targetEntity = condition.target.entity;
            
            const sourceData = this.dataProviders.get(sourceEntity)();
            const targetData = this.dataProviders.get(targetEntity)();
            
            if (!sourceData || !targetData) {
                console.warn(`⚠️ No se encontraron datos para ${sourceEntity} o ${targetEntity}`);
                return null;
            }

            // Obtener IDs de contexto
            const currentFacturaId = this.getCurrentFacturaId();
            const currentSapOrderId = this.getCurrentSapOrderId();
            
            if (!currentFacturaId || !currentSapOrderId) {
                console.warn('⚠️ No se pudo obtener contexto de factura o SAP Order ID');
                return null;
            }

            // Buscar factura actual
            const currentFactura = sourceData.find(f => f.external_id === currentFacturaId);
            if (!currentFactura || !currentFactura.details) {
                return null;
            }

            // Buscar orden correspondiente
            const targetOrder = targetData.find(o => o.sapOrderId === currentSapOrderId);
            if (!targetOrder || !targetOrder.details) {
                return null;
            }

            // Buscar coincidencia en el item específico del contexto
            const itemId = context.itemId;
            // CORRIGIDO: itemId es en realidad el vendor_sku, no el id interno
            const facturaItem = currentFactura.details.find(item => item.vendor_sku === itemId);
            
            if (!facturaItem || !facturaItem.vendor_sku) {
                return null;
            }

            // Buscar coincidencia exacta en la orden
            const matchingOrderItem = targetOrder.details.find(detail => 
                detail.vendorSku === facturaItem.vendor_sku
            );

            if (matchingOrderItem) {
                return {
                    vendorSku: matchingOrderItem.vendorSku,
                    item: matchingOrderItem.item,
                    unitPrice: matchingOrderItem.unitPrice,
                    materialId: matchingOrderItem.materialId,
                    quantity: matchingOrderItem.quantity,
                    esCoincidenciaExacta: true
                };
            }

            return null;

        } catch (error) {
            console.error('💥 Error evaluando field_exact_match:', error);
            return null;
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
                matches = false; // Por implementar
            }

            console.log(`🔍 Container Position: index=${containerIndex}, position=${condition.source.position}, matches=${matches}`);

            return matches ? { matched: true, containerIndex, position: condition.source.position } : null;

        } catch (error) {
            console.error('💥 Error evaluando container position:', error);
            return null;
        }
    }

    /**
     * Métodos auxiliares
     */
    getCurrentFacturaId() {
        const select = document.getElementById('invoice-select');
        return select ? select.value : null;
    }

    getCurrentSapOrderId() {
        const facturaId = this.getCurrentFacturaId();
        if (!facturaId) return null;

        const facturas = this.dataProviders.get('facturas')();
        const factura = facturas.find(f => f.external_id === facturaId);
        return factura ? factura.sap_order_id : null;
    }

    // Placeholder para otros métodos de evaluación
    evaluateDomElementValue(condition, context) { return null; }
    evaluateFormFieldComparison(condition, context) { return null; }
    evaluateDomCountCheck(condition, context) { return null; }
    evaluateMultipleElementsState(condition, context) { return null; }
}

// Exportar para uso en otros módulos
window.QueryEngine = QueryEngine;

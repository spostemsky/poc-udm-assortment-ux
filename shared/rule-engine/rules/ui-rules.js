/**
 * 🖥️ UI RULES - Reglas de Interfaz Visual
 * Estilos, presentación y elementos visuales
 */
window.BUSINESS_RULES_CATEGORY = window.BUSINESS_RULES_CATEGORY || {};

window.BUSINESS_RULES_CATEGORY.ui = {
  "additional_styling": {
    "name": "Estilo Adicional para SKU Coincidente",
    "description": "Agregar estilo visual adicional cuando hay coincidencia exacta",
    "category": "ui",
    "active": true,
    "priority": 2,
    
    "triggers": ["on_container_initialize"],
    
    "condition": {
      "type": "field_exact_match",
      "source": {
        "entity": "facturas",
        "field": "details[].vendor_sku",
        "context": "current_factura_item"
      },
      "target": {
        "entity": "ordenes",
        "field": "details[].vendorSku",
        "context": "related_orden_by_sap_order_id"
      }
    },
    
    "actions": [
      {
        "type": "set_container_attribute",
        "attribute": "data-test-rule-2",
        "value": "executed"
      },
      {
        "type": "set_container_attribute",
        "attribute": "data-priority-test",
        "value": "priority-2-should-be-overwritten"
      }
    ],
    
    "variables": {
      "test_value": { "source": "condition_result.vendorSku" }
    }
  }
};
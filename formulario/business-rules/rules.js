/**
 * Reglas de negocio en formato JavaScript
 * Reemplaza rules.json para evitar problemas de CORS con file:// protocol
 */
window.BUSINESS_RULES = {
  "version": "1.0",
  "last_updated": "2024-01-15T10:30:00Z",
  "description": "Sistema de reglas categorizadas para el formulario de facturas",
  
  "categories": {
    "business": "Reglas de negocio y lógica empresarial",
    "ux": "Experiencia de usuario y comportamiento de interfaz",
    "validation": "Validaciones de formulario y datos",
    "ui": "Interfaz visual y presentación"
  },
  
  "rules": {
    "sku_exact_match_preselection": {
      "name": "Preselección SKU por Coincidencia Exacta",
      "description": "Si vendor_sku de factura coincide exactamente con vendorSku de orden, preseleccionar y deshabilitar",
      "category": "business",
      "active": true,
      "priority": 1,
      
      "triggers": [
        "on_container_initialize"
      ],
      
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
          "type": "preselect_dropdown",
          "target": "sku_selector",
          "value": "{{matched_vendor_sku}}",
          "display_text": "{{matched_vendor_sku}}",
          "description": "{{matched_item_title}}"
        },
        {
          "type": "disable_dropdown",
          "target": "sku_selector",
          "visual_style": {
            "cursor": "not-allowed",
            "backgroundColor": "#f3f4f6",
            "color": "#6b7280"
          }
        },
        {
          "type": "hide_element",
          "target": ".horizontal-dropdown"
        },
        {
          "type": "hide_element", 
          "target": ".add-button"
        },
        {
          "type": "set_container_attribute",
          "attribute": "data-sku-forzado",
          "value": "{{matched_vendor_sku}}"
        },
        {
          "type": "set_container_attribute",
          "attribute": "data-coincidencia-exacta", 
          "value": "true"
        },
        {
          "type": "set_container_attribute",
          "attribute": "data-priority-test",
          "value": "priority-1-wins"
        }
      ],
      
      "variables": {
        "matched_vendor_sku": {
          "source": "condition_result.vendorSku"
        },
        "matched_item_title": {
          "source": "condition_result.item.title"
        },
        "matched_unit_price": {
          "source": "condition_result.unitPrice"
        },
        "matched_material_id": {
          "source": "condition_result.materialId"
        },
        "matched_quantity": {
          "source": "condition_result.quantity"
        }
      }
    },

    "additional_styling": {
      "name": "Estilo Adicional para SKU Coincidente",
      "description": "Agregar estilo visual adicional cuando hay coincidencia exacta",
      "category": "ui",
      "active": true,
      "priority": 2,
      
      "triggers": [
        "on_container_initialize"
      ],
      
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
        "test_value": {
          "source": "condition_result.vendorSku"
        }
      }
    },

    "collapse_containers_ux": {
      "name": "Colapsar Contenedores por Defecto",
      "description": "Mantener solo el primer contenedor expandido, colapsar el resto para mejor UX",
      "category": "ux",
      "active": true,
      "priority": 10,
      
      "triggers": [
        "on_container_initialize"
      ],
      
      "condition": {
        "type": "container_position_check",
        "source": {
          "position": "not_first",
          "exclude_saved_states": true
        }
      },
      
      "actions": [
        {
          "type": "collapse_container",
          "target": "current_container"
        }
      ],
      
      "variables": {
        "container_index": {
          "source": "context.containerIndex"
        }
      }
    }
  }
};

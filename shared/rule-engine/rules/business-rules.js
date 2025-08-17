/**
 * 💼 BUSINESS RULES - Reglas de Negocio
 * Lógica empresarial y validaciones de datos
 */
window.BUSINESS_RULES_CATEGORY = window.BUSINESS_RULES_CATEGORY || {};

window.BUSINESS_RULES_CATEGORY.business = {
  "sku_exact_match_preselection": {
    "name": "Preselección SKU por Coincidencia Exacta",
    "description": "Si vendor_sku de factura coincide exactamente con vendorSku de orden, preseleccionar y deshabilitar",
    "category": "business",
    "active": true,
    "priority": 1,
    
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
      "matched_vendor_sku": { "source": "vendorSku" },
      "matched_item_title": { "source": "item.title" },
      "matched_unit_price": { "source": "unitPrice" },
      "matched_material_id": { "source": "materialId" },
      "matched_quantity": { "source": "quantity" }
    }
  }
};
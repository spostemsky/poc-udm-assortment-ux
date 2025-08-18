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
      "type": "analysis_result_check",
      "field": "has_direct_match",
      "operator": "equals",
      "value": true
    },
    
    "actions": [
      {
        "type": "preselect_dropdown",
        "target": "sku_selector",
        "value": "{{matched_vendor_sku}}",
        "display_text": "{{matched_vendor_sku}}",
        "message": "{{matched_item_title}}",
        "active": true,
        "message": "Pre-seleccionar automáticamente el SKU coincidente en el dropdown"
      },
      {
        "type": "disable_dropdown",
        "target": "sku_selector",
        "visual_style": {
          "cursor": "not-allowed",
          "backgroundColor": "#f3f4f6",
          "color": "#6b7280"
        },
        "active": true,
        "message": "Deshabilitar el dropdown para prevenir cambios manuales"
      },
      {
        "type": "hide_element",
        "target": ".horizontal-dropdown",
        "active": true,
        "message": "Ocultar elementos de dropdown horizontal adicionales"
      },
      {
        "type": "hide_element",
        "target": ".add-button",
        "active": true,
        "message": "Ocultar botón 'Agregar otro producto' cuando hay coincidencia exacta"
      },
      {
        "type": "set_container_attribute",
        "attribute": "data-sku-forzado",
        "value": "{{matched_vendor_sku}}",
        "active": true,
        "message": "Marcar contenedor con atributo de SKU forzado para referencia"
      },
      {
        "type": "set_container_attribute",
        "attribute": "data-coincidencia-exacta",
        "value": "true",
        "active": true,
        "message": "Marcar contenedor como coincidencia exacta para validaciones posteriores"
      }
    ],
    
    "variables": {
      "matched_vendor_sku": { "source": "matched_vendor_sku" },
      "matched_item_title": { "source": "item.title" },
      "matched_unit_price": { "source": "unitPrice" },
      "matched_material_id": { "source": "materialId" },
      "matched_quantity": { "source": "quantity" }
    }
  },

  // 🚫 REGLA 2: Filtrar items cuando hay match en ofertas pero material_id no está en orden
  "filter_items_offers_match_no_orden": {
    "name": "Filtrar Items - Match en Ofertas pero No en Orden",
    "description": "Filtra items cuando hay match en ofertas pero el material_id no está en la orden",
    "category": "business",
    "active": true,
    "priority": 2,
    
    "triggers": ["on_container_initialize"],
    
    "condition": {
      "type": "analysis_result_check",
      "field": "should_filter",
      "operator": "equals",
      "value": true
    },
    
    "actions": [
      {
        "type": "filter_container",
        "target": "container",
        "message": "Item filtrado: material_id no encontrado en orden",
        "active": true
      }
    ],
    
    "variables": {
      "item_status": { "source": "analysis_result.status" },
      "material_id": { "source": "analysis_result.via_material_id" }
    }
  },

  // 🎯 REGLA 3: Pre-seleccionar SKU cuando hay match completo en cascada  
  "preselect_cascade_complete_match": {
    "name": "Pre-seleccionar SKU - Match Completo en Cascada",
    "description": "Pre-selecciona SKU cuando hay match completo: oferta → material_id → orden",
    "category": "business",
    "active": true,
    "priority": 3,
    
    "triggers": ["on_container_initialize"],
    
    "condition": {
      "type": "analysis_result_check",
      "field": "should_preselect_cascade",
      "operator": "equals",
      "value": true
    },
    
    "actions": [
      {
        "type": "preselect_dropdown",
        "target": "sku_selector",
        "value": "{{matched_vendor_sku}}",
        "display_text": "{{matched_vendor_sku}}",
        "message": "Match en cascada vía material_id {{material_id}}",
        "active": true
      }
    ],
    
    "variables": {
      "matched_vendor_sku": { "source": "matched_vendor_sku" },
      "material_id": { "source": "via_material_id" },
      "source": { "source": "source" }
    }
  },

  // 📝 REGLA 4: Mostrar contenedor normal cuando no hay matches
  "show_normal_no_offers_match": {
    "name": "Mostrar Normal - Sin Match en Ofertas",
    "description": "Muestra contenedor normalmente cuando no hay match en ofertas",
    "category": "business",
    "active": true,
    "priority": 4,
    
    "triggers": ["on_container_initialize"],
    
    "condition": {
      "type": "analysis_result_check",
      "field": "should_show_normal",
      "operator": "equals",
      "value": true
    },
    
    "actions": [
      {
        "type": "show_container_normal",
        "target": "container",
        "message": "Contenedor mostrado normalmente - sin matches encontrados",
        "active": true
      }
    ],
    
    "variables": {
      "item_status": { "source": "analysis_result.status" },
      "reason": { "source": "analysis_result.reason" }
    }
  }
};
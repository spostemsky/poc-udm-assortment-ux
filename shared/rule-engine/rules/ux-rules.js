/**
 * 🎨 UX RULES - Reglas de Experiencia de Usuario
 * Comportamiento y flujo de la interfaz para mejor usabilidad
 */
window.BUSINESS_RULES_CATEGORY = window.BUSINESS_RULES_CATEGORY || {};

window.BUSINESS_RULES_CATEGORY.ux = {
  "collapse_containers_ux": {
    "name": "Colapsar Contenedores por Defecto",
    "description": "Mantener solo el primer contenedor expandido, colapsar el resto para mejor UX",
    "category": "ux",
    "active": true,
    "priority": 10,
    
    "triggers": ["on_container_initialize"],
    
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
        "target": "current_container",
        "active": true,
        "message": "Colapsar contenedor para mantener interfaz limpia y enfocada"
      }
    ],
    
    "variables": {
      "container_index": { "source": "context.containerIndex" }
    }
  }
};
# 🚀 Business Rules Engine - Especificación Técnica

## 📋 Visión General

Sistema configurable y exportable para manejar reglas de negocio complejas entre entidades relacionadas, permitiendo validaciones dinámicas, acciones automáticas y comportamientos condicionales basados en datos cargados.

---

## 🎯 Objetivos

### ✅ Funcionales:
- **Relaciones Dinámicas:** Definir conexiones entre entidades (facturas ↔ órdenes ↔ ofertas)
- **Reglas Configurables:** Lógica de negocio en JSON, sin código hardcodeado
- **Acciones Automáticas:** Pre-selección, ocultación, validación automática
- **Reactividad:** El formulario reacciona automáticamente a cambios de datos
- **Debug Visual:** Interfaz para ver qué reglas se ejecutan y por qué

### ✅ No Funcionales:
- **Exportable:** Módulo independiente copiable a otros proyectos
- **Performance:** Cache inteligente para consultas complejas
- **Escalable:** Soporte para N entidades y M reglas
- **Mantenible:** Configuración clara y documentada

---

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos:
```
business-rules/
├── business-rules-engine.js      # Motor principal
├── entity-relations.js           # Definición de relaciones
├── business-rules-config.js      # Configuración de reglas
├── query-engine.js               # Sistema de consultas
├── rule-executor.js              # Ejecutor de acciones
├── rules-debugger.js             # Debug y logs
├── business-rules.css            # Estilos del debugger
├── business-rules.html           # Interfaz de desarrollo
└── README.md                     # Documentación
```

---

## 🔗 Sistema de Relaciones Entre Entidades

### Configuración de Relaciones:
```javascript
// entity-relations.js
const ENTITY_RELATIONS = {
    facturas: {
        // Entidades relacionadas
        relatedTo: ["ordenes", "ofertas"],
        
        // Claves foráneas
        foreignKeys: {
            orden_id: {
                entity: "ordenes",
                field: "id",
                type: "one-to-one"
            },
            vendor_id: {
                entity: "ofertas", 
                field: "vendor_id",
                type: "one-to-many"
            }
        },
        
        // Relaciones complejas
        complexRelations: {
            "vendor_sku_to_material": {
                path: "facturas.vendor_id -> ofertas.vendor_id -> ofertas.material_id -> ordenes.details.material_id",
                description: "Buscar material_id en ofertas del vendor y luego en orden"
            }
        }
    },
    
    ordenes: {
        relatedTo: ["facturas", "ofertas"],
        foreignKeys: {
            vendor_id: {
                entity: "ofertas",
                field: "vendor_id", 
                type: "one-to-many"
            }
        }
    },
    
    ofertas: {
        relatedTo: ["facturas", "ordenes"],
        foreignKeys: {
            vendor_id: {
                entity: "facturas",
                field: "vendor_id",
                type: "many-to-one"
            }
        }
    }
};
```

---

## ⚡ Sistema de Reglas de Negocio

### Estructura de Reglas:
```javascript
// business-rules-config.js
const BUSINESS_RULES = {
    // Regla: Matching de SKU entre Factura y Orden
    "factura_sku_matching": {
        // Metadatos
        name: "Factura SKU Matching",
        description: "Busca vendor_sku en orden y ofertas, pre-selecciona o oculta",
        active: true,
        priority: 1,
        
        // Disparadores
        triggers: [
            "on_factura_item_load",
            "on_factura_data_change", 
            "on_orden_selection_change"
        ],
        
        // Condiciones y Acciones
        conditions: [
            {
                id: "sku_in_orden_direct",
                condition: {
                    entity: "ordenes",
                    field: "details[].vendor_sku",
                    operator: "contains",
                    value: "{{current_factura.vendor_sku}}"
                },
                actions: [
                    {
                        type: "preselect_dropdown",
                        target: "sku_selector",
                        value: "{{matched_orden_detail.vendor_sku}}"
                    },
                    {
                        type: "show_container",
                        target: "item_container_{{index}}"
                    },
                    {
                        type: "log_debug",
                        message: "SKU encontrado directamente en orden"
                    }
                ]
            },
            {
                id: "sku_in_ofertas_indirect",
                condition: {
                    and: [
                        {
                            entity: "ordenes",
                            field: "details[].vendor_sku", 
                            operator: "not_contains",
                            value: "{{current_factura.vendor_sku}}"
                        },
                        {
                            entity: "ofertas",
                            field: "vendor_id",
                            operator: "equals",
                            value: "{{current_orden.vendor_id}}"
                        },
                        {
                            entity: "ofertas",
                            field: "vendor_sku",
                            operator: "contains", 
                            value: "{{current_factura.vendor_sku}}"
                        }
                    ]
                },
                actions: [
                    {
                        type: "query_related",
                        source: "ofertas.material_id",
                        target: "ordenes.details[].material_id"
                    },
                    {
                        type: "conditional_action",
                        condition: "{{query_result.found}}",
                        true_actions: [
                            {
                                type: "preselect_dropdown",
                                target: "sku_selector",
                                value: "{{query_result.matched_sku}}"
                            },
                            {
                                type: "show_container",
                                target: "item_container_{{index}}"
                            }
                        ],
                        false_actions: [
                            {
                                type: "hide_container", 
                                target: "item_container_{{index}}"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    
    // Regla: Validación de Vendor ID
    "vendor_validation": {
        name: "Vendor ID Validation",
        description: "Valida que vendor_id existe en ofertas",
        active: true,
        priority: 2,
        
        triggers: ["on_vendor_change"],
        
        conditions: [
            {
                id: "vendor_exists",
                condition: {
                    entity: "ofertas",
                    field: "vendor_id",
                    operator: "contains",
                    value: "{{current_factura.vendor_id}}"
                },
                actions: [
                    {
                        type: "enable_field",
                        target: "vendor_sku_input"
                    },
                    {
                        type: "clear_validation_error",
                        target: "vendor_id_field"
                    }
                ]
            }
        ],
        
        else_actions: [
            {
                type: "disable_field",
                target: "vendor_sku_input"
            },
            {
                type: "show_validation_error",
                target: "vendor_id_field",
                message: "Vendor ID no encontrado en ofertas"
            }
        ]
    }
};
```

---

## 🔍 Motor de Consultas (Query Engine)

### Funcionalidades:
```javascript
// query-engine.js
class QueryEngine {
    // Consulta simple
    query(entity, conditions) {
        // Buscar en localStorage por condiciones
    }
    
    // Consulta con relaciones
    queryRelated(fromEntity, toEntity, relationPath) {
        // Navegar relaciones definidas
    }
    
    // Consulta con path complejo
    queryPath(path, startValue) {
        // "facturas.vendor_id -> ofertas.vendor_id -> ofertas.material_id"
    }
    
    // Cache inteligente
    getCached(queryKey) {
        // Evitar re-consultas innecesarias
    }
}
```

---

## ⚙️ Ejecutor de Acciones

### Tipos de Acciones Soportadas:
```javascript
// rule-executor.js
const ACTION_TYPES = {
    // UI Actions
    "show_container": (target) => { /* Mostrar elemento */ },
    "hide_container": (target) => { /* Ocultar elemento */ },
    "enable_field": (target) => { /* Habilitar campo */ },
    "disable_field": (target) => { /* Deshabilitar campo */ },
    
    // Form Actions  
    "preselect_dropdown": (target, value) => { /* Pre-seleccionar opción */ },
    "clear_field": (target) => { /* Limpiar campo */ },
    "set_field_value": (target, value) => { /* Establecer valor */ },
    
    // Validation Actions
    "show_validation_error": (target, message) => { /* Mostrar error */ },
    "clear_validation_error": (target) => { /* Limpiar error */ },
    "validate_field": (target, rules) => { /* Validar campo */ },
    
    // Data Actions
    "query_related": (source, target) => { /* Consultar datos relacionados */ },
    "cache_result": (key, data) => { /* Guardar en cache */ },
    
    // Debug Actions
    "log_debug": (message) => { /* Log para debug */ },
    "highlight_element": (target) => { /* Destacar elemento */ }
};
```

---

## 🎮 Reactividad del Formulario

### Sistema de Eventos:
```javascript
// Integración con formulario.js
class FormReactivity {
    constructor(businessRulesEngine) {
        this.rulesEngine = businessRulesEngine;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Escuchar cambios en datos
        dataManager.on('facturas:updated', (data) => {
            this.rulesEngine.trigger('on_factura_data_change', data);
        });
        
        // Escuchar cambios en formulario
        document.addEventListener('change', (e) => {
            if (e.target.matches('.vendor-selector')) {
                this.rulesEngine.trigger('on_vendor_change', e.target.value);
            }
        });
        
        // Escuchar carga de items
        this.onFacturaItemLoad = (item, index) => {
            this.rulesEngine.trigger('on_factura_item_load', { item, index });
        };
    }
}
```

---

## 🎮 Interfaz de Desarrollo

### 🔧 Herramientas de Desarrollo:
- ✅ **Modal Guiado Paso a Paso** - Crear reglas sin conocimiento técnico
- ✅ **Detección Dinámica de Campos** - Inspecciona datos reales, no configuración
- ✅ **Editor Visual Drag & Drop** - Crear reglas sin tocar código JSON
- ✅ **Editor de Código** - Edición directa de JSON con validación sintáctica
- ✅ **Import/Export de Reglas** - Compartir reglas individuales o paquetes completos
- ✅ **Estado Interno** - Manejo de comportamientos dentro de la misma entidad
- ✅ **Testing en Vivo** - Probar reglas con datos reales inmediatamente
- ✅ **Debug Avanzado** - Logs detallados, contexto y paso a paso
- ✅ **Performance Profiler** - Métricas de rendimiento y optimización
- ✅ **Activar/Desactivar** - Toggle instantáneo para testing
- ✅ **Versionado** - Control de cambios en reglas
- ✅ **Hot Reload** - Cambios aplicados sin recargar página

### 🖥️ Interfaz Visual

#### **Panel Principal (Siempre Visible):**
```html
<!-- Panel de desarrollo siempre accesible -->
<div id="rules-dev-panel-toggle" class="rules-dev-toggle">
    🔧 Business Rules Engine - Dev Panel (5 reglas activas)
</div>
```

#### **Panel de Desarrollo (Expandible):**
```html
<div id="rules-panel" class="rules-dev-panel">
    <!-- Pestañas para desarrolladores -->
    <div class="rules-tabs">
        <button class="tab active" data-tab="editor">📝 Editor</button>
        <button class="tab" data-tab="active-rules">⚡ Reglas Activas</button>
        <button class="tab" data-tab="logs">📊 Debug & Logs</button>
        <button class="tab" data-tab="testing">🧪 Testing</button>
        <button class="tab" data-tab="performance">⏱️ Performance</button>
    </div>
    
    <!-- Contenido de pestañas -->
    <div class="tab-content">
        <!-- Pestaña: Reglas Activas -->
        <div id="active-rules" class="tab-panel">
            <div class="rule-item">
                <div class="rule-header">
                    <h4>🎯 Factura SKU Matching</h4>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <p class="rule-description">Busca vendor_sku en orden y ofertas</p>
                <div class="rule-stats">
                    <span class="badge">Ejecutada 12 veces</span>
                    <span class="badge success">Éxito: 10</span>
                    <span class="badge error">Error: 2</span>
                </div>
            </div>
            
            <div class="rule-item disabled">
                <div class="rule-header">
                    <h4>🔍 Vendor Validation</h4>
                    <label class="toggle-switch">
                        <input type="checkbox">
                        <span class="slider"></span>
                    </label>
                </div>
                <p class="rule-description">Valida que vendor_id existe</p>
                <div class="rule-stats">
                    <span class="badge">Desactivada</span>
                </div>
            </div>
        </div>
        
        <!-- Pestaña: Editor Visual + Código -->
        <div id="editor" class="tab-panel">
            <div class="editor-toolbar">
                <button class="btn btn-primary" onclick="openRuleCreationModal()">➕ Nueva Regla</button>
                <div class="import-export-group">
                    <button class="btn btn-secondary" onclick="importSingleRule()">📥 Importar Regla</button>
                    <button class="btn btn-secondary" onclick="exportSingleRule()">📤 Exportar Regla</button>
                    <button class="btn btn-info" onclick="importRulesPackage()">📂 Importar Paquete</button>
                    <button class="btn btn-info" onclick="exportAllRules()">📦 Exportar Todas</button>
                </div>
                <button class="btn btn-warning">🧪 Test All Rules</button>
                <button class="btn btn-info">🔄 Hot Reload</button>
                <div class="editor-mode-toggle">
                    <label>
                        <input type="radio" name="editor-mode" value="guided" checked> 🎯 Modal Guiado
                    </label>
                    <label>
                        <input type="radio" name="editor-mode" value="visual"> 🎨 Visual Builder
                    </label>
                    <label>
                        <input type="radio" name="editor-mode" value="code"> 💻 Code Editor
                    </label>
                    <label>
                        <input type="radio" name="editor-mode" value="split"> 🔀 Split View
                    </label>
                </div>
            </div>
            
            <div class="rule-editor">
                <div class="rule-list">
                    <div class="rule-item-editor">
                        <h4>🎯 factura_sku_matching</h4>
                        <div class="rule-controls">
                            <button class="btn btn-sm btn-edit">✏️ Editar</button>
                            <button class="btn btn-sm btn-test">🧪 Probar</button>
                            <button class="btn btn-sm btn-delete">🗑️</button>
                            <label class="toggle-switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="rule-editor-content">
                    <!-- Editor Visual (por defecto) -->
                    <div id="visual-editor" class="editor-mode">
                        <!-- Aquí va el editor visual que definiste antes -->
                    </div>
                    
                    <!-- Editor de Código -->
                    <div id="code-editor" class="editor-mode" style="display:none">
                        <textarea id="rule-json" class="code-editor" placeholder="Escribe o pega tu regla JSON aquí..."></textarea>
                        <div class="code-editor-actions">
                            <button class="btn btn-success">✅ Guardar</button>
                            <button class="btn btn-secondary">📋 Copiar JSON</button>
                            <button class="btn btn-info">🔍 Validar Sintaxis</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Pestaña: Testing -->
        <div id="testing" class="tab-panel">
            <div class="testing-toolbar">
                <h3>🧪 Testing de Reglas</h3>
                <button class="btn btn-primary">▶️ Ejecutar Test</button>
                <button class="btn btn-secondary">📄 Generar Reporte</button>
            </div>
            
            <div class="test-scenario">
                <h4>Escenario de Prueba:</h4>
                <div class="test-data">
                    <label>Datos de Factura:</label>
                    <textarea class="test-input" placeholder='{"vendor_sku": "SKU123", "vendor_id": "V001"}'></textarea>
                    
                    <label>Datos de Orden:</label>
                    <textarea class="test-input" placeholder='{"vendor_id": "V001", "details": [...]}'></textarea>
                    
                    <label>Datos de Ofertas:</label>
                    <textarea class="test-input" placeholder='[{"vendor_id": "V001", "vendor_sku": "SKU123"}]'></textarea>
                </div>
                
                <div class="test-results">
                    <h4>Resultado Esperado vs Real:</h4>
                    <div class="result-comparison">
                        <!-- Se llena dinámicamente con resultados -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Pestaña: Performance -->
        <div id="performance" class="tab-panel">
            <div class="performance-metrics">
                <div class="metric-card">
                    <h4>⏱️ Tiempo Promedio</h4>
                    <div class="metric-value">2.3ms</div>
                </div>
                <div class="metric-card">
                    <h4>🔥 Reglas Más Lentas</h4>
                    <div class="slow-rules-list">
                        <div class="slow-rule">factura_sku_matching: 5.2ms</div>
                        <div class="slow-rule">vendor_validation: 1.8ms</div>
                    </div>
                </div>
                <div class="metric-card">
                    <h4>📊 Ejecuciones/min</h4>
                    <div class="metric-value">127</div>
                </div>
            </div>
        </div>
        
        <!-- Pestaña: Logs -->
        <div id="logs" class="tab-panel">
            <div class="log-filters">
                <select id="log-level">
                    <option value="all">Todos los niveles</option>
                    <option value="error">Solo errores</option>
                    <option value="success">Solo éxitos</option>
                </select>
                <input type="text" placeholder="Filtrar por regla..." id="log-filter">
                <button class="btn btn-sm">🗑️ Limpiar</button>
            </div>
            
            <div class="log-entries">
                <div class="log-entry success">
                    <span class="timestamp">14:32:15</span>
                    <span class="rule-name">factura_sku_matching</span>
                    <span class="message">SKU encontrado en orden directamente</span>
                    <button class="btn-details">Ver detalles</button>
                </div>
                
                <div class="log-entry error">
                    <span class="timestamp">14:31:42</span>
                    <span class="rule-name">vendor_validation</span>
                    <span class="message">Vendor ID no encontrado</span>
                    <button class="btn-details">Ver detalles</button>
                </div>
            </div>
        </div>
    </div>
</div>
```

### 🎯 Modal Guiado para Crear Reglas:

#### **Flujo Completo de Creación sin Conocimiento Técnico:**

**Click "➕ Nueva Regla" → Abre Modal "Crear Nueva Regla de Negocio"**

##### **Paso 1: ¿Qué Quieres Lograr?**
```html
<div class="behavior-selection">
    <h3>Selecciona el comportamiento que deseas:</h3>
    <div class="behavior-options">
        <label class="behavior-card">
            <input type="radio" name="behavior" value="preselect">
            <div class="card-content">
                <h4>🎯 Pre-seleccionar campo automáticamente</h4>
                <p>Cuando se cumple una condición, seleccionar automáticamente un valor</p>
            </div>
        </label>
        
        <label class="behavior-card">
            <input type="radio" name="behavior" value="show-hide">
            <div class="card-content">
                <h4>👁️ Mostrar/Ocultar elementos</h4>
                <p>Controlar visibilidad de campos o contenedores</p>
            </div>
        </label>
        
        <label class="behavior-card">
            <input type="radio" name="behavior" value="validate">
            <div class="card-content">
                <h4>✅ Validar datos entre entidades</h4>
                <p>Verificar que los datos cumplan reglas de negocio</p>
            </div>
        </label>
        
        <label class="behavior-card">
            <input type="radio" name="behavior" value="internal-state">
            <div class="card-content">
                <h4>🔄 Control de estado interno</h4>
                <p>Evitar duplicados, límites, dependencias dentro de la misma entidad</p>
            </div>
        </label>
        
        <label class="behavior-card">
            <input type="radio" name="behavior" value="calculate">
            <div class="card-content">
                <h4>🧮 Calcular valores automáticamente</h4>
                <p>Realizar cálculos basados en otros campos</p>
            </div>
        </label>
    </div>
</div>
```

##### **Paso 2: ¿Cuándo Debe Ejecutarse?**
```html
<div class="trigger-selection">
    <h3>¿En qué momento quieres que se ejecute esta regla?</h3>
    <div class="trigger-options">
        <label><input type="checkbox" value="on_factura_item_load"> Al cargar datos de una factura</label>
        <label><input type="checkbox" value="on_orden_selection_change"> Al seleccionar una orden diferente</label>
        <label><input type="checkbox" value="on_vendor_change"> Al cambiar un proveedor</label>
        <label><input type="checkbox" value="on_sku_change"> Al modificar un SKU</label>
        <label><input type="checkbox" value="on_sku_selector_open"> Al abrir selector de SKU</label>
        <label><input type="checkbox" value="on_quantity_change"> Al cambiar cantidades</label>
        <label><input type="checkbox" value="on_item_add"> Al agregar nuevo item</label>
        <label><input type="checkbox" value="on_item_remove"> Al eliminar item</label>
    </div>
</div>
```

##### **Paso 3: Condición (Detección Dinámica de Campos):**
```html
<div class="condition-builder">
    <h3>La regla se ejecuta cuando:</h3>
    
    <div class="condition-row">
        <label>Campo origen:</label>
        <select id="source-entity" onchange="updateAvailableFields(this.value, 'source')">
            <option value="">Seleccionar entidad...</option>
            <!-- Opciones dinámicas basadas en entidades con datos -->
        </select>
        
        <select id="source-field" disabled>
            <option value="">Primero selecciona entidad</option>
            <!-- Campos detectados dinámicamente de datos reales -->
        </select>
        
        <select id="operator">
            <option value="equals">Es igual a</option>
            <option value="contains">Contiene</option>
            <option value="exists_in">Existe en</option>
            <option value="not_equals">No es igual a</option>
            <option value="greater_than">Es mayor que</option>
            <option value="already_used">Ya fue usado en</option>
        </select>
        
        <select id="target-entity" onchange="updateAvailableFields(this.value, 'target')">
            <option value="">Comparar con...</option>
            <!-- Entidades disponibles -->
        </select>
        
        <select id="target-field" disabled>
            <option value="">Selecciona entidad destino</option>
            <!-- Campos dinámicos del destino -->
        </select>
    </div>
    
    <div class="condition-scope" id="internal-state-options" style="display:none">
        <h4>Alcance para estado interno:</h4>
        <label><input type="radio" name="scope" value="current_factura"> Dentro de la misma factura</label>
        <label><input type="radio" name="scope" value="current_orden"> Dentro de la misma orden</label>
        <label><input type="radio" name="scope" value="current_vendor"> Del mismo proveedor</label>
        <label><input type="radio" name="scope" value="visible_items"> Elementos visibles en pantalla</label>
    </div>
</div>
```

##### **Paso 4: Acciones a Realizar:**
```html
<div class="action-builder">
    <h3>¿Qué hacer si se cumple la condición?</h3>
    
    <div class="action-primary">
        <label>Acción principal:</label>
        <select id="primary-action" onchange="updateActionOptions(this.value)">
            <option value="">Seleccionar acción...</option>
            <option value="preselect_dropdown">Pre-seleccionar en dropdown</option>
            <option value="filter_dropdown_options">Filtrar opciones de dropdown</option>
            <option value="disable_field">Deshabilitar campo</option>
            <option value="show_container">Mostrar contenedor</option>
            <option value="hide_container">Ocultar contenedor</option>
            <option value="show_message">Mostrar mensaje</option>
            <option value="calculate_value">Calcular valor</option>
        </select>
        
        <div id="action-details">
            <!-- Campos dinámicos según la acción seleccionada -->
        </div>
    </div>
    
    <div class="action-additional">
        <h4>Acciones adicionales:</h4>
        <label><input type="checkbox" value="disable_field"> Deshabilitar el campo (grisarlo)</label>
        <label><input type="checkbox" value="show_info_message"> Mostrar mensaje explicativo</label>
        <label><input type="checkbox" value="highlight_field"> Resaltar el campo visualmente</label>
        <label><input type="checkbox" value="update_counter"> Actualizar contador de disponibles</label>
        <label><input type="checkbox" value="log_debug"> Registrar en log para debugging</label>
    </div>
</div>
```

##### **Paso 5: Comportamiento Alternativo:**
```html
<div class="else-actions">
    <h3>¿Qué hacer si NO se cumple la condición?</h3>
    <div class="else-options">
        <label><input type="checkbox" value="enable_field"> Mantener campo habilitado</label>
        <label><input type="checkbox" value="clear_selection"> Limpiar cualquier selección previa</label>
        <label><input type="checkbox" value="show_all_options"> Mostrar todas las opciones disponibles</label>
        <label><input type="checkbox" value="hide_info_message"> Ocultar mensajes informativos</label>
        <label><input type="checkbox" value="reset_counter"> Resetear contadores</label>
    </div>
</div>
```

##### **Paso 6: Configuración Final:**
```html
<div class="rule-config">
    <div class="config-row">
        <label>Nombre de la regla:</label>
        <input type="text" id="rule-name" placeholder="Ej: Auto-selección SKU factura-orden">
    </div>
    
    <div class="config-row">
        <label>Descripción:</label>
        <textarea id="rule-description" placeholder="Explica qué hace esta regla y cuándo se usa"></textarea>
    </div>
    
    <div class="config-row">
        <label>Prioridad:</label>
        <select id="rule-priority">
            <option value="1">Alta (se ejecuta primero)</option>
            <option value="2">Media</option>
            <option value="3">Baja (se ejecuta al final)</option>
        </select>
    </div>
    
    <div class="config-row">
        <label>Estado inicial:</label>
        <label><input type="radio" name="initial-state" value="active" checked> Activa</label>
        <label><input type="radio" name="initial-state" value="inactive"> Inactiva (para testing)</label>
    </div>
</div>
```

##### **Paso 7: Vista Previa y Confirmación:**
```html
<div class="rule-preview">
    <h3>Resumen de tu regla:</h3>
    <div class="preview-content">
        <div class="preview-item">
            <strong>📋 CUÁNDO:</strong> <span id="preview-triggers">Al cargar datos de una factura</span>
        </div>
        <div class="preview-item">
            <strong>🎯 SI:</strong> <span id="preview-condition">El SKU de la factura coincide con un SKU en la orden</span>
        </div>
        <div class="preview-item">
            <strong>⚡ ENTONCES:</strong>
            <ul id="preview-actions">
                <li>Pre-seleccionar el SKU en el selector</li>
                <li>Deshabilitar el selector</li>
                <li>Mostrar mensaje explicativo</li>
            </ul>
        </div>
        <div class="preview-item">
            <strong>🔄 SI NO:</strong> <span id="preview-else">Mantener selector habilitado y limpio</span>
        </div>
    </div>
    
    <div class="preview-actions">
        <button class="btn btn-warning" onclick="testRuleWithMockData()">🧪 Probar Regla</button>
        <button class="btn btn-info" onclick="showGeneratedJSON()">👁️ Ver JSON Generado</button>
        <button class="btn btn-success" onclick="saveAndActivateRule()">💾 Guardar y Activar</button>
        <button class="btn btn-secondary" onclick="cancelRuleCreation()">❌ Cancelar</button>
    </div>
</div>
```

### 🎛️ Editor Visual de Reglas:
```javascript
// Editor visual de reglas
<div class="rule-visual-editor">
    <div class="rule-builder">
        <h4>Crear Nueva Regla</h4>
        
        <!-- Paso 1: Información básica -->
        <div class="step">
            <label>Nombre de la regla:</label>
            <input type="text" placeholder="mi_nueva_regla">
            
            <label>Descripción:</label>
            <textarea placeholder="Describe qué hace esta regla"></textarea>
        </div>
        
        <!-- Paso 2: Disparadores -->
        <div class="step">
            <label>¿Cuándo se ejecuta?</label>
            <div class="trigger-options">
                <label><input type="checkbox"> Al cargar factura</label>
                <label><input type="checkbox"> Al cambiar vendor</label>
                <label><input type="checkbox"> Al cambiar SKU</label>
                <label><input type="checkbox"> Al cargar orden</label>
            </div>
        </div>
        
        <!-- Paso 3: Condiciones -->
        <div class="step">
            <label>Condiciones:</label>
            <div class="condition-builder">
                <select class="entity-select">
                    <option>facturas</option>
                    <option>ordenes</option>
                    <option>ofertas</option>
                </select>
                
                <select class="field-select">
                    <option>vendor_sku</option>
                    <option>vendor_id</option>
                    <option>material_id</option>
                </select>
                
                <select class="operator-select">
                    <option>contiene</option>
                    <option>es igual a</option>
                    <option>no contiene</option>
                </select>
                
                <input type="text" placeholder="valor o {{variable}}">
                
                <button class="btn btn-sm">➕ Agregar condición</button>
            </div>
        </div>
        
        <!-- Paso 4: Acciones -->
        <div class="step">
            <label>¿Qué hacer si se cumple?</label>
            <div class="action-builder">
                <select class="action-type">
                    <option>Pre-seleccionar en dropdown</option>
                    <option>Mostrar contenedor</option>
                    <option>Ocultar contenedor</option>
                    <option>Mostrar error</option>
                    <option>Calcular valor</option>
                </select>
                
                <input type="text" placeholder="elemento objetivo">
                <input type="text" placeholder="valor (opcional)">
                
                <button class="btn btn-sm">➕ Agregar acción</button>
            </div>
        </div>
        
        <div class="editor-actions">
            <button class="btn btn-primary">💾 Guardar Regla</button>
            <button class="btn btn-secondary">👁️ Vista Previa JSON</button>
            <button class="btn btn-warning">🧪 Probar Regla</button>
        </div>
    </div>
</div>
```

## 🐛 Sistema de Debug

### Interfaz de Desarrollo:
```javascript
// rules-debugger.js
class RulesDebugger {
    constructor() {
        this.executionLog = [];
        this.activeRules = new Map();
        this.mode = 'development'; // Solo modo desarrollo
    }
    
    showDebugPanel() {
        // Panel completo para desarrolladores
        this.showDeveloperPanel();
    }
    
    showDeveloperPanel() {
        // Panel completo con todas las funcionalidades
        // - Editor visual + código
        // - Logs detallados con contexto
        // - Testing en vivo
        // - Performance metrics
        // - Exportar/Importar configuraciones
    }
}
```

### 🔧 Capacidades de Desarrollo Avanzado:

#### **🎨 Editor Visual Drag & Drop:**
```javascript
// Crear reglas visualmente sin tocar JSON
const visualRuleBuilder = {
    // Arrastar y soltar condiciones
    dragDropConditions: true,
    
    // Pre-visualización en tiempo real
    livePreview: true,
    
    // Validación visual de sintaxis
    visualValidation: true,
    
    // Generación automática de JSON
    autoJsonGeneration: true
};
```

#### **💻 Editor de Código Profesional:**
```javascript
// Editor con todas las características IDE
const codeEditor = {
    syntaxHighlighting: true,
    autoCompletion: true,
    errorHighlighting: true,
    jsonValidation: true,
    formatOnSave: true,
    intelliSense: true
};
```

#### **🧪 Testing Framework Integrado:**
```javascript
// Testing completo de reglas
const testingFramework = {
    // Ejecutar tests con datos mock
    mockDataTesting: true,
    
    // Tests automáticos de regresión
    regressionTesting: true,
    
    // Comparación resultado esperado vs real
    resultComparison: true,
    
    // Reportes de cobertura de reglas
    coverageReports: true,
    
    // Tests de performance
    performanceTesting: true
};
```

#### **🔍 Debug Profundo:**
```javascript
const advancedDebugging = {
    // Breakpoints en reglas
    ruleBreakpoints: true,
    
    // Inspección de variables en tiempo real
    variableInspection: true,
    
    // Stack trace de ejecución de reglas
    executionStackTrace: true,
    
    // Highlighting de elementos afectados
    elementHighlighting: true,
    
    // Timeline de ejecución
    executionTimeline: true
};
```

#### **📊 Detección Dinámica de Campos:**
```javascript
// Sistema de inspección de datos reales (NO entity-config.js)
const detectAvailableFields = (entityType) => {
    const data = localStorage.getItem(entityType);
    if (!data) return [];
    
    const parsedData = JSON.parse(data);
    const allFields = new Set();
    
    // Analizar todos los registros para encontrar TODOS los campos
    parsedData.forEach(record => {
        extractAllFields(record, '', allFields);
    });
    
    return Array.from(allFields).sort();
};

const extractAllFields = (obj, prefix, fieldSet) => {
    Object.keys(obj).forEach(key => {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        fieldSet.add(fullPath);
        
        // Si es objeto, explorar recursivamente
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            if (Array.isArray(obj[key])) {
                // Para arrays, analizar el primer elemento
                if (obj[key].length > 0) {
                    extractAllFields(obj[key][0], `${fullPath}[]`, fieldSet);
                }
            } else {
                extractAllFields(obj[key], fullPath, fieldSet);
            }
        }
    });
};

// Resultado: campos reales detectados dinámicamente
const detectedFields = [
    "external_id",
    "sap_order_id",
    "vendor_name", 
    "details[].vendor_sku",
    "details[].quantity",
    "details[].material_id",
    "metadata.created_at",
    "internal_notes.comment"
    // ... todos los campos que realmente existen
];
```

#### **🔄 Manejo de Estado Interno:**
```javascript
// Reglas para comportamientos dentro de la misma entidad
const INTERNAL_STATE_RULES = {
    "prevent_duplicate_sku_same_factura": {
        "name": "Prevenir SKU Duplicado en Misma Factura",
        "description": "Si un SKU ya fue seleccionado en otro item, no mostrarlo en selector actual",
        "active": true,
        "priority": 2,
        
        "triggers": [
            "on_sku_selector_open",
            "on_sku_selection_change",
            "on_factura_item_added"
        ],
        
        "conditions": [{
            "id": "check_duplicate_sku_in_factura",
            "condition": {
                "type": "internal_state_check",
                "scope": "current_factura",
                "check": "field_already_used",
                "field": "vendor_sku",
                "exclude_current": true
            },
            "actions": [
                {
                    "type": "filter_dropdown_options",
                    "target": "sku_selector_{{current_item_index}}",
                    "filter_type": "exclude",
                    "values": "{{already_selected_skus}}"
                },
                {
                    "type": "update_dropdown_placeholder", 
                    "target": "sku_selector_{{current_item_index}}",
                    "message": "{{available_count}} SKUs disponibles ({{excluded_count}} ya seleccionados)"
                }
            ]
        }],
        
        "variables": {
            "already_selected_skus": {
                "type": "dynamic_array",
                "source": "current_factura.items[].vendor_sku",
                "exclude": "current_item_index"
            },
            "available_count": {
                "type": "calculated",
                "formula": "total_sku_options - already_selected_skus.length"
            }
        }
    }
};

// Nuevos tipos de acciones para estado interno
const INTERNAL_STATE_ACTIONS = {
    "filter_dropdown_options": (target, filterType, values) => {
        // Remover opciones ya seleccionadas dinámicamente
    },
    "check_field_duplicates": (scope, field, excludeCurrent) => {
        // Buscar valores duplicados en el scope
    },
    "get_used_values": (scope, field) => {
        // Obtener valores ya utilizados
    },
    "update_counter_display": (target, available, used) => {
        // Mostrar "X disponibles, Y usados"
    },
    "reevaluate_all_selectors": (scope) => {
        // Actualizar todos los selectores del scope
    }
};
```

#### **📥📤 Import/Export de Reglas:**
```javascript
// Funcionalidades de compartir reglas entre desarrolladores
const ruleImportExport = {
    // Exportar regla individual
    exportSingleRule: (ruleId) => {
        const rule = businessRules[ruleId];
        const jsonData = JSON.stringify(rule, null, 2);
        downloadJSON(jsonData, `rule_${ruleId}_${timestamp}.json`);
    },
    
    // Importar regla desde archivo
    importSingleRule: () => {
        showFileSelector({
            accept: '.json',
            onSelect: (file) => {
                const ruleData = JSON.parse(file.content);
                validateRuleStructure(ruleData);
                showRulePreview(ruleData);
            }
        });
    },
    
    // Exportar paquete completo
    exportAllRules: () => {
        const rulesPackage = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            rules: businessRules,
            metadata: {
                totalRules: Object.keys(businessRules).length,
                activeRules: Object.values(businessRules).filter(r => r.active).length
            }
        };
        downloadJSON(rulesPackage, `business_rules_package_${timestamp}.json`);
    },
    
    // Importar paquete completo
    importRulesPackage: () => {
        showFileSelector({
            accept: '.json',
            onSelect: (file) => {
                const package = JSON.parse(file.content);
                showPackagePreview(package);
                // Permitir selección de reglas específicas a importar
            }
        });
    }
};
```

### 🔧 Configuración de Desarrollo:
```javascript
const DEVELOPMENT_CONFIG = {
    // Modo desarrollador siempre activo
    mode: 'development',
    
    // Todas las herramientas habilitadas
    tools: {
        visualEditor: true,
        codeEditor: true,
        splitView: true,
        liveTesting: true,
        performanceProfiler: true,
        advancedDebugging: true,
        hotReload: true,
        exportImport: true,
        ruleVersioning: true,
        backupRestore: true
    },
    
    // Debug completo
    debug: {
        enabled: true,
        logLevel: 'verbose',
        showExecutionTime: true,
        highlightAffectedElements: true,
        showDataContext: true,
        recordExecutionHistory: true,
        enableBreakpoints: true
    },
    
    // Performance monitoring
    performance: {
        trackExecutionTime: true,
        memoryUsageMonitoring: true,
        slowRuleDetection: true,
        optimizationSuggestions: true
    }
};
```

---

## 🎯 Casos de Uso de Estado Interno

### **📋 Ejemplos Prácticos de Comportamientos Complejos:**

#### **1. SKU No Duplicado en Misma Factura:**
```json
{
  "prevent_duplicate_sku_same_factura": {
    "name": "Prevenir SKU Duplicado en Misma Factura",
    "description": "Si un SKU ya fue seleccionado en otro item, no mostrarlo en selector actual",
    "behavior_type": "internal_state",
    "scope": "current_factura",
    "triggers": ["on_sku_selector_open", "on_sku_selection_change"],
    "condition": {
      "type": "field_already_used",
      "field": "vendor_sku",
      "exclude_current_item": true
    },
    "actions": [
      {
        "type": "filter_dropdown_options",
        "target": "sku_selector",
        "filter_type": "exclude",
        "values": "{{used_skus}}"
      },
      {
        "type": "update_placeholder",
        "message": "{{available_count}} SKUs disponibles ({{used_count}} ya seleccionados)"
      }
    ]
  }
}
```

#### **2. Límite de Cantidad Total:**
```json
{
  "total_quantity_limit": {
    "name": "Límite de Cantidad Total por Factura",
    "description": "La suma de cantidades no puede exceder el límite de la orden",
    "behavior_type": "internal_state",
    "scope": "current_factura",
    "triggers": ["on_quantity_change", "on_item_add"],
    "condition": {
      "type": "sum_exceeds_limit",
      "field": "quantity",
      "limit_source": "{{orden_max_quantity}}"
    },
    "actions": [
      {
        "type": "disable_quantity_increase",
        "target": "quantity_input_{{current_item}}"
      },
      {
        "type": "show_warning_message",
        "message": "Límite alcanzado: {{current_sum}}/{{max_limit}}"
      }
    ]
  }
}
```

#### **3. Vendor Único por Factura:**
```json
{
  "single_vendor_per_factura": {
    "name": "Un Solo Vendor por Factura",
    "description": "Todos los items deben ser del mismo proveedor",
    "behavior_type": "internal_state",
    "scope": "current_factura",
    "triggers": ["on_vendor_change", "on_item_add"],
    "condition": {
      "type": "multiple_values_exist",
      "field": "vendor_id"
    },
    "actions": [
      {
        "type": "filter_vendor_options",
        "target": "vendor_selector_{{current_item}}",
        "values": "{{first_selected_vendor}}"
      },
      {
        "type": "lock_vendor_selection",
        "target": "all_vendor_selectors",
        "except": "first_item"
      }
    ]
  }
}
```

#### **4. Prioridad de Items (Primer Item Tiene Preferencia):**
```json
{
  "first_item_priority": {
    "name": "Primer Item Tiene Preferencia",
    "description": "El primer item puede seleccionar cualquier opción, los demás están limitados",
    "behavior_type": "internal_state",
    "scope": "current_factura",
    "triggers": ["on_item_selection", "on_first_item_change"],
    "condition": {
      "type": "item_position_check",
      "position": "not_first"
    },
    "actions": [
      {
        "type": "filter_options_based_on_first",
        "target": "current_item_selectors",
        "reference": "first_item_selections"
      },
      {
        "type": "show_priority_indicator",
        "message": "Opciones limitadas por selección del primer item"
      }
    ]
  }
}
```

#### **5. Dependencias entre Campos del Mismo Item:**
```json
{
  "material_vendor_dependency": {
    "name": "Material debe coincidir con Vendor",
    "description": "Si se selecciona un material, el vendor debe ser compatible",
    "behavior_type": "internal_state",
    "scope": "current_item",
    "triggers": ["on_material_change", "on_vendor_change"],
    "condition": {
      "type": "fields_incompatible",
      "field1": "material_id",
      "field2": "vendor_id",
      "compatibility_source": "material_vendor_matrix"
    },
    "actions": [
      {
        "type": "show_compatibility_warning",
        "message": "Este material no está disponible con el vendor seleccionado"
      },
      {
        "type": "suggest_compatible_options",
        "target": "vendor_selector"
      }
    ]
  }
}
```

### **🔧 Funciones de Estado Interno:**

```javascript
// Sistema de detección de estado actual
const getCurrentFacturaState = () => {
    const currentFactura = getCurrentFacturaData();
    return {
        items: currentFactura.items || [],
        usedValues: extractUsedValues(currentFactura.items),
        totals: calculateTotals(currentFactura.items),
        constraints: evaluateConstraints(currentFactura),
        itemCount: currentFactura.items.length,
        firstItemSelections: currentFactura.items[0] || {}
    };
};

// Extractor de valores ya utilizados
const extractUsedValues = (items) => {
    const used = {};
    items.forEach((item, index) => {
        Object.keys(item).forEach(field => {
            if (!used[field]) used[field] = [];
            if (item[field] && !used[field].includes(item[field])) {
                used[field].push({
                    value: item[field],
                    itemIndex: index
                });
            }
        });
    });
    return used;
};

// Calculador de totales
const calculateTotals = (items) => {
    return {
        totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        totalValue: items.reduce((sum, item) => sum + (item.value || 0), 0),
        uniqueVendors: new Set(items.map(item => item.vendor_id)).size,
        uniqueMaterials: new Set(items.map(item => item.material_id)).size
    };
};

// Evaluador de restricciones
const evaluateConstraints = (factura) => {
    const orden = getRelatedOrden(factura.sap_order_id);
    return {
        maxQuantity: orden?.max_quantity || Infinity,
        allowedVendors: orden?.allowed_vendors || [],
        requiredMaterials: orden?.required_materials || [],
        budgetLimit: orden?.budget_limit || Infinity
    };
};
```

---

## 📦 Exportabilidad del Módulo

### Estructura para Exportación:
```
business-rules/          # Carpeta completa copiable
├── core/               # Motor independiente
│   ├── engine.js
│   ├── query.js
│   └── executor.js
├── config/             # Configuraciones
│   ├── relations.js
│   └── rules.js
├── integrations/       # Adaptadores
│   ├── data-manager.js
│   └── form-integration.js
└── README.md          # Documentación de uso
```

### API de Integración:
```javascript
// Uso en otro proyecto
import BusinessRulesEngine from './business-rules/core/engine.js';

const rulesEngine = new BusinessRulesEngine({
    dataProvider: customDataProvider,  // Adaptador para datos
    actionProvider: customActionProvider,  // Adaptador para acciones
    relations: customRelations,
    rules: customRules
});

rulesEngine.initialize();
```

---

## 🚀 Plan de Implementación

### **Fase 1: Motor Básico (2-3 días)**
1. ✅ Crear estructura de archivos
2. ✅ Implementar QueryEngine básico
3. ✅ Crear sistema de relaciones simple
4. ✅ Ejecutor de acciones básicas

### **Fase 2: Reglas Complejas (3-4 días)**
5. ✅ Parser de condiciones complejas (AND, OR, NOT)
6. ✅ Sistema de templates ({{variable}})
7. ✅ Acciones condicionales
8. ✅ Cache inteligente

### **Fase 3: Integración (2-3 días)**
9. ✅ Integración con DataManager
10. ✅ Reactividad en formulario
11. ✅ Testing con caso real (SKU matching)

### **Fase 4: Debug y Desarrollo (2-3 días)**
12. ✅ Panel de debug
13. ✅ Interfaz de desarrollo
14. ✅ Editor visual de reglas

### **Fase 5: Exportabilidad (1-2 días)**
15. ✅ Refactoring para independencia
16. ✅ Documentación de API
17. ✅ Ejemplos de integración

---

## 🎯 Casos de Uso Específicos

### Caso 1: SKU Matching (Ejemplo Principal)
```javascript
// Configuración para el caso específico mencionado
"factura_sku_to_orden_matching": {
    triggers: ["on_factura_item_load"],
    conditions: [
        // 1. Buscar directo en orden
        "vendor_sku in orden.details[].vendor_sku",
        // 2. Si no está, buscar en ofertas del vendor
        "vendor_sku in ofertas[vendor_id=orden.vendor_id].vendor_sku", 
        // 3. Si está en ofertas, buscar material_id en orden
        "ofertas.material_id in orden.details[].material_id"
    ],
    actions: ["preselect_or_hide"]
}
```

### Caso 2: Validación de Vendor
```javascript
"vendor_validation": {
    triggers: ["on_vendor_change"],
    conditions: ["vendor_id exists in ofertas"],
    actions: ["enable_sku_input", "populate_sku_options"]
}
```

### Caso 3: Cálculos Automáticos
```javascript
"auto_calculations": {
    triggers: ["on_quantity_change", "on_price_change"],
    conditions: ["quantity > 0 AND price > 0"],
    actions: ["calculate_total", "update_summary"]
}
```

---

## 🔧 Configuración de Desarrollo

### Variables de Debug:
```javascript
const DEBUG_CONFIG = {
    enabled: true,
    logLevel: 'verbose', // 'error', 'warn', 'info', 'verbose'
    showPanel: true,
    highlightElements: true,
    performanceMonitoring: true
};
```

### Testing:
```javascript
// Modo de testing para reglas
const TESTING_MODE = {
    mockData: true,
    stepByStep: true,
    validateResults: true,
    exportResults: true
};
```

---

## 📚 Próximos Pasos

1. **Revisar y aprobar** esta especificación
2. **Comenzar Fase 1:** Crear estructura básica
3. **Implementar caso piloto:** SKU matching
4. **Iterar y mejorar** basado en feedback
5. **Escalar** a más casos de uso

---

## 💡 Notas Importantes

- **Mantener simplicidad:** Aunque sea potente, debe ser fácil de configurar
- **Performance first:** Cache agresivo para consultas complejas  
- **Debugging esencial:** Sin debug, será imposible mantener reglas complejas
- **Documentación viva:** Cada regla debe estar bien documentada
- **Versionado:** Cambios en reglas deben ser versionados y migrables

---

¿Esta especificación cubre tus necesidades? ¿Hay algo que modificar o agregar antes de comenzar la implementación?

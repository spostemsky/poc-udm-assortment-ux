# 🗃️ Data Manager - Gestor de Datos JSON Flexible

## 📋 Descripción

Data Manager es un sistema completamente flexible y reutilizable para gestionar datos JSON en aplicaciones web. Permite cargar, visualizar, editar y exportar datos de múltiples entidades de forma dinámica, configurando todo mediante un simple archivo de configuración.

## ✨ Características Principales

- **🔧 Completamente Configurable**: Define entidades mediante configuración JSON
- **📊 Renderizado Dinámico**: Tablas generadas automáticamente según configuración
- **🔔 Sistema de Eventos**: EventTarget integrado para comunicación en tiempo real
- **📁 Gestión de Archivos**: Carga múltiples archivos JSON por entidad
- **✏️ Edición Inline**: Editor JSON integrado para modificar registros
- **💾 Almacenamiento Local**: Persistencia automática en localStorage
- **📤 Exportación**: Descarga datos en formato JSON
- **🎨 Interfaz Moderna**: UI responsiva y amigable
- **🔍 Validación**: Sistema de validación configurable con campos únicos
- **🚀 Fácil Integración**: Solo copiar y pegar la carpeta

## 📁 Estructura de Archivos

```
data-manager/
├── data-manager.js          # Clase principal del gestor
├── data-manager.html        # Interfaz de usuario
├── data-manager.css         # Estilos CSS
├── entity-config.js         # Configuración de entidades
└── README.md               # Esta documentación
```

## 🚀 Instalación y Uso

### 1. Copiar Archivos
```bash
# Copia toda la carpeta data-manager a tu proyecto
cp -r data-manager/ /ruta/a/tu/proyecto/
```

### 2. Incluir en tu HTML
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Aplicación</title>
    <link rel="stylesheet" href="data-manager/data-manager.css">
</head>
<body>
    <!-- Tu contenido aquí -->
    
    <!-- Scripts del Data Manager -->
    <script src="data-manager/entity-config.js"></script>
    <script src="data-manager/data-manager.js"></script>
    <script src="data-manager/event-examples.js"></script> <!-- Opcional: ejemplos de eventos -->
</body>
</html>
```

### 3. Configurar Entidades
Edita el archivo `entity-config.js` para definir tus entidades:

```javascript
const ENTITY_CONFIG = {
    settings: {
        storagePrefix: 'mi_app_',  // Prefijo único para tu aplicación
        theme: 'default',
        language: 'es'
    },
    entities: {
        productos: {
            displayName: "Productos",
            displayNameSingular: "Producto",
            icon: "🛍️",
            fields: [
                { key: "codigo", label: "Código", type: "text", required: true },
                { key: "nombre", label: "Nombre", type: "text", required: true },
                { key: "precio", label: "Precio", type: "currency" },
                { key: "stock", label: "Stock", type: "number" }
            ],
            template: {
                codigo: "",
                nombre: "",
                precio: 0,
                stock: 0
            }
        }
    }
};
```

## ⚙️ Configuración de Entidades

### Estructura de Configuración

```javascript
{
    displayName: "Nombre Plural",           // Ej: "Productos"
    displayNameSingular: "Nombre Singular", // Ej: "Producto" 
    icon: "🛍️",                            // Emoji para la interfaz
    description: "Descripción opcional",    // Descripción de la entidad
    
    fields: [
        {
            key: "nombre_campo",              // Clave del campo en el JSON
            label: "Etiqueta Visible",       // Texto mostrado en la tabla
            type: "text",                    // Tipo de dato
            required: true,                  // Si es obligatorio
            searchable: true,                // Si es buscable (futuro)
            sortable: true                   // Si es ordenable (futuro)
        }
    ],
    
    template: {
        nombre_campo: "valor_por_defecto"   // Template para nuevos registros
    },
    
    config: {
        allowMultipleFiles: true,           // Permitir múltiples archivos
        validateOnSave: true,               // Validar al guardar
        autoGenerateId: false,              // Auto-generar IDs
        confirmDelete: true                 // Confirmar antes de eliminar
    }
}
```

### Tipos de Campo Soportados

| Tipo | Descripción | Ejemplo de Valor |
|------|-------------|------------------|
| `text` | Texto simple | "Juan Pérez" |
| `number` | Número entero o decimal | 123, 45.67 |
| `currency` | Moneda (formateado como $X.XX) | 99.99 |
| `date` | Fecha (ISO string) | "2024-01-15" |
| `boolean` | Verdadero/Falso (muestra ✅/❌) | true, false |
| `array` | Array (muestra conteo si display: "count") | [1, 2, 3] |

## 🔧 API de la Clase DataManager

### Constructor
```javascript
const manager = new DataManager(config);  // config opcional
```

### Métodos Principales

#### Gestión de Datos
- `getData(entityType)` - Obtiene datos de una entidad
- `saveData(entityType, data)` - Guarda datos de una entidad
- `clearData(entityType)` - Limpia datos de una entidad

#### Interfaz
- `switchEntity(entityType)` - Cambia la entidad activa
- `refreshData()` - Actualiza la vista de datos
- `addNewRecord()` - Abre modal para nuevo registro
- `editRecord(index)` - Edita un registro existente

#### Utilidades
- `exportData(entityType)` - Exporta datos de una entidad
- `exportAllData()` - Exporta todas las entidades
- `getSystemInfo()` - Información del sistema

## 🎯 Ejemplos de Uso

### Ejemplo 1: E-commerce Simple
```javascript
const ENTITY_CONFIG = {
    settings: {
        storagePrefix: 'ecommerce_',
    },
    entities: {
        productos: {
            displayName: "Productos",
            displayNameSingular: "Producto",
            icon: "🛍️",
            fields: [
                { key: "sku", label: "SKU", type: "text", required: true },
                { key: "nombre", label: "Nombre", type: "text", required: true },
                { key: "precio", label: "Precio", type: "currency", required: true },
                { key: "stock", label: "Stock", type: "number" },
                { key: "activo", label: "Activo", type: "boolean" }
            ],
            template: {
                sku: "",
                nombre: "",
                precio: 0,
                stock: 0,
                activo: true
            }
        },
        clientes: {
            displayName: "Clientes",
            displayNameSingular: "Cliente", 
            icon: "👥",
            fields: [
                { key: "email", label: "Email", type: "text", required: true },
                { key: "nombre", label: "Nombre", type: "text", required: true },
                { key: "telefono", label: "Teléfono", type: "text" },
                { key: "fechaRegistro", label: "Registro", type: "date" }
            ],
            template: {
                email: "",
                nombre: "",
                telefono: "",
                fechaRegistro: new Date().toISOString().split('T')[0]
            }
        }
    }
};
```

### Ejemplo 2: Sistema de Inventario
```javascript
const ENTITY_CONFIG = {
    settings: {
        storagePrefix: 'inventario_',
    },
    entities: {
        articulos: {
            displayName: "Artículos",
            displayNameSingular: "Artículo",
            icon: "📦",
            fields: [
                { key: "codigo", label: "Código", type: "text", required: true },
                { key: "descripcion", label: "Descripción", type: "text", required: true },
                { key: "categoria", label: "Categoría", type: "text" },
                { key: "precio", label: "Precio", type: "currency" },
                { key: "stock", label: "Stock", type: "number" },
                { key: "proveedores", label: "Proveedores", type: "array", display: "count" }
            ],
            template: {
                codigo: "",
                descripcion: "",
                categoria: "",
                precio: 0,
                stock: 0,
                proveedores: []
            }
        }
    }
};
```

## 🎨 Personalización de Estilos

El Data Manager usa CSS estándar. Puedes personalizar los estilos editando `data-manager.css` o sobrescribiendo las clases en tu CSS principal:

```css
/* Cambiar colores principales */
.btn-primary {
    background: #your-color !important;
}

/* Personalizar tabla */
.data-table th {
    background: #your-header-color !important;
}

/* Cambiar tema del modal */
.modal-content {
    border-radius: 20px !important;
}
```

## 🔍 Validación de Datos

### Validación Automática
El sistema valida automáticamente:
- Campos marcados como `required: true`
- Formato JSON válido en el editor
- Tipos de datos básicos

### Validación Personalizada
Puedes extender la validación sobrescribiendo el método `validateSingleRecord`:

```javascript
// Extender validación
dataManager.validateSingleRecord = function(entityType, record) {
    const result = DataManager.prototype.validateSingleRecord.call(this, entityType, record);
    
    // Tu validación personalizada aquí
    if (entityType === 'productos' && record.precio < 0) {
        result.errors.push('El precio no puede ser negativo');
        result.isValid = false;
    }
    
    return result;
};
```

## 🚀 Funcionalidades Avanzadas

### Atajos de Teclado
- `Ctrl+N`: Nuevo registro
- `Ctrl+R`: Actualizar datos
- `Ctrl+S`: Guardar (en modal)
- `Escape`: Cerrar modal

### Funciones JavaScript Disponibles
```javascript
// Funciones globales disponibles en el HTML
refreshData()           // Actualizar vista
exportAllData()         // Exportar todo
clearAllData()          // Limpiar todo
switchEntity(key)       // Cambiar entidad
addNewRecord()          // Nuevo registro
showSystemInfo()        // Info del sistema (debug)
exportEntity(key)       // Exportar entidad específica
clearEntityData(key)    // Limpiar entidad específica
```

## 🐛 Depuración y Troubleshooting

### Mensajes de Debug
El sistema muestra información útil en la consola del navegador:

```javascript
// Ver información del sistema
dataManager.printSystemInfo();

// Ver configuración cargada
console.log(ENTITY_CONFIG);

// Ver datos de una entidad
console.log(dataManager.getData('mi_entidad'));
```

### Problemas Comunes

**Error: "No se han definido entidades"**
- Verifica que `entity-config.js` esté cargado correctamente
- Asegúrate de que `ENTITY_CONFIG.entities` tenga al menos una entidad

**Los tabs no aparecen**
- Verifica que el HTML tenga el elemento `.entity-tabs`
- Comprueba que no haya errores de JavaScript en la consola

**Los archivos no se cargan**
- Verifica que los archivos JSON tengan formato válido
- Asegúrate de que los campos requeridos estén presentes

## 🔄 Migración y Compatibilidad

### Desde la Versión Original
Para migrar desde la versión hardcodeada original:

1. Copia los nuevos archivos
2. Crea `entity-config.js` con tus entidades actuales
3. Los datos en localStorage se mantienen automáticamente
4. Actualiza cualquier código personalizado que uses

### Compatibilidad con Navegadores
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 Licencia

Este código es de libre uso. Puedes modificarlo y distribuirlo según tus necesidades.

## 🤝 Contribuciones

Para mejorar este sistema:
1. Identifica el problema o mejora
2. Implementa los cambios
3. Prueba con diferentes configuraciones
4. Documenta los cambios

---

## 🔔 Sistema de Eventos

El Data Manager incluye un sistema completo de eventos basado en EventTarget que permite integración en tiempo real con otras aplicaciones.

### Tipos de Eventos

#### 📁 Eventos de Datos
- `{entity}:loaded` - Archivos cargados
- `{entity}:updated` - Datos actualizados  
- `{entity}:deleted` - Registros eliminados
- `{entity}:cleared` - Todos los datos eliminados

#### 🔄 Eventos de Estado
- `entity:changed` - Cambio de entidad activa
- `validation:failed` - Error de validación
- `manager:initialized` - Sistema inicializado

#### 📊 Eventos Genéricos
- `data:updated` - Cualquier actualización
- `data:loaded` - Cualquier carga
- `data:cleared` - Cualquier limpieza

### Uso Básico

```javascript
// Escuchar carga de facturas
dataManager.on('facturas:loaded', function(event) {
    const { recordsAdded, duplicateCount } = event.detail;
    console.log(`Cargadas ${recordsAdded} facturas, ${duplicateCount} duplicados`);
});

// Escuchar cambio de entidad
dataManager.on('entity:changed', function(event) {
    const { previousEntity, currentEntity } = event.detail;
    console.log(`Cambiado de ${previousEntity} a ${currentEntity}`);
});

// Escuchar cualquier actualización
dataManager.on('data:updated', function(event) {
    const { entityType, recordCount } = event.detail;
    updateDashboard(entityType, recordCount);
});
```

### Integración con Formularios

```javascript
// Sincronizar con formulario externo
dataManager.on('facturas:updated', function(event) {
    const facturas = event.detail.data;
    
    // Actualizar dropdown de facturas
    const select = document.getElementById('invoice-select');
    select.innerHTML = '';
    facturas.forEach(factura => {
        const option = document.createElement('option');
        option.value = factura.external_id;
        option.textContent = factura.external_id;
        select.appendChild(option);
    });
});

// Verificar eliminaciones
dataManager.on('facturas:deleted', function(event) {
    const deletedIds = event.detail.deletedRecords.map(r => r.external_id);
    const currentId = document.getElementById('invoice-select').value;
    
    if (deletedIds.includes(currentId)) {
        alert('La factura seleccionada fue eliminada');
        document.getElementById('invoice-select').selectedIndex = 0;
    }
});
```

Para más ejemplos detallados y casos de uso avanzados, consulta `event-examples.js`.

## 📞 Soporte

Si encuentras problemas o tienes preguntas:
1. Revisa esta documentación
2. Verifica la consola del navegador para errores
3. Comprueba que la configuración sea válida
4. Consulta los ejemplos incluidos y `event-examples.js`

**Data Manager v2.1** - ¡Happy coding! 🚀

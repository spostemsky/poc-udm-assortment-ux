# 🔔 Prueba de Integración: Sistema de Eventos

## 📋 Instrucciones para Probar la Sincronización Automática

### 🎯 Objetivo
Validar que el selector de facturas del formulario se actualiza automáticamente cuando se realizan cambios en el Data Manager.

### 🚀 Pasos para la Prueba

#### **1. Abrir ambas aplicaciones**
```
1. Abrir: formulario/formulario.html
2. Hacer clic en "📊 Gestionar Datos" (se abre en nueva pestaña)
3. Tener ambas pestañas visibles lado a lado
```

#### **2. Verificar estado inicial**
```
✅ Formulario: Selector debe mostrar facturas existentes
✅ Data Manager: Debe mostrar facturas en la tabla
✅ Consola del formulario: Debe mostrar logs de configuración
```

#### **3. Probar CARGA de facturas**
```
En Data Manager:
1. Ir a tab "Facturas"
2. Hacer clic en "📤 Subir archivo JSON"
3. Cargar archivo con nuevas facturas

Resultado esperado en Formulario:
✅ Selector se actualiza automáticamente
✅ Aparece indicador "🔄 Sincronizado con Data Manager"
✅ Nuevas facturas aparecen en el dropdown
✅ Logs en consola confirman sincronización
```

#### **4. Probar ELIMINACIÓN de facturas**
```
En Data Manager:
1. Seleccionar una factura en la tabla
2. Hacer clic en "🗑️" (eliminar)
3. Confirmar eliminación

Resultado esperado en Formulario:
✅ Selector se actualiza automáticamente
✅ Factura eliminada desaparece del dropdown
✅ Si era la seleccionada, cambia a otra automáticamente
✅ Indicador de sincronización se muestra
```

#### **5. Probar LIMPIEZA completa**
```
En Data Manager:
1. Hacer clic en "🗑️ Limpiar" (sidebar)
2. Confirmar limpieza de facturas

Resultado esperado en Formulario:
✅ Selector muestra "No hay facturas disponibles"
✅ Indicador de sincronización se muestra
✅ Logs confirman limpieza
```

### 🔍 Qué Observar

#### **En la Consola del Formulario:**
```
🔔 Configurando event listeners del Data Manager...
✅ Event listeners configurados correctamente
📄 Facturas actualizadas: X registros (file_upload)
🔄 Actualizando dropdown de facturas...
✅ Dropdown actualizado: X facturas disponibles
✅ Selector de facturas sincronizado automáticamente
```

#### **En la Interfaz:**
- ⚡ **Cambios instantáneos** en el dropdown
- 🔄 **Indicador verde** "Sincronizado con Data Manager"
- 📊 **Conteo correcto** de facturas
- 🎯 **Selección preservada** cuando es posible

### ⚠️ Casos Especiales a Probar

#### **Factura en uso eliminada:**
```
1. Seleccionar una factura específica en el formulario
2. Eliminar esa misma factura en Data Manager
3. Verificar que el formulario cambia automáticamente a otra factura
```

#### **Carga con duplicados:**
```
1. Cargar archivo con facturas que ya existen
2. Verificar que el selector no se duplica
3. Logs deben mostrar duplicados omitidos
```

#### **Data Manager no disponible:**
```
1. Abrir solo el formulario (sin Data Manager)
2. Verificar logs de intentos de conexión
3. Abrir Data Manager después
4. Verificar que se conecta automáticamente
```

### 🐛 Problemas Conocidos y Soluciones

#### **"Data Manager no disponible"**
- **Causa**: Data Manager no está cargado
- **Solución**: Abrir data-manager.html primero, luego el formulario

#### **No se ven los logs**
- **Causa**: Consola no abierta
- **Solución**: F12 → Console en ambas pestañas

#### **Cambios no se reflejan**
- **Causa**: Posible error en event listeners
- **Solución**: Recargar formulario.html y verificar logs

### 📊 Métricas de Éxito

#### **✅ Prueba EXITOSA si:**
- Cambios se reflejan en < 1 segundo
- No hay errores en consola
- Indicador de sincronización aparece
- Logs muestran eventos correctos
- Funciona en ambas direcciones

#### **❌ Prueba FALLIDA si:**
- Cambios requieren refresh manual
- Errores en consola
- Dropdown no se actualiza
- Indicador no aparece
- Datos inconsistentes

### 🔧 Debugging

#### **Comandos útiles en consola:**
```javascript
// Verificar Data Manager
window.dataManager

// Ver datos actuales
dataManager.getData('facturas')

// Forzar actualización
actualizarDropdownFacturas()

// Ver listeners configurados
dataManager._events || dataManager.eventListeners
```

### 🎊 Resultado Esperado Final

**¡Una sincronización perfecta en tiempo real!**

- 🔄 **Automático**: Sin refreshes manuales
- ⚡ **Instantáneo**: Cambios en < 1 segundo  
- 🎯 **Inteligente**: Preserva selección cuando es posible
- 📊 **Informativo**: Logs detallados y indicadores visuales
- 🛡️ **Robusto**: Maneja casos edge correctamente

---

**¡Listo para probar el futuro de la sincronización de datos!** 🚀

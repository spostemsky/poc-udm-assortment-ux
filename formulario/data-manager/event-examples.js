// =============================================================================
// EJEMPLOS DE USO DEL SISTEMA DE EVENTOS - DATA MANAGER
// =============================================================================

/**
 * Este archivo contiene ejemplos prácticos de cómo usar el sistema de eventos
 * del Data Manager para integrar con otras aplicaciones o componentes.
 */

// =============================================================================
// CONFIGURACIÓN INICIAL
// =============================================================================

// Asegurarse de que el Data Manager esté inicializado
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que dataManager esté disponible
    if (typeof dataManager !== 'undefined') {
        setupEventListeners();
    } else {
        // Escuchar el evento de inicialización
        document.addEventListener('manager:initialized', setupEventListeners);
    }
});

function setupEventListeners() {
    console.log('🚀 Configurando listeners de eventos del Data Manager...');
    
    // =============================================================================
    // EVENTOS DE DATOS
    // =============================================================================
    
    // 📁 Carga de archivos
    dataManager.on('facturas:loaded', function(event) {
        const { recordsAdded, duplicateCount, invalidCount, files } = event.detail;
        console.log(`📁 Facturas cargadas:`, {
            archivos: files.length,
            registros: recordsAdded,
            duplicados: duplicateCount,
            inválidos: invalidCount
        });
        
        // Ejemplo: Actualizar contador en UI
        updateRecordCounter('facturas', dataManager.getData('facturas').length);
        
        // Ejemplo: Mostrar notificación personalizada
        if (duplicateCount > 0) {
            showCustomNotification(`Se omitieron ${duplicateCount} duplicados`, 'warning');
        }
    });
    
    // 🔄 Actualización de datos
    dataManager.on('ordenes:updated', function(event) {
        const { data, operation, recordCount } = event.detail;
        console.log(`🔄 Órdenes actualizadas: ${recordCount} registros (${operation})`);
        
        // Ejemplo: Invalidar cache de formulario
        if (typeof invalidateFormCache === 'function') {
            invalidateFormCache('ordenes');
        }
        
        // Ejemplo: Sincronizar con otra aplicación
        syncWithExternalApp('ordenes', data);
    });
    
    // 🗑️ Eliminación de registros
    dataManager.on('facturas:deleted', function(event) {
        const { deletedRecords, remainingCount } = event.detail;
        console.log(`🗑️ Facturas eliminadas:`, deletedRecords.map(r => r.external_id));
        
        // Ejemplo: Verificar si facturas eliminadas están en uso
        checkDeletedFacturesInUse(deletedRecords);
        
        // Ejemplo: Actualizar estadísticas
        updateStatistics('facturas', remainingCount);
    });
    
    // 🧹 Limpieza de datos
    dataManager.on('facturas:cleared', function(event) {
        const { recordsCleared } = event.detail;
        console.log(`🧹 Todas las facturas eliminadas: ${recordsCleared} registros`);
        
        // Ejemplo: Resetear formulario relacionado
        if (typeof resetFacturasForm === 'function') {
            resetFacturasForm();
        }
    });
    
    // =============================================================================
    // EVENTOS DE ESTADO
    // =============================================================================
    
    // 🔄 Cambio de entidad
    dataManager.on('entity:changed', function(event) {
        const { previousEntity, currentEntity, entityConfig } = event.detail;
        console.log(`🔄 Entidad cambiada: ${previousEntity} → ${currentEntity}`);
        
        // Ejemplo: Actualizar filtros de búsqueda
        updateSearchFilters(currentEntity, entityConfig.fields);
        
        // Ejemplo: Cambiar tema de color según entidad
        updateEntityTheme(currentEntity);
        
        // Ejemplo: Cargar datos relacionados
        preloadRelatedData(currentEntity);
    });
    
    // ⚠️ Validación fallida
    dataManager.on('validation:failed', function(event) {
        const { entityType, duplicateCount, invalidCount, duplicateDetails } = event.detail;
        console.log(`⚠️ Validación fallida en ${entityType}:`, {
            duplicados: duplicateCount,
            inválidos: invalidCount
        });
        
        // Ejemplo: Mostrar detalles de duplicados
        if (duplicateDetails.length > 0) {
            showDuplicateDetails(duplicateDetails);
        }
        
        // Ejemplo: Logging para analytics
        logValidationError(entityType, { duplicateCount, invalidCount });
    });
    
    // =============================================================================
    // EVENTOS GENÉRICOS
    // =============================================================================
    
    // 📊 Cualquier actualización de datos
    dataManager.on('data:updated', function(event) {
        const { entityType, recordCount } = event.detail;
        console.log(`📊 Datos actualizados: ${entityType} (${recordCount} registros)`);
        
        // Ejemplo: Actualizar dashboard en tiempo real
        updateDashboard(entityType, recordCount);
        
        // Ejemplo: Guardar timestamp de última actualización
        localStorage.setItem(`last_update_${entityType}`, Date.now());
    });
    
    // 🚀 Sistema inicializado
    dataManager.on('manager:initialized', function(event) {
        const { entities, currentEntity, version } = event.detail;
        console.log(`🚀 Data Manager ${version} inicializado:`, {
            entidades: entities,
            actual: currentEntity
        });
        
        // Ejemplo: Configurar interfaz según entidades disponibles
        setupDynamicUI(entities);
        
        // Ejemplo: Cargar preferencias de usuario
        loadUserPreferences();
    });
}

// =============================================================================
// FUNCIONES DE EJEMPLO PARA INTEGRACIÓN
// =============================================================================

/**
 * Actualizar contador de registros en la UI
 */
function updateRecordCounter(entityType, count) {
    const counter = document.querySelector(`[data-counter="${entityType}"]`);
    if (counter) {
        counter.textContent = count;
        counter.classList.add('updated');
        setTimeout(() => counter.classList.remove('updated'), 300);
    }
}

/**
 * Mostrar notificación personalizada
 */
function showCustomNotification(message, type = 'info') {
    // Implementación personalizada de notificaciones
    const notification = document.createElement('div');
    notification.className = `custom-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

/**
 * Verificar si facturas eliminadas están siendo usadas
 */
function checkDeletedFacturesInUse(deletedRecords) {
    // Ejemplo: verificar en formulario
    const currentInvoice = document.getElementById('invoice-select')?.value;
    const deletedIds = deletedRecords.map(r => r.external_id);
    
    if (deletedIds.includes(currentInvoice)) {
        alert('⚠️ La factura seleccionada fue eliminada. Selecciona otra factura.');
        // Resetear selección
        document.getElementById('invoice-select').selectedIndex = 0;
    }
}

/**
 * Sincronizar con aplicación externa
 */
function syncWithExternalApp(entityType, data) {
    // Ejemplo: enviar datos a API externa
    fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, data, timestamp: Date.now() })
    }).catch(error => console.warn('Sync failed:', error));
}

/**
 * Actualizar filtros de búsqueda según entidad
 */
function updateSearchFilters(entityType, fields) {
    const searchContainer = document.getElementById('search-filters');
    if (!searchContainer) return;
    
    // Limpiar filtros existentes
    searchContainer.innerHTML = '';
    
    // Crear filtros basados en campos de la entidad
    fields.forEach(field => {
        if (field.type === 'text') {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Buscar por ${field.label}`;
            input.dataset.field = field.key;
            searchContainer.appendChild(input);
        }
    });
}

/**
 * Cambiar tema según entidad activa
 */
function updateEntityTheme(entityType) {
    const themes = {
        facturas: 'theme-blue',
        ordenes: 'theme-green',
        productos: 'theme-orange'
    };
    
    // Remover temas anteriores
    document.body.classList.remove(...Object.values(themes));
    
    // Aplicar nuevo tema
    if (themes[entityType]) {
        document.body.classList.add(themes[entityType]);
    }
}

/**
 * Actualizar dashboard con estadísticas
 */
function updateDashboard(entityType, recordCount) {
    const dashboardCard = document.querySelector(`[data-dashboard="${entityType}"]`);
    if (dashboardCard) {
        const countElement = dashboardCard.querySelector('.count');
        const lastUpdate = dashboardCard.querySelector('.last-update');
        
        if (countElement) countElement.textContent = recordCount;
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleString();
        
        // Animación de actualización
        dashboardCard.classList.add('pulse');
        setTimeout(() => dashboardCard.classList.remove('pulse'), 600);
    }
}

/**
 * Configurar UI dinámica según entidades disponibles
 */
function setupDynamicUI(entities) {
    const sidebar = document.querySelector('.dynamic-sidebar');
    if (!sidebar) return;
    
    entities.forEach(entityType => {
        const button = document.createElement('button');
        button.textContent = entityType.charAt(0).toUpperCase() + entityType.slice(1);
        button.onclick = () => dataManager.switchEntity(entityType);
        sidebar.appendChild(button);
    });
}

/**
 * Mostrar detalles de duplicados encontrados
 */
function showDuplicateDetails(duplicateDetails) {
    const modal = document.createElement('div');
    modal.className = 'duplicate-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Duplicados Encontrados</h3>
            <ul>
                ${duplicateDetails.map(detail => 
                    `<li>${detail.field}: ${detail.value}</li>`
                ).join('')}
            </ul>
            <button onclick="this.closest('.duplicate-details-modal').remove()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Log de errores para analytics
 */
function logValidationError(entityType, errorData) {
    // Ejemplo: enviar a servicio de analytics
    if (typeof analytics !== 'undefined') {
        analytics.track('validation_error', {
            entity_type: entityType,
            ...errorData,
            timestamp: Date.now()
        });
    }
}

// =============================================================================
// EVENTOS AVANZADOS - CASOS DE USO COMPLEJOS
// =============================================================================

/**
 * Sincronización bidireccional con formulario
 */
function setupFormSync() {
    // Escuchar cambios en formulario para actualizar Data Manager
    const invoiceSelect = document.getElementById('invoice-select');
    if (invoiceSelect) {
        invoiceSelect.addEventListener('change', function() {
            // Emitir evento personalizado que Data Manager puede escuchar
            const event = new CustomEvent('form:invoice_changed', {
                detail: { invoiceId: this.value }
            });
            document.dispatchEvent(event);
        });
    }
    
    // Escuchar actualizaciones de facturas para actualizar formulario
    dataManager.on('facturas:updated', function(event) {
        updateInvoiceDropdown(event.detail.data);
    });
}

/**
 * Sistema de cache inteligente
 */
function setupIntelligentCache() {
    const cache = new Map();
    
    // Cachear datos cuando se cargan
    dataManager.on('data:updated', function(event) {
        const { entityType, data } = event.detail;
        cache.set(entityType, {
            data: [...data], // Copia para evitar mutaciones
            timestamp: Date.now()
        });
    });
    
    // Invalidar cache cuando se eliminan datos
    dataManager.on('data:cleared', function(event) {
        cache.delete(event.detail.entityType);
    });
    
    // Función para obtener datos del cache
    window.getCachedData = function(entityType) {
        const cached = cache.get(entityType);
        if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos
            return cached.data;
        }
        return null;
    };
}

/**
 * Monitoreo de performance
 */
function setupPerformanceMonitoring() {
    const performanceData = {
        loadTimes: [],
        validationTimes: [],
        renderTimes: []
    };
    
    dataManager.on('data:loaded', function(event) {
        const loadTime = Date.now() - event.detail.timestamp;
        performanceData.loadTimes.push(loadTime);
        
        // Log si la carga es lenta
        if (loadTime > 1000) {
            console.warn(`🐌 Carga lenta detectada: ${loadTime}ms para ${event.detail.entityType}`);
        }
    });
    
    dataManager.on('validation:failed', function(event) {
        const validationTime = Date.now() - event.detail.timestamp;
        performanceData.validationTimes.push(validationTime);
    });
    
    // Función para obtener estadísticas de performance
    window.getPerformanceStats = function() {
        return {
            avgLoadTime: performanceData.loadTimes.reduce((a, b) => a + b, 0) / performanceData.loadTimes.length || 0,
            avgValidationTime: performanceData.validationTimes.reduce((a, b) => a + b, 0) / performanceData.validationTimes.length || 0,
            totalOperations: performanceData.loadTimes.length + performanceData.validationTimes.length
        };
    };
}

// =============================================================================
// INICIALIZACIÓN DE EJEMPLOS AVANZADOS
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Configurar ejemplos avanzados si están disponibles los elementos necesarios
    if (document.getElementById('invoice-select')) {
        setupFormSync();
    }
    
    setupIntelligentCache();
    setupPerformanceMonitoring();
    
    console.log('✅ Ejemplos de eventos configurados correctamente');
});

// =============================================================================
// EXPORTAR PARA USO EN OTROS MÓDULOS
// =============================================================================

// Si se usa como módulo ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setupEventListeners,
        updateRecordCounter,
        showCustomNotification,
        checkDeletedFacturesInUse,
        syncWithExternalApp,
        setupFormSync,
        setupIntelligentCache,
        setupPerformanceMonitoring
    };
}

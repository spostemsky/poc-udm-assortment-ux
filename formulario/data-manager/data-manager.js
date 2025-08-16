// =============================================================================
// GESTOR DE DATOS JSON - VERSIÓN REFACTORIZADA Y FLEXIBLE
// =============================================================================

class DataManager {
    constructor(config = null) {
        // Cargar configuración
        this.config = config || ENTITY_CONFIG;
        this.settings = this.config.settings;
        this.entityConfig = this.config.entities;
        
        // Propiedades del sistema
        this.storagePrefix = this.settings.storagePrefix;
        this.entities = Object.keys(this.entityConfig);
        this.currentEntity = this.entities[0] || null; // Primera entidad por defecto
        this.currentEditingIndex = -1;
        
        // Validar que existan entidades
        if (this.entities.length === 0) {
            throw new Error('No se han definido entidades en la configuración');
        }
    }

    // =============================================================================
    // INICIALIZACIÓN
    // =============================================================================

    initialize() {
        console.log('🚀 Inicializando Gestor de Datos Flexible...');
        console.log(`📊 Entidades disponibles: ${this.entities.join(', ')}`);
        
        // Generar interfaz dinámica
        this.generateDynamicInterface();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar datos existentes
        this.refreshData();
        
        console.log('✅ Gestor de Datos inicializado correctamente');
    }

    generateDynamicInterface() {
        // Generar tabs de entidades
        this.generateEntityTabs();
        
        // Configurar upload único
        this.setupSingleFileUpload();
        
        // Actualizar título
        this.updateTitle();
    }

    generateEntityTabs() {
        const tabsContainer = document.querySelector('.entity-tabs');
        if (!tabsContainer) return;

        const tabsHtml = this.entities.map((entityKey, index) => {
            const config = this.entityConfig[entityKey];
            const activeClass = index === 0 ? 'active' : '';
            
            return `
                <div class="tab ${activeClass}" data-entity="${entityKey}" onclick="switchEntity('${entityKey}')">
                    ${config.icon} ${config.displayName}
                </div>
            `;
        }).join('');

        tabsContainer.innerHTML = tabsHtml;
    }

    setupSingleFileUpload() {
        const fileInput = document.getElementById('hidden-file-input');
        if (!fileInput) {
            console.error('Input de archivo oculto no encontrado');
            return;
        }

        // Event listener para el input oculto
        fileInput.addEventListener('change', (e) => {
            if (!this.currentEntity) {
                this.showAlert('error', 'No hay entidad seleccionada');
                return;
            }
            
            this.handleFileUpload(this.currentEntity, e.target.files);
        });
    }

    updateTitle() {
        const titleElement = document.getElementById('content-title');
        if (titleElement && this.currentEntity) {
            const config = this.entityConfig[this.currentEntity];
            titleElement.textContent = `📊 ${config.displayName}`;
        }
    }

    setupEventListeners() {
        // Event listener para cerrar modal al hacer clic fuera
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'edit-modal') {
                    this.closeModal();
                }
            });
        }

        // Configurar tooltips personalizados
        this.setupCustomTooltips();
    }

    setupCustomTooltips() {
        // Usar event delegation para tooltips dinámicos
        document.addEventListener('mouseenter', (e) => {
            if (e.target.classList.contains('btn-icon') && e.target.hasAttribute('title')) {
                this.showTooltip(e.target);
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (e.target.classList.contains('btn-icon')) {
                this.hideTooltip(e.target);
            }
        });
    }

    showTooltip(element) {
        // Remover tooltip nativo
        const originalTitle = element.getAttribute('title');
        element.setAttribute('data-title', originalTitle);
        element.removeAttribute('title');

        // Crear tooltip personalizado
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = originalTitle;

        // Agregar al elemento
        element.appendChild(tooltip);

        // Calcular posición inteligente
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Determinar mejor posición
        let position = 'top'; // Por defecto arriba

        // Si no cabe arriba, ponerlo abajo
        if (rect.top - tooltipRect.height < 10) {
            position = 'bottom';
        }

        // Si no cabe centrado horizontalmente, ajustar
        const centerX = rect.left + rect.width / 2;
        const tooltipHalfWidth = tooltipRect.width / 2;

        if (centerX - tooltipHalfWidth < 10) {
            position = 'right';
        } else if (centerX + tooltipHalfWidth > viewportWidth - 10) {
            position = 'left';
        }

        // Aplicar clase de posición
        tooltip.className = `custom-tooltip ${position}`;

        // Mostrar con animación
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 10);
    }

    hideTooltip(element) {
        // Restaurar título original
        const originalTitle = element.getAttribute('data-title');
        if (originalTitle) {
            element.setAttribute('title', originalTitle);
            element.removeAttribute('data-title');
        }

        // Remover tooltip personalizado
        const tooltip = element.querySelector('.custom-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // =============================================================================
    // GESTIÓN DE DATOS EN LOCALSTORAGE
    // =============================================================================

    getData(entityType) {
        if (!this.entityExists(entityType)) {
            console.warn(`Entidad '${entityType}' no existe en la configuración`);
            return [];
        }

        const storageKey = `${this.storagePrefix}${entityType}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveData(entityType, data) {
        if (!this.entityExists(entityType)) {
            console.error(`No se puede guardar datos para entidad inexistente: ${entityType}`);
            return false;
        }

        const storageKey = `${this.storagePrefix}${entityType}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        this.updateLastModified(entityType);
        return true;
    }

    updateLastModified(entityType) {
        const key = `${this.storagePrefix}${entityType}_modified`;
        localStorage.setItem(key, new Date().toISOString());
    }

    getLastModified(entityType) {
        const key = `${this.storagePrefix}${entityType}_modified`;
        return localStorage.getItem(key);
    }

    clearData(entityType) {
        if (!this.entityExists(entityType)) {
            console.warn(`No se puede limpiar datos de entidad inexistente: ${entityType}`);
            return false;
        }

        const storageKey = `${this.storagePrefix}${entityType}`;
        const modifiedKey = `${this.storagePrefix}${entityType}_modified`;
        const filesKey = `${this.storagePrefix}${entityType}_files`;
        
        localStorage.removeItem(storageKey);
        localStorage.removeItem(modifiedKey);
        localStorage.removeItem(filesKey);
        return true;
    }

    // =============================================================================
    // GESTIÓN DE ARCHIVOS
    // =============================================================================

    async handleFileUpload(entityType, files) {
        if (!files || files.length === 0) return;
        if (!this.entityExists(entityType)) {
            this.showAlert('error', `Entidad '${entityType}' no válida`);
            return;
        }

        const loadedFiles = [];
        let totalRecordsAdded = 0;

        try {
            for (const file of files) {
                const result = await this.loadFileFromInput(entityType, file);
                loadedFiles.push(result);
                totalRecordsAdded += result.recordsAdded;
            }

            const config = this.entityConfig[entityType];
            this.showAlert('success', 
                `✅ ${loadedFiles.length} archivo(s) cargado(s) exitosamente!\n` +
                `${totalRecordsAdded} registro(s) agregado(s) a ${config.displayName}`
            );

            this.refreshData();

        } catch (error) {
            this.showAlert('error', `❌ Error: ${error.message}`);
        }

        // Limpiar input oculto
        const fileInput = document.getElementById('hidden-file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    async loadFileFromInput(entityType, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const fileData = JSON.parse(e.target.result);
                    const fileName = file.name;
                    
                    // Convertir a array si es un objeto único
                    let newData = Array.isArray(fileData) ? fileData : [fileData];
                    
                    // Validar datos si está configurado
                    if (this.entityConfig[entityType].config.validateOnSave) {
                        newData = this.validateEntityData(entityType, newData);
                    }
                    
                    // Agregar a los datos existentes
                    const existingData = this.getData(entityType);
                    const updatedData = [...existingData, ...newData];
                    this.saveData(entityType, updatedData);
                    
                    // Actualizar índice de archivos
                    this.addFileToIndex(entityType, fileName, newData.length);
                    
                    resolve({
                        fileName,
                        recordsAdded: newData.length,
                        totalRecords: updatedData.length
                    });
                    
                } catch (error) {
                    reject(new Error(`Error procesando ${file.name}: ${error.message}`));
                }
            };
            
            reader.onerror = () => reject(new Error(`Error leyendo archivo ${file.name}`));
            reader.readAsText(file);
        });
    }

    validateEntityData(entityType, dataArray) {
        const config = this.entityConfig[entityType];
        const requiredFields = config.fields.filter(field => field.required).map(field => field.key);
        
        return dataArray.filter(record => {
            // Verificar campos requeridos
            const hasRequiredFields = requiredFields.every(field => 
                record.hasOwnProperty(field) && record[field] !== null && record[field] !== ""
            );
            
            if (!hasRequiredFields) {
                console.warn(`Registro omitido por campos requeridos faltantes:`, record);
                return false;
            }
            
            return true;
        });
    }

    addFileToIndex(entityType, fileName, recordCount) {
        const filesKey = `${this.storagePrefix}${entityType}_files`;
        const index = JSON.parse(localStorage.getItem(filesKey) || '[]');
        
        const existingIndex = index.findIndex(item => item.name === fileName);
        const fileInfo = {
            name: fileName,
            loaded: new Date().toISOString(),
            recordCount
        };
        
        if (existingIndex >= 0) {
            index[existingIndex] = fileInfo;
        } else {
            index.push(fileInfo);
        }
        
        localStorage.setItem(filesKey, JSON.stringify(index));
    }

    getFileIndex(entityType) {
        const filesKey = `${this.storagePrefix}${entityType}_files`;
        return JSON.parse(localStorage.getItem(filesKey) || '[]');
    }

    // =============================================================================
    // INTERFAZ DE USUARIO
    // =============================================================================

    refreshData() {
        if (this.currentEntity) {
            this.renderDataTable(this.currentEntity);
            this.updateTitle();
        }
    }

    switchEntity(entityType) {
        if (!this.entityExists(entityType)) {
            console.error(`No se puede cambiar a entidad inexistente: ${entityType}`);
            return;
        }

        // Actualizar tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-entity="${entityType}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Cambiar entidad actual
        this.currentEntity = entityType;
        
        // Renderizar datos y actualizar título
        this.renderDataTable(entityType);
        this.updateTitle();
    }

    renderDataTable(entityType) {
        const data = this.getData(entityType);
        const container = document.getElementById('data-content');
        const config = this.entityConfig[entityType];
        
        if (!container) {
            console.error('Contenedor de datos no encontrado');
            return;
        }

        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${config.icon}</div>
                    <h3>No hay ${config.displayName.toLowerCase()} cargadas</h3>
                    <p>Carga archivos JSON de ${config.displayName.toLowerCase()} para comenzar</p>
                </div>
            `;
            return;
        }

        // Generar tabla dinámica
        const tableHtml = this.generateDynamicTable(data, entityType);
        container.innerHTML = tableHtml;
    }

    generateDynamicTable(data, entityType) {
        const config = this.entityConfig[entityType];
        
        // Generar headers
        const headers = config.fields.map(field => `<th>${field.label}</th>`).join('');
        
        // Generar filas
        const rows = data.map((record, index) => {
            const cells = config.fields.map(field => {
                let cellValue = this.formatCellValue(record[field.key], field);
                return `<td>${cellValue}</td>`;
            }).join('');
            
            const actions = `
                <td>
                    <div class="record-actions">
                        <button class="btn-icon btn-download" onclick="dataManager.downloadRecord(${index})" title="Descargar JSON de este registro">
                            📥
                        </button>
                        <button class="btn-icon btn-edit" onclick="dataManager.editRecord(${index})" title="Editar registro">
                            ✏️
                        </button>
                        <button class="btn-icon btn-delete" onclick="dataManager.deleteRecord(${index})" title="Eliminar registro">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            
            return `<tr>${cells}${actions}</tr>`;
        }).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr>${headers}<th>Acciones</th></tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    formatCellValue(value, field) {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        switch (field.type) {
            case 'array':
                if (field.display === 'count') {
                    return Array.isArray(value) ? value.length : 0;
                }
                return Array.isArray(value) ? value.join(', ') : value;
            
            case 'currency':
                return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
            
            case 'date':
                return value ? new Date(value).toLocaleDateString() : 'N/A';
            
            case 'boolean':
                return value ? '✅' : '❌';
            
            default:
                return value;
        }
    }

    // =============================================================================
    // EDICIÓN DE REGISTROS
    // =============================================================================

    editRecord(index) {
        const data = this.getData(this.currentEntity);
        if (index < 0 || index >= data.length) {
            this.showAlert('error', 'Registro no encontrado');
            return;
        }

        this.currentEditingIndex = index;
        const record = data[index];
        const config = this.entityConfig[this.currentEntity];
        
        // Mostrar modal
        const modalTitle = document.getElementById('modal-title');
        const recordJson = document.getElementById('record-json');
        const modal = document.getElementById('edit-modal');
        
        if (modalTitle) {
            modalTitle.textContent = `✏️ Editar ${config.displayNameSingular} #${index + 1}`;
        }
        
        if (recordJson) {
            recordJson.value = JSON.stringify(record, null, 2);
        }
        
        if (modal) {
            modal.style.display = 'block';
        }
    }

    addNewRecord() {
        if (!this.currentEntity) {
            this.showAlert('error', 'No hay entidad seleccionada');
            return;
        }

        this.currentEditingIndex = -1;
        const config = this.entityConfig[this.currentEntity];
        const template = { ...config.template };
        
        // Auto-generar ID si está configurado
        if (config.config.autoGenerateId) {
            const data = this.getData(this.currentEntity);
            template.id = `${this.currentEntity}_${Date.now()}_${data.length + 1}`;
        }
        
        const modalTitle = document.getElementById('modal-title');
        const recordJson = document.getElementById('record-json');
        const modal = document.getElementById('edit-modal');
        
        if (modalTitle) {
            modalTitle.textContent = `➕ Nuevo ${config.displayNameSingular}`;
        }
        
        if (recordJson) {
            recordJson.value = JSON.stringify(template, null, 2);
        }
        
        if (modal) {
            modal.style.display = 'block';
        }
    }

    saveRecord() {
        try {
            const recordJson = document.getElementById('record-json');
            if (!recordJson) {
                throw new Error('Editor JSON no encontrado');
            }

            const jsonText = recordJson.value;
            const recordData = JSON.parse(jsonText);
            const config = this.entityConfig[this.currentEntity];
            
            // Validar campos requeridos
            if (config.config.validateOnSave) {
                const validationResult = this.validateSingleRecord(this.currentEntity, recordData);
                if (!validationResult.isValid) {
                    throw new Error(`Validación fallida: ${validationResult.errors.join(', ')}`);
                }
            }
            
            const data = this.getData(this.currentEntity);
            
            if (this.currentEditingIndex >= 0) {
                // Editar registro existente
                data[this.currentEditingIndex] = recordData;
                this.showAlert('success', `✅ ${config.displayNameSingular} actualizado exitosamente`);
            } else {
                // Agregar nuevo registro
                data.push(recordData);
                this.showAlert('success', `✅ ${config.displayNameSingular} agregado exitosamente`);
            }
            
            this.saveData(this.currentEntity, data);
            this.closeModal();
            this.renderDataTable(this.currentEntity);
            
        } catch (error) {
            this.showAlert('error', `❌ Error: ${error.message}`);
        }
    }

    validateSingleRecord(entityType, record) {
        const config = this.entityConfig[entityType];
        const errors = [];
        
        // Verificar campos requeridos
        config.fields.forEach(field => {
            if (field.required) {
                if (!record.hasOwnProperty(field.key) || record[field.key] === null || record[field.key] === "") {
                    errors.push(`Campo requerido faltante: ${field.label}`);
                }
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    deleteRecord(index) {
        const config = this.entityConfig[this.currentEntity];
        const confirmMessage = config.config.confirmDelete 
            ? `¿Estás seguro de que quieres eliminar este ${config.displayNameSingular.toLowerCase()}?`
            : null;
            
        if (confirmMessage && !confirm(confirmMessage)) {
            return;
        }
        
        const data = this.getData(this.currentEntity);
        if (index < 0 || index >= data.length) {
            this.showAlert('error', 'Registro no encontrado');
            return;
        }
        
        data.splice(index, 1);
        this.saveData(this.currentEntity, data);
        this.renderDataTable(this.currentEntity);
        this.showAlert('success', `✅ ${config.displayNameSingular} eliminado exitosamente`);
    }

    closeModal() {
        const modal = document.getElementById('edit-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.currentEditingIndex = -1;
    }

    openFileUpload() {
        if (!this.currentEntity) {
            this.showAlert('error', 'No hay entidad seleccionada');
            return;
        }

        const fileInput = document.getElementById('hidden-file-input');
        if (fileInput) {
            fileInput.click();
        } else {
            this.showAlert('error', 'Input de archivo no encontrado');
        }
    }

    downloadRecord(index) {
        if (!this.currentEntity) {
            this.showAlert('error', 'No hay entidad seleccionada');
            return;
        }

        const data = this.getData(this.currentEntity);
        if (index < 0 || index >= data.length) {
            this.showAlert('error', 'Registro no encontrado');
            return;
        }

        const record = data[index];
        const config = this.entityConfig[this.currentEntity];
        
        // Generar nombre de archivo único
        const timestamp = new Date().toISOString().split('T')[0];
        const recordId = this.getRecordIdentifier(record, config);
        const fileName = `${this.currentEntity}_${recordId}_${timestamp}.json`;
        
        // Crear y descargar archivo
        const blob = new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert('success', `📥 Registro descargado como ${fileName}`);
    }

    getRecordIdentifier(record, config) {
        // Buscar un campo identificador único en orden de preferencia
        const identifierFields = ['id', 'external_id', 'uuid', 'codigo', 'email'];
        
        for (const field of identifierFields) {
            if (record[field] && record[field] !== null && record[field] !== '') {
                // Limpiar caracteres especiales para nombre de archivo
                return String(record[field]).replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 20);
            }
        }
        
        // Si no hay identificador, usar el primer campo requerido
        const firstRequiredField = config.fields.find(f => f.required);
        if (firstRequiredField && record[firstRequiredField.key]) {
            return String(record[firstRequiredField.key]).replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 20);
        }
        
        // Fallback: usar índice
        return `registro_${Date.now()}`;
    }

    // =============================================================================
    // UTILIDADES
    // =============================================================================

    entityExists(entityType) {
        return entityType in this.entityConfig;
    }

    showAlert(type, message) {
        const container = document.getElementById('alerts-container');
        if (!container) return;

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        container.appendChild(alertDiv);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    exportData(entityType) {
        if (!this.entityExists(entityType)) {
            this.showAlert('error', `Entidad '${entityType}' no válida`);
            return;
        }

        const data = this.getData(entityType);
        const config = this.entityConfig[entityType];
        const fileName = `${entityType}-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showAlert('success', `📥 ${config.displayName} exportadas como ${fileName}`);
    }

    exportAllData() {
        this.entities.forEach(entity => {
            this.exportData(entity);
        });
    }

    clearAllData() {
        const entityNames = this.entities.map(key => this.entityConfig[key].displayName).join(', ');
        
        if (!confirm(`⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos de: ${entityNames}?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        this.entities.forEach(entity => {
            this.clearData(entity);
        });
        
        this.refreshData();
        this.showAlert('success', '✅ Todos los datos han sido eliminados');
    }

    // =============================================================================
    // INFORMACIÓN DEL SISTEMA
    // =============================================================================

    getSystemInfo() {
        const info = {
            version: '2.0.0',
            entities: this.entities,
            currentEntity: this.currentEntity,
            settings: this.settings,
            dataStats: {}
        };

        // Agregar estadísticas de datos
        this.entities.forEach(entity => {
            const data = this.getData(entity);
            const files = this.getFileIndex(entity);
            const lastModified = this.getLastModified(entity);
            
            info.dataStats[entity] = {
                recordCount: data.length,
                filesLoaded: files.length,
                lastModified: lastModified
            };
        });

        return info;
    }

    printSystemInfo() {
        const info = this.getSystemInfo();
        console.log('📊 Información del Sistema Data Manager:', info);
        return info;
    }
}

// =============================================================================
// FUNCIONES GLOBALES
// =============================================================================

// Instancia global del gestor
let dataManager = null;

// Funciones globales para uso en HTML
function refreshData() {
    if (dataManager) dataManager.refreshData();
}

function exportAllData() {
    if (dataManager) dataManager.exportAllData();
}

function clearAllData() {
    if (dataManager) dataManager.clearAllData();
}

function switchEntity(entityType) {
    if (dataManager) dataManager.switchEntity(entityType);
}

function addNewRecord() {
    if (dataManager) dataManager.addNewRecord();
}

function closeModal() {
    if (dataManager) dataManager.closeModal();
}

function saveRecord() {
    if (dataManager) dataManager.saveRecord();
}

function openFileUpload() {
    if (dataManager) dataManager.openFileUpload();
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        // Crear instancia del gestor con configuración
        dataManager = new DataManager();
        dataManager.initialize();
        
        // Información del sistema para debug
        dataManager.printSystemInfo();
        
    } catch (error) {
        console.error('❌ Error inicializando Data Manager:', error);
        
        // Mostrar error en la interfaz si es posible
        const container = document.getElementById('data-content');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3>Error de Inicialización</h3>
                    <p>${error.message}</p>
                    <p>Revisa la configuración en entity-config.js</p>
                </div>
            `;
        }
    }
});
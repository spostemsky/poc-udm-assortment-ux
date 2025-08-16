// =============================================================================
// GESTOR DE DATOS JSON - PRUEBA DE CONCEPTO
// =============================================================================

class DataManager {
    constructor() {
        this.storagePrefix = 'poc_data_';
        this.entities = ['facturas', 'ordenes'];
        this.currentEntity = 'facturas';
        this.currentEditingIndex = -1;
    }

    // =============================================================================
    // INICIALIZACIÓN
    // =============================================================================

    initialize() {
        console.log('🚀 Inicializando Gestor de Datos...');
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar datos existentes
        this.refreshData();
        
        console.log('✅ Gestor de Datos inicializado');
    }

    setupEventListeners() {
        // Event listeners para carga de archivos
        document.getElementById('facturas-file').addEventListener('change', (e) => {
            this.handleFileUpload('facturas', e.target.files);
        });

        document.getElementById('ordenes-file').addEventListener('change', (e) => {
            this.handleFileUpload('ordenes', e.target.files);
        });

        // Event listener para cerrar modal al hacer clic fuera
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
        });
    }

    // =============================================================================
    // GESTIÓN DE DATOS EN LOCALSTORAGE
    // =============================================================================

    getData(entityType) {
        const storageKey = `${this.storagePrefix}${entityType}`;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : [];
    }

    saveData(entityType, data) {
        const storageKey = `${this.storagePrefix}${entityType}`;
        localStorage.setItem(storageKey, JSON.stringify(data));
        this.updateLastModified(entityType);
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
        const storageKey = `${this.storagePrefix}${entityType}`;
        const modifiedKey = `${this.storagePrefix}${entityType}_modified`;
        const filesKey = `${this.storagePrefix}${entityType}_files`;
        
        localStorage.removeItem(storageKey);
        localStorage.removeItem(modifiedKey);
        localStorage.removeItem(filesKey);
    }

    // =============================================================================
    // GESTIÓN DE ARCHIVOS
    // =============================================================================

    async handleFileUpload(entityType, files) {
        if (!files || files.length === 0) return;

        const loadedFiles = [];
        let totalRecordsAdded = 0;

        try {
            for (const file of files) {
                const result = await this.loadFileFromInput(entityType, file);
                loadedFiles.push(result);
                totalRecordsAdded += result.recordsAdded;
            }

            // Mostrar mensaje de éxito
            this.showAlert('success', 
                `✅ ${loadedFiles.length} archivo(s) cargado(s) exitosamente!\n` +
                `${totalRecordsAdded} registro(s) agregado(s) a ${entityType}`
            );

            // Actualizar vista
            this.refreshData();

        } catch (error) {
            this.showAlert('error', `❌ Error: ${error.message}`);
        }

        // Limpiar input
        document.getElementById(`${entityType}-file`).value = '';
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

    addFileToIndex(entityType, fileName, recordCount) {
        const filesKey = `${this.storagePrefix}${entityType}_files`;
        const index = JSON.parse(localStorage.getItem(filesKey) || '[]');
        
        // Evitar duplicados por nombre
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
        this.renderDataTable(this.currentEntity);
    }

    switchEntity(entityType) {
        // Actualizar tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-entity="${entityType}"]`).classList.add('active');
        
        // Cambiar entidad actual
        this.currentEntity = entityType;
        
        // Renderizar datos
        this.renderDataTable(entityType);
    }

    renderDataTable(entityType) {
        const data = this.getData(entityType);
        const container = document.getElementById('data-content');
        
        if (data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <h3>No hay ${entityType} cargadas</h3>
                    <p>Carga archivos JSON de ${entityType} para comenzar</p>
                </div>
            `;
            return;
        }

        // Generar tabla basada en el tipo de entidad
        let tableHtml = '';
        
        if (entityType === 'facturas') {
            tableHtml = this.renderFacturasTable(data);
        } else if (entityType === 'ordenes') {
            tableHtml = this.renderOrdenesTable(data);
        }
        
        container.innerHTML = tableHtml;
    }

    renderFacturasTable(data) {
        const rows = data.map((factura, index) => `
            <tr>
                <td>${factura.external_id || 'N/A'}</td>
                <td>${factura.sap_order_id || 'N/A'}</td>
                <td>${factura.vendor_name || 'N/A'}</td>
                <td>${factura.site_id || 'N/A'}</td>
                <td>${factura.details ? factura.details.length : 0}</td>
                <td>
                    <div class="record-actions">
                        <button class="btn btn-primary btn-sm" onclick="dataManager.editRecord(${index})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="dataManager.deleteRecord(${index})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>EXTERNAL ID</th>
                        <th>Nro Orden</th>
                        <th>Proveedor</th>
                        <th>Sitio</th>
                        <th>Detalles</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    renderOrdenesTable(data) {
        const rows = data.map((orden, index) => `
            <tr>
                <td>${orden.id || 'N/A'}</td>
                <td>${orden.sapOrderId || 'N/A'}</td>
                <td>${orden.siteId || 'N/A'}</td>
                <td>${orden.details ? orden.details.length : 0}</td>
                <td>
                    <div class="record-actions">
                        <button class="btn btn-primary btn-sm" onclick="dataManager.editRecord(${index})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="dataManager.deleteRecord(${index})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>SAP Order ID</th>
                        <th>Sitio</th>
                        <th>Detalles</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
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
        
        // Mostrar modal
        document.getElementById('modal-title').textContent = 
            `✏️ Editar ${this.currentEntity.slice(0, -1)} #${index + 1}`;
        document.getElementById('record-json').value = JSON.stringify(record, null, 2);
        document.getElementById('edit-modal').style.display = 'block';
    }

    addNewRecord() {
        this.currentEditingIndex = -1;
        
        // Plantilla básica según el tipo de entidad
        let template = {};
        if (this.currentEntity === 'facturas') {
            template = {
                external_id: "",
                sap_order_id: null,
                inner_id: null,
                id: "",
                order_id: "",
                vendor_name: "",
                site_id: "",
                details: []
            };
        } else if (this.currentEntity === 'ordenes') {
            template = {
                id: "",
                uuid: "",
                sapOrderId: null,
                siteId: "",
                details: []
            };
        }
        
        document.getElementById('modal-title').textContent = 
            `➕ Nuevo ${this.currentEntity.slice(0, -1)}`;
        document.getElementById('record-json').value = JSON.stringify(template, null, 2);
        document.getElementById('edit-modal').style.display = 'block';
    }

    saveRecord() {
        try {
            const jsonText = document.getElementById('record-json').value;
            const recordData = JSON.parse(jsonText);
            
            const data = this.getData(this.currentEntity);
            
            if (this.currentEditingIndex >= 0) {
                // Editar registro existente
                data[this.currentEditingIndex] = recordData;
                this.showAlert('success', '✅ Registro actualizado exitosamente');
            } else {
                // Agregar nuevo registro
                data.push(recordData);
                this.showAlert('success', '✅ Registro agregado exitosamente');
            }
            
            this.saveData(this.currentEntity, data);
            this.closeModal();
            this.renderDataTable(this.currentEntity);
            
        } catch (error) {
            this.showAlert('error', `❌ Error en JSON: ${error.message}`);
        }
    }

    deleteRecord(index) {
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) {
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
        this.showAlert('success', '✅ Registro eliminado exitosamente');
    }

    closeModal() {
        document.getElementById('edit-modal').style.display = 'none';
        this.currentEditingIndex = -1;
    }

    // =============================================================================
    // UTILIDADES
    // =============================================================================

    showAlert(type, message) {
        const container = document.getElementById('alerts-container');
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
        const data = this.getData(entityType);
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
        
        this.showAlert('success', `📥 ${entityType} exportadas como ${fileName}`);
    }

    exportAllData() {
        this.entities.forEach(entity => {
            this.exportData(entity);
        });
    }

    clearAllData() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
            return;
        }
        
        this.entities.forEach(entity => {
            this.clearData(entity);
        });
        
        this.refreshData();
        this.showAlert('success', '✅ Todos los datos han sido eliminados');
    }
}

// =============================================================================
// FUNCIONES GLOBALES
// =============================================================================

// Instancia global del gestor
const dataManager = new DataManager();

// Funciones globales para uso en HTML
function refreshData() {
    dataManager.refreshData();
}

function exportAllData() {
    dataManager.exportAllData();
}

function clearAllData() {
    dataManager.clearAllData();
}

function switchEntity(entityType) {
    dataManager.switchEntity(entityType);
}

function addNewRecord() {
    dataManager.addNewRecord();
}

function closeModal() {
    dataManager.closeModal();
}

function saveRecord() {
    dataManager.saveRecord();
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    dataManager.initialize();
});

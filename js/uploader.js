class ToastManager {
    constructor() {
        this.toasts = new Set();
    }

    show(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast-modern animate-slide-in-right`;
        toast.setAttribute('role', 'alert');

        const icon = type === 'success'
            ? '<svg class="w-5 h-5 text-success-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>'
            : '<svg class="w-5 h-5 text-error-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';

        const bgColor = type === 'success' ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200';
        const textColor = type === 'success' ? 'text-success-800' : 'text-error-800';

        toast.innerHTML = `
            <div class="p-4 ${bgColor} border rounded-xl shadow-card">
                <div class="flex items-center gap-3">
                    <span class="flex-shrink-0">${icon}</span>
                    <span class="text-sm font-medium ${textColor}">${message}</span>
                </div>
            </div>
        `;

        document.body.appendChild(toast);
        this.toasts.add(toast);
        toast.offsetHeight;
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) document.body.removeChild(toast);
                this.toasts.delete(toast);
            }, 300);
        }, duration);
    }
}

// App-wide configuration
const UPLOADER_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    STORAGE_KEY: 'uploadedImagesData'
};

// Utility: Validate a file for type and size
function isValidImageFile(file, config = UPLOADER_CONFIG) {
    if (!config.ALLOWED_TYPES.includes(file.type)) {
        return { valid: false, error: `Invalid file type: ${file.name}` };
    }
    if (file.size > config.MAX_FILE_SIZE) {
        return { valid: false, error: `File too large: ${file.name}` };
    }
    if (file.size === 0) {
        return { valid: false, error: `File is empty: ${file.name}` };
    }
    return { valid: true };
}

// IndexedDB Utility for Image Storage
const DB_NAME = 'ImageUploaderDB';
const DB_VERSION = 1;
const GROUPS_STORE = 'imageGroups';

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(GROUPS_STORE)) {
                db.createObjectStore(GROUPS_STORE, { keyPath: 'timestamp' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function addImageGroupToDB(group) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GROUPS_STORE, 'readwrite');
        const store = tx.objectStore(GROUPS_STORE);
        store.add(group);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function getAllImageGroupsFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GROUPS_STORE, 'readonly');
        const store = tx.objectStore(GROUPS_STORE);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

class DragDropUploader {
    /**
     * Initialize the uploader with DOM elements and config.
     */
    constructor(options) {
        Object.assign(this, options);
        this.maxFileSize = UPLOADER_CONFIG.MAX_FILE_SIZE;
        this.allowedTypes = UPLOADER_CONFIG.ALLOWED_TYPES;
        this.storageKey = UPLOADER_CONFIG.STORAGE_KEY;
        this.toastManager = new ToastManager();
        this.selectedFiles = [];
        this.isUploading = false;
        this.uploadInterval = null;
        this.startTime = null;
        this.lastLoaded = 0;
        this.dragCounter = 0;
        this.init();
    }

    // Initialize event listeners and UI
    init() {
        this.setupEventListeners();
        // No longer loads previous uploads here
        this.updateMaxFileSizeDisplay();
    }

    // Update the max file size display in the UI
    updateMaxFileSizeDisplay() {
        this.maxFileSizeDisplay.textContent = this.formatFileSize(this.maxFileSize);
    }

    // Format file size for display
    formatFileSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Set up all event listeners for drag/drop, file input, and buttons.
     */
    setupEventListeners() {
        this.dropZone.addEventListener('dragenter', e => this.handleDragEnter(e));
        this.dropZone.addEventListener('dragover', e => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', e => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', e => this.handleDrop(e));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', e => this.handleFileSelect(e));
        this.uploadButton.addEventListener('click', () => this.simulateUpload());
        this.cancelButton.addEventListener('click', () => this.cancelUpload());
    }

    /**
     * Handle dragenter event, increment drag counter and show active state.
     */
    handleDragEnter(e) {
        e.preventDefault();
        this.dragCounter++;
        this.dropZone.classList.add('drag-active');
    }
    /**
     * Handle dragover event, prevent default to allow drop.
     */
    handleDragOver(e) {
        e.preventDefault();
    }
    /**
     * Handle dragleave event, decrement drag counter and hide active state if needed.
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.dragCounter--;
        if (this.dragCounter <= 0) {
            this.dragCounter = 0;
            this.dropZone.classList.remove('drag-active');
        }
    }

    /**
     * Handle file drop event, process dropped files.
     */
    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('drag-active');
        this.dragCounter = 0;
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }
    /**
     * Handle file input change event, process selected files.
     */
    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    /**
     * Validate and process selected files, show errors if invalid.
     */
    processFiles(files) {
        const validFiles = files.filter(file => {
            const result = isValidImageFile(file, UPLOADER_CONFIG);
            if (!result.valid) this.showError(result.error);
            return result.valid;
        });
        if (validFiles.length === 0) return;
        // Assign unique IDs and store as {id, file}
        this.selectedFiles = validFiles.map(file => ({
            id: `${file.name}_${file.size}_${file.lastModified || Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            file
        }));
        this.hideError();
        this.displayFileInfo();
        this.previewFiles();
    }

    /**
     * (Deprecated) Validate a single file. Use isValidImageFile instead.
     */
    validateFile(file) {
        return isValidImageFile(file, UPLOADER_CONFIG).valid;
    }

    /**
     * Show file count and total size in the UI.
     */
    displayFileInfo() {
        const totalSize = this.selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
        this.fileCount.textContent = `${this.selectedFiles.length} file${this.selectedFiles.length > 1 ? 's' : ''}`;
        this.totalSize.textContent = this.formatFileSize(totalSize);
        this.previewSection.classList.remove('hidden');
    }

    /**
     * Render image previews for selected files.
     * Optimized: batch DOM updates, use stable file references.
     */
    previewFiles() {
        this.imagePreview.innerHTML = '';
        this.previewSection.classList.remove('hidden');
        if (this.selectedFiles.length === 0) {
            this.previewSection.classList.add('hidden');
            return;
        }
        const previewElements = [];
        let loadedCount = 0;
        this.selectedFiles.forEach(({id, file}, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'preview-container drop-success';
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-button';
                removeBtn.innerHTML = `🗑️`;
                removeBtn.setAttribute('aria-label', `Remove image ${file.name}`);
                removeBtn.addEventListener('click', () => {
                    this.removeFileById(id);
                });
                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewElements[idx] = wrapper;
                loadedCount++;
                if (loadedCount === this.selectedFiles.length) {
                    this.imagePreview.innerHTML = '';
                    previewElements.forEach(el => {
                        if (el) this.imagePreview.appendChild(el);
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Remove a file by its unique ID and update preview.
     */
    removeFileById(id) {
        this.selectedFiles = this.selectedFiles.filter(f => f.id !== id);
        this.previewFiles();
        if (this.selectedFiles.length === 0) this.previewSection.classList.add('hidden');
    }

    /**
     * Simulate an upload with a progress bar and stats.
     */
    simulateUpload() {
        if (this.selectedFiles.length === 0) return;
        this.isUploading = true;
        this.uploadButton.disabled = true;
        this.uploadButton.textContent = 'Uploading...';
        this.cancelButton.classList.remove('hidden');
        this.startTime = Date.now();
        this.lastLoaded = 0;
        const totalSize = this.selectedFiles.reduce((sum, f) => sum + f.file.size, 0);
        let uploadedSize = 0;
        let progress = 0;

        this.uploadInterval = setInterval(() => {
            if (!this.isUploading) {
                clearInterval(this.uploadInterval);
                return;
            }

            progress += Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(this.uploadInterval);
                this.uploadComplete();
            }

            uploadedSize = (progress / 100) * totalSize;
            const percent = Math.round((uploadedSize / totalSize) * 100);
            this.progressBar.style.width = `${percent}%`;
            this.progressBar.setAttribute('aria-valuenow', percent);
            const speed = uploadedSize / ((Date.now() - this.startTime) / 1000);
            const remaining = (totalSize - uploadedSize) / speed;
            this.uploadSpeed.textContent = `${(speed / 1024).toFixed(1)} KB/s`;
            this.timeRemaining.textContent = `${Math.ceil(remaining)}s remaining`;
            const pp = document.getElementById('progressPercentage');
            if (pp) pp.textContent = `${percent}%`;
        }, 200);
    }

    /**
     * Complete the upload, save to localStorage as a new group, and dispatch event.
     *
     * Note: For very large galleries, consider lazy loading images in the side panel for performance.
     */
    async uploadComplete() {
        this.isUploading = false;
        clearInterval(this.uploadInterval);
        let errorOccurred = false;
        try {
            // Dispatch event with File objects and previews
            const uploadSuccessEvent = new CustomEvent('uploadSuccess', {
                detail: {
                    files: this.selectedFiles.map(f => f.file), // Original File objects
                    previews: await this.generatePreviews(this.selectedFiles)
                }
            });
            this.dropZone.dispatchEvent(uploadSuccessEvent);

            // Convert to base64 and save as a new group in IndexedDB
            const filesToSave = await Promise.all(this.selectedFiles.map(async ({id, file}) => ({
                id,
                name: file.name,
                type: file.type,
                data: await this.fileToBase64(file)
            })));
            const group = {
                timestamp: Date.now(),
                images: filesToSave
            };
            try {
                await addImageGroupToDB(group);
            } catch (e) {
                this.toastManager.show('Failed to save images to device storage.', 'error');
                errorOccurred = true;
            }

            if (!errorOccurred) {
                this.toastManager.show(`${filesToSave.length} image${filesToSave.length > 1 ? 's' : ''} uploaded successfully!`, 'success');
            }
            this.progressBar.style.width = '100%';
            this.progressBar.setAttribute('aria-valuenow', 100);
            this.uploadButton.disabled = false;
            this.uploadButton.textContent = 'Upload Images';
            this.cancelButton.classList.add('hidden');
            const pp = document.getElementById('progressPercentage');
            if (pp) pp.textContent = `100%`;
        } catch (e) {
            this.toastManager.show('An error occurred during upload.', 'error');
        } finally {
            // Always clear preview and reset UI after 2 seconds
            setTimeout(() => this.clearPreview(), 2000);
            this.isUploading = false;
            clearInterval(this.uploadInterval);
            this.uploadButton.disabled = false;
            this.uploadButton.textContent = 'Upload Images';
            this.cancelButton.classList.add('hidden');
            this.progressBar.style.width = '0%';
            this.progressBar.setAttribute('aria-valuenow', 0);
            const pp = document.getElementById('progressPercentage');
            if (pp) pp.textContent = `0%`;
        }
    }

    /**
     * Generate base64 previews for files.
     */
    async generatePreviews(selectedFiles) {
        return Promise.all(selectedFiles.map(({id, file}) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve({
                    id,
                    url: e.target.result,
                    name: file.name,
                    type: file.type
                });
                reader.readAsDataURL(file);
            });
        }));
    }

    /**
     * Cancel the current upload and reset UI.
     */
    cancelUpload() {
        if (!this.isUploading) return;
        clearInterval(this.uploadInterval);
        this.isUploading = false;
        this.progressBar.style.width = '0%';
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Upload Images';
        this.cancelButton.classList.add('hidden');
        this.toastManager.show('Upload cancelled', 'error');
        const pp = document.getElementById('progressPercentage');
        if (pp) pp.textContent = `0%`;
    }

    /**
     * Convert a File to a base64 data URL.
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    /**
     * Clear the preview area and reset UI state.
     */
    clearPreview() {
        this.fileInput.value = '';
        this.selectedFiles = [];
        this.imagePreview.innerHTML = '';
        this.previewSection.classList.add('hidden');
        this.fileCount.textContent = '0 files';
        this.totalSize.textContent = '-';
        this.uploadSpeed.textContent = '-';
        this.timeRemaining.textContent = '-';
        this.progressBar.style.width = '0%';
        this.progressBar.setAttribute('aria-valuenow', 0);
        const pp = document.getElementById('progressPercentage');
        if (pp) pp.textContent = `0%`;
    }

    /**
     * Show an error message using the toast manager.
     */
    showError(message) {
        if (this.toastManager) {
            this.toastManager.show(message, 'error');
        }
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Upload Images';
    }

    /**
     * Hide the error message area.
     */
    hideError() {
        this.errorMessage?.classList?.add('hidden');
    }

    loadFromLocalStorage() {
        // No longer needed in uploader; previews are handled by side panel
    }

    /**
     * Clean up any intervals or resources on unload.
     */
    cleanup() {
        if (this.uploadInterval) clearInterval(this.uploadInterval);
    }
}
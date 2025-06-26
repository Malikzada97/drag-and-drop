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
                    <span class="flex-shrink-0">
                        ${icon}
                    </span>
                    <span class="text-sm font-medium ${textColor}">${message}</span>
                </div>
            </div>
        `;

        document.body.appendChild(toast);
        this.toasts.add(toast);

        // Trigger reflow to ensure animation plays
        toast.offsetHeight;

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
                this.toasts.delete(toast);
            }, 300);
        }, duration);
    }
}

class DragDropUploader {
    constructor(options) {
        this.dropZone = options.dropZone;
        this.fileInput = options.fileInput;
        this.previewSection = options.previewSection;
        this.imagePreview = options.imagePreview;
        this.progressBar = options.progressBar;
        this.fileCount = options.fileCount;
        this.totalSize = options.totalSize;
        this.uploadButton = options.uploadButton;
        this.cancelButton = options.cancelButton;
        this.clearButton = options.clearButton;
        this.uploadSpeed = options.uploadSpeed;
        this.timeRemaining = options.timeRemaining;
        this.errorMessage = options.errorMessage;
        this.maxFileSizeDisplay = options.maxFileSizeDisplay;
        this.maxFileSize = options.maxFileSize || 5 * 1024 * 1024; // 5MB default
        this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'];
        this.storageKey = options.storageKey || 'lastUploadedImages';
        this.boundEventHandlers = new Map();
        this.uploadInterval = null;
        this.isUploading = false;
        this.startTime = null;
        this.lastLoaded = 0;
        this.files = [];
        this.toastManager = new ToastManager();
        
        // Add drag feedback
        this.dragCounter = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromLocalStorage();
        this.updateMaxFileSizeDisplay();
    }

    updateMaxFileSizeDisplay() {
        this.maxFileSizeDisplay.textContent = this.formatFileSize(this.maxFileSize);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupEventListeners() {
        const handlers = {
            dragover: (e) => this.handleDragOver(e),
            dragleave: () => this.handleDragLeave(),
            drop: (e) => this.handleDrop(e),
            click: () => this.fileInput.click(),
            change: (e) => this.handleFileSelect(e),
            upload: () => this.simulateUpload(),
            keydown: (e) => this.handleKeyDown(e),
            cancel: () => this.cancelUpload()
        };

        this.dropZone.addEventListener('dragover', handlers.dragover);
        this.dropZone.addEventListener('dragleave', handlers.dragleave);
        this.dropZone.addEventListener('drop', handlers.drop);
        this.dropZone.addEventListener('click', handlers.click);
        this.fileInput.addEventListener('change', handlers.change);
        this.uploadButton.addEventListener('click', handlers.upload);
        this.dropZone.addEventListener('keydown', handlers.keydown);
        this.cancelButton.addEventListener('click', handlers.cancel);

        // Add keyboard event listeners for buttons
        this.uploadButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.simulateUpload();
            }
        });

        this.cancelButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.cancelUpload();
            }
        });

        this.boundEventHandlers.set(this.dropZone, handlers);
    }

    handleKeyDown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.fileInput.click();
        }
    }

    handleFileSelect(e) {
        const selectedFiles = Array.from(e.target.files);
        
        if (selectedFiles.length === 0) {
            this.showError('No files selected');
            return;
        }

        // Validate each file
        const validFiles = selectedFiles.filter(file => {
            if (!this.allowedTypes.includes(file.type)) {
                this.showError(`Invalid file type for ${file.name}. Allowed types: ${this.allowedTypes.join(', ')}`);
                return false;
            }

            if (file.size > this.maxFileSize) {
                this.showError(`File ${file.name} is too large. Maximum size: ${this.formatFileSize(this.maxFileSize)}`);
                return false;
            }

            if (file.size === 0) {
                this.showError(`File ${file.name} is empty`);
                return false;
            }

            return true;
        });

        if (validFiles.length === 0) return;

        this.files = validFiles;
        this.hideError();
        this.displayFileInfo();
        this.previewFiles();
        
        // Focus and scroll to upload button after successful file selection
        this.focusAndScrollToUploadButton();
    }

    displayFileInfo() {
        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        this.fileCount.textContent = `${this.files.length} file${this.files.length > 1 ? 's' : ''}`;
        this.totalSize.textContent = this.formatFileSize(totalSize);
        this.previewSection.classList.remove('hidden');
        
        // Add success animation to the preview section
        this.previewSection.classList.add('animate-bounce-in');
        setTimeout(() => {
            this.previewSection.classList.remove('animate-bounce-in');
        }, 600);
    }

    previewFiles() {
        this.imagePreview.innerHTML = '';
        
        this.files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const previewContainer = document.createElement('div');
                previewContainer.className = 'preview-container drop-success';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'preview-image';
                img.alt = `Preview of ${file.name}`;
                
                const removeButton = document.createElement('button');
                removeButton.className = 'remove-button';
                removeButton.setAttribute('aria-label', `Remove ${file.name}`);
                removeButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                `;
                
                removeButton.addEventListener('click', () => {
                    this.removeFile(index);
                });
                
                previewContainer.appendChild(img);
                previewContainer.appendChild(removeButton);
                this.imagePreview.appendChild(previewContainer);
            };
            
            reader.readAsDataURL(file);
        });
        
        this.displayFileInfo();
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.previewFiles();
        
        if (this.files.length === 0) {
            this.previewSection.classList.add('hidden');
        }
    }

    simulateUpload() {
        if (this.files.length === 0) return;

        console.log('Starting upload simulation...'); // Debug log

        // Reset progress
        this.progressBar.style.width = '0%';
        this.progressBar.setAttribute('aria-valuenow', 0);
        
        // Reset progress percentage display
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = '0%';
        }
        
        this.uploadButton.disabled = true;
        this.uploadButton.textContent = 'Uploading...';
        this.cancelButton.classList.remove('hidden');
        this.isUploading = true;
        this.startTime = Date.now();
        this.lastLoaded = 0;

        const totalSize = this.files.reduce((sum, file) => sum + file.size, 0);
        let uploadedSize = 0;

        console.log(`Total size: ${totalSize} bytes`); // Debug log

        // Simulate upload progress
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
            console.log(`Progress: ${progress.toFixed(1)}%, Uploaded: ${uploadedSize.toFixed(0)} bytes`); // Debug log
            this.updateUploadStats(uploadedSize, totalSize);
        }, 200);
    }

    updateUploadStats(loaded, total) {
        const percentage = Math.round((loaded / total) * 100);
        this.progressBar.style.width = percentage + '%';
        this.progressBar.setAttribute('aria-valuenow', percentage);
        
        // Update progress percentage display
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = `${percentage}%`;
            console.log(`Progress updated: ${percentage}%`); // Debug log
        } else {
            console.error('progressPercentage element not found!'); // Debug log
        }
        
        const now = Date.now();
        const timeElapsed = (now - this.startTime) / 1000;
        const bytesPerSecond = loaded / timeElapsed;
        const remainingBytes = total - loaded;
        const timeRemaining = remainingBytes / bytesPerSecond;
        
        this.uploadSpeed.textContent = this.formatSpeed(bytesPerSecond);
        this.timeRemaining.textContent = this.formatTimeRemaining(timeRemaining);
        this.lastLoaded = loaded;
    }

    formatSpeed(bytesPerSecond) {
        if (bytesPerSecond < 1024) {
            return `${bytesPerSecond.toFixed(1)} B/s`;
        } else if (bytesPerSecond < 1024 * 1024) {
            return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
        } else {
            return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
        }
    }

    formatTimeRemaining(seconds) {
        if (seconds < 60) {
            return `${Math.ceil(seconds)}s remaining`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.ceil(seconds % 60);
            return `${minutes}m ${remainingSeconds}s remaining`;
        }
    }

    uploadComplete() {
        this.isUploading = false;
        clearInterval(this.uploadInterval);
        
        // Add success animation to progress bar
        this.progressBar.classList.add('success-glow');
        
        // Update progress to 100%
        this.progressBar.style.width = '100%';
        this.progressBar.setAttribute('aria-valuenow', 100);
        
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = '100%';
        }
        
        // Show success message
        this.toastManager.show(`${this.files.length} image${this.files.length > 1 ? 's' : ''} uploaded successfully!`, 'success');
        
        // Trigger custom event for side panel
        const uploadSuccessEvent = new CustomEvent('uploadSuccess', {
            detail: { files: this.files }
        });
        this.dropZone.dispatchEvent(uploadSuccessEvent);
        
        // Reset upload stats
        this.uploadSpeed.textContent = '-';
        this.timeRemaining.textContent = '-';
        
        // Hide cancel button and show upload button
        this.cancelButton.classList.add('hidden');
        this.uploadButton.classList.remove('hidden');
        
        // Clear files after a short delay to show completion
        setTimeout(() => {
            this.clearPreview();
            this.progressBar.classList.remove('success-glow');
        }, 2000);
    }

    clearPreview() {
        // Clear the file input
        this.fileInput.value = '';
        this.files = [];
        
        // Clear the preview
        this.imagePreview.innerHTML = '';
        this.previewSection.classList.add('hidden');
        
        // Reset all stats
        this.fileCount.textContent = '0 files';
        this.totalSize.textContent = '-';
        this.uploadSpeed.textContent = '-';
        this.timeRemaining.textContent = '-';
        this.progressBar.style.width = '0%';
        this.progressBar.setAttribute('aria-valuenow', 0);
        
        // Reset progress percentage display
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = '0%';
        }
        
        // Reset buttons
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Upload Images';
        this.cancelButton.classList.add('hidden');
        
        // Clear localStorage
        localStorage.removeItem(this.storageKey);
        
        // Hide any error messages
        this.hideError();
    }

    cancelUpload() {
        if (!this.isUploading) return;

        this.isUploading = false;
        clearInterval(this.uploadInterval);
        
        // Reset UI
        this.progressBar.style.width = '0%';
        this.progressBar.setAttribute('aria-valuenow', 0);
        
        // Reset progress percentage display
        const progressPercentage = document.getElementById('progressPercentage');
        if (progressPercentage) {
            progressPercentage.textContent = '0%';
        }
        
        this.uploadButton.disabled = false;
        this.uploadButton.textContent = 'Upload Images';
        this.cancelButton.classList.add('hidden');
        this.uploadSpeed.textContent = '-';
        this.timeRemaining.textContent = '-';
        
        // Show cancellation message
        this.showError('Upload cancelled');
        
        // Hide error message after 2 seconds
        setTimeout(() => {
            this.hideError();
        }, 2000);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.add('drag-active');
    }

    handleDragLeave() {
        e.preventDefault();
        e.stopPropagation();
        this.dragCounter--;
        
        if (this.dragCounter === 0) {
            this.dropZone.classList.remove('drag-active');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.dropZone.classList.remove('drag-active');
        this.dragCounter = 0;
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    processFiles(files) {
        if (files.length === 0) {
            this.toastManager.show('No files selected', 'error');
            return;
        }

        // Validate each file
        const validFiles = files.filter(file => {
            if (!this.allowedTypes.includes(file.type)) {
                this.toastManager.show(`Invalid file type: ${file.name}`, 'error');
                return false;
            }

            if (file.size > this.maxFileSize) {
                this.toastManager.show(`File too large: ${file.name}`, 'error');
                return false;
            }

            if (file.size === 0) {
                this.toastManager.show(`Empty file: ${file.name}`, 'error');
                return false;
            }

            return true;
        });

        if (validFiles.length > 0) {
            this.files = validFiles;
            this.hideError();
            this.displayFileInfo();
            this.previewFiles();
            this.toastManager.show(`${validFiles.length} files ready to upload`, 'success');
            
            // Focus and scroll to upload button after successful file processing
            this.focusAndScrollToUploadButton();
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.classList.remove('hidden');
        this.errorMessage.classList.add('error-shake');
        
        // Add error styling
        this.errorMessage.className = 'bg-error-50 border-l-4 border-error-500 text-error-700 dark:bg-error-900 dark:border-error-700 dark:text-error-100 p-4 mb-6 rounded-xl error-shake';
        
        // Remove error animation after it completes
        setTimeout(() => {
            this.errorMessage.classList.remove('error-shake');
        }, 500);
        
        // Show error toast
        this.toastManager.show(message, 'error');
    }

    hideError() {
        this.errorMessage.classList.add('hidden');
    }

    loadFromLocalStorage() {
        try {
        const savedData = localStorage.getItem(this.storageKey);
        if (!savedData) return;

            const uploadData = JSON.parse(savedData);
            
            // Validate saved data
            if (!Array.isArray(uploadData) || uploadData.length === 0) {
                throw new Error('Invalid saved data format');
            }

            // Note: We can't fully restore files from localStorage
            // Just show the file information
            this.fileCount.textContent = `${uploadData.length} file${uploadData.length > 1 ? 's' : ''} previously uploaded`;
            const totalSize = uploadData.reduce((sum, file) => sum + file.size, 0);
            this.totalSize.textContent = `Total size: ${this.formatFileSize(totalSize)}`;
            this.previewSection.classList.remove('hidden');
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            localStorage.removeItem(this.storageKey);
        }
    }

    focusAndScrollToUploadButton() {
        // Wait for the preview section to be visible and animations to complete
        setTimeout(() => {
            if (this.uploadButton && !this.uploadButton.disabled) {
                // Smooth scroll to the upload button
                this.uploadButton.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
                
                // Focus the upload button after a short delay to ensure scroll completes
                setTimeout(() => {
                    this.uploadButton.focus();
                }, 300);
            }
        }, 700); // Wait for preview animations to complete
    }

    // Constants
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

    // Modularize file validation
    validateFile(file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
            this.showError(`Invalid file type for ${file.name}. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
            return false;
        }
        if (file.size > MAX_FILE_SIZE) {
            this.showError(`File ${file.name} is too large. Maximum size: ${this.formatFileSize(MAX_FILE_SIZE)}`);
            return false;
        }
        if (file.size === 0) {
            this.showError(`File ${file.name} is empty`);
            return false;
        }
        return true;
    }
}
class SidePanel {
    /**
     * Initialize the side panel, set up DOM references, and event listeners.
     */
    constructor() {
        this.uploadedImagesList = document.getElementById('uploadedImagesList');
        this.deleteAllButton = document.getElementById('deleteAllButton');
        this.deleteConfirmationDialog = document.getElementById('deleteConfirmationDialog');
        this.cancelDeleteButton = document.getElementById('cancelDeleteButton');
        this.confirmDeleteButton = document.getElementById('confirmDeleteButton');
        this.emptyState = document.getElementById('emptyState');
        this.uploadedGroups = new Map();
        this.isMobile = window.innerWidth < 640;
        this.storageKey = 'uploadedImagesData';
        this.isInitialized = false;
        this.imageCache = new Map(); // For managing object URLs
        
        // Debug logging for element initialization
        console.log('SidePanel constructor - Elements found:');
        console.log('- uploadedImagesList:', !!this.uploadedImagesList);
        console.log('- deleteAllButton:', !!this.deleteAllButton);
        console.log('- deleteConfirmationDialog:', !!this.deleteConfirmationDialog);
        console.log('- cancelDeleteButton:', !!this.cancelDeleteButton);
        console.log('- confirmDeleteButton:', !!this.confirmDeleteButton);
        console.log('- emptyState:', !!this.emptyState);
        
        // Check if all required elements exist
        const missing = [];
        if (!this.uploadedImagesList) missing.push('uploadedImagesList');
        if (!this.deleteAllButton) missing.push('deleteAllButton');
        if (!this.deleteConfirmationDialog) missing.push('deleteConfirmationDialog');
        if (!this.cancelDeleteButton) missing.push('cancelDeleteButton');
        if (!this.confirmDeleteButton) missing.push('confirmDeleteButton');
        if (!this.emptyState) missing.push('emptyState');
        if (missing.length > 0) {
            const msg = `Initialization failed: Missing required element(s): ${missing.join(', ')}. Please check your HTML.`;
            this.showUserError(msg);
            throw new Error(msg);
        }
        
        this.initializeEventListeners();
        this.setupMobileView();
        this.updateEmptyState();
    }

    /**
     * Test if localStorage is available and working.
     */
    testLocalStorage() {
        console.log('Testing localStorage functionality...');
        
        try {
            // Test 1: Check if localStorage is available
            if (typeof localStorage === 'undefined') {
                throw new Error('localStorage is not available');
            }
            console.log('✓ localStorage is available');
            
            // Test 2: Test basic set/get
            const testKey = 'test_key_' + Date.now();
            const testData = { test: 'data', timestamp: Date.now() };
            localStorage.setItem(testKey, JSON.stringify(testData));
            const retrieved = JSON.parse(localStorage.getItem(testKey));
            localStorage.removeItem(testKey);
            
            if (JSON.stringify(retrieved) === JSON.stringify(testData)) {
                console.log('✓ Basic localStorage set/get works');
            } else {
                throw new Error('Basic localStorage test failed');
            }
            
            // Test 3: Check current storage data
            const currentData = localStorage.getItem(this.storageKey);
            console.log('Current storage data exists:', !!currentData);
            if (currentData) {
                console.log('Current data size:', currentData.length);
                try {
                    const parsed = JSON.parse(currentData);
                    console.log('Current data keys:', Object.keys(parsed));
                } catch (e) {
                    console.log('Current data is corrupted');
                }
            }
            
            console.log('✓ localStorage test completed successfully');
            return true;
        } catch (error) {
            console.error('✗ localStorage test failed:', error);
            return false;
        }
    }

    /**
     * Initialize the side panel and load saved data from localStorage.
     */
    async initialize() {
        try {
            console.log('SidePanel: Starting initialization...');
            
            // Test localStorage first
            if (!this.testLocalStorage()) {
                const msg = 'Initialization failed: localStorage is not available or not working. Please check your browser settings.';
                this.showUserError(msg);
                throw new Error(msg);
            }
            
            await this.loadFromLocalStorage();
            this.isInitialized = true;
            console.log('SidePanel: Initialization complete');
        } catch (error) {
            const msg = 'SidePanel: Initialization failed. ' + (error && error.message ? error.message : error);
            this.showUserError(msg);
            console.error(msg);
            this.isInitialized = true; // Mark as initialized even if loading fails
        }
    }

    /**
     * Set up all event listeners for delete buttons, dialogs, and resize.
     */
    initializeEventListeners() {
        this.deleteAllButton.addEventListener('click', () => this.showDeleteConfirmation());
        this.cancelDeleteButton.addEventListener('click', () => this.hideDeleteConfirmation());
        this.confirmDeleteButton.addEventListener('click', () => {
            this.deleteAllImages(true); // pass true to indicate user confirmed
        });
        
        // Enhanced dialog interactions
        this.deleteConfirmationDialog.addEventListener('click', (e) => {
            if (e.target === this.deleteConfirmationDialog) {
                this.hideDeleteConfirmation();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.deleteConfirmationDialog.classList.contains('hidden')) {
                this.hideDeleteConfirmation();
            }
        });

        // Handle window resize for mobile view
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 640;
            
            if (wasMobile !== this.isMobile) {
                this.setupMobileView();
            }
        });
    }

    /**
     * Set up mobile view and touch interactions for the side panel.
     */
    setupMobileView() {
        if (this.isMobile) {
            const handle = document.createElement('div');
            handle.className = 'handle w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing';
            handle.setAttribute('role', 'presentation');
            handle.setAttribute('aria-label', 'Drag to resize panel');
            
            if (!this.uploadedImagesList.previousElementSibling?.classList.contains('handle')) {
                this.uploadedImagesList.parentElement.insertBefore(handle, this.uploadedImagesList);
            }

            this.setupTouchInteractions();
        } else {
            const handle = this.uploadedImagesList.previousElementSibling;
            if (handle?.classList.contains('handle')) {
                handle.remove();
            }
        }
    }

    /**
     * Set up touch drag-to-close interactions for mobile side panel.
     */
    setupTouchInteractions() {
        let startY = 0;
        let currentY = 0;
        const panel = document.getElementById('uploadedImagesPanel');
        
        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
            currentY = startY;
            panel.style.transition = 'none';
        };

        const handleTouchMove = (e) => {
            const deltaY = e.touches[0].clientY - startY;
            currentY = e.touches[0].clientY;
            
            if (deltaY > 0) { // Only allow dragging down
                panel.style.transform = `translateY(${deltaY}px)`;
            }
        };

        const handleTouchEnd = () => {
            panel.style.transition = 'transform 0.3s ease';
            
            const deltaY = currentY - startY;
            if (deltaY > 100) { // If dragged down more than 100px, close the panel
                panel.style.transform = 'translateY(100%)';
                panel.classList.remove('active');
                // Accessibility: hide from screen readers and tab order
                panel.setAttribute('aria-hidden', 'true');
                panel.setAttribute('tabindex', '-1');
            } else {
                panel.style.transform = '';
                // Accessibility: restore for screen readers and tab order
                panel.removeAttribute('aria-hidden');
                panel.removeAttribute('tabindex');
            }
        };

        panel.addEventListener('touchstart', handleTouchStart);
        panel.addEventListener('touchmove', handleTouchMove);
        panel.addEventListener('touchend', handleTouchEnd);
    }

    /**
     * Show the delete confirmation dialog and focus the cancel button.
     */
    showDeleteConfirmation() {
        this.deleteConfirmationDialog.classList.remove('hidden');
        this.deleteConfirmationDialog.classList.add('flex', 'animate-fade-in');
        
        // Add animation to dialog content
        const dialogContent = this.deleteConfirmationDialog.querySelector('.bg-white');
        if (dialogContent) {
            dialogContent.classList.add('animate-bounce-in');
            dialogContent.classList.remove('scale-95', 'opacity-0');
            dialogContent.classList.add('scale-100', 'opacity-100');
            dialogContent.addEventListener('click', (e) => e.stopPropagation());
        }
        
        // Focus the first actionable button for accessibility
        this.cancelDeleteButton.focus();
    }

    /**
     * Hide the delete confirmation dialog and return focus to deleteAllButton.
     */
    hideDeleteConfirmation() {
        const dialog = this.deleteConfirmationDialog;
        const dialogContent = dialog.querySelector('.bg-white');
        
        if (dialogContent) {
            dialogContent.classList.remove('scale-100', 'opacity-100');
            dialogContent.classList.add('scale-95', 'opacity-0');
            dialogContent.style.transform = 'scale(0.95)';
            dialogContent.style.opacity = '0';
        }
        
        setTimeout(() => {
            dialog.classList.add('hidden');
            dialog.classList.remove('flex', 'animate-fade-in');
            if (dialogContent) {
                dialogContent.style.transform = '';
                dialogContent.style.opacity = '';
                dialogContent.classList.remove('animate-bounce-in');
            }
            // Return focus to deleteAllButton for accessibility
            this.deleteAllButton.focus();
        }, 300);
    }

    /**
     * Add a new image group to the gallery and save to localStorage.
     */
    addImageGroup(previews, timestamp) {
        if (!previews?.length) return;

        const groupId = `group-${timestamp}`;
        const groupElement = this.createGroupElement(groupId, previews, timestamp);
        groupElement.id = groupId;
        groupElement.style.opacity = '0';
        groupElement.style.transform = 'translateY(20px)';
        this.uploadedImagesList.prepend(groupElement);
        requestAnimationFrame(() => {
            groupElement.style.transition = 'all 0.3s ease-out';
            groupElement.style.opacity = '1';
            groupElement.style.transform = 'translateY(0)';
        });
        // Store preview data as images
        this.uploadedGroups.set(groupId, { images: previews, timestamp });
        this.saveToLocalStorage();
        this.updateEmptyState();
    }

    /**
     * Create a DOM element for an image group, with ARIA and remove buttons.
     * Adds per-image and per-batch delete buttons, and margin between batches.
     */
    createGroupElement(groupId, previews, timestamp) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'image-group mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-card';
        groupDiv.id = groupId;
        groupDiv.setAttribute('role', 'region');
        groupDiv.setAttribute('aria-label', `Uploaded image group from ${this.formatTimestamp(timestamp)}`);

        // Batch header with always-visible delete button
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        const batchLabel = document.createElement('span');
        batchLabel.className = 'text-sm text-gray-500 dark:text-gray-400';
        batchLabel.textContent = this.formatTimestamp(timestamp);
        const batchDeleteBtn = document.createElement('button');
        batchDeleteBtn.className = 'remove-button !static !opacity-100 !transform-none ml-2';
        batchDeleteBtn.setAttribute('aria-label', 'Delete this batch');
        batchDeleteBtn.innerHTML = '🗑️';
        batchDeleteBtn.addEventListener('click', () => this.deleteGroup(groupId));
        header.appendChild(batchLabel);
        header.appendChild(batchDeleteBtn);
        groupDiv.appendChild(header);

        // Images grid
        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'grid grid-cols-2 gap-2';
        previews.forEach((preview) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'preview-container aspect-square';
            const img = document.createElement('img');
            img.src = preview.url;
            img.alt = `Uploaded ${preview.name}`;
            img.className = 'w-full h-full object-cover rounded';
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-button';
            removeBtn.setAttribute('aria-label', `Remove image ${preview.name}`);
            removeBtn.innerHTML = `🗑️`;
            removeBtn.addEventListener('click', () => this.deleteImageById(groupId, preview.id));
            imgContainer.appendChild(img);
            imgContainer.appendChild(removeBtn);
            imagesGrid.appendChild(imgContainer);
        });
        groupDiv.appendChild(imagesGrid);
        return groupDiv;
    }

    /**
     * Delete a single image from a group by its unique ID and update storage/UI.
     */
    deleteImageById(groupId, imageId) {
        const group = this.uploadedGroups.get(groupId);
        if (group) {
            group.images = group.images.filter(img => img.id !== imageId);
            if (group.images.length === 0) {
                this.deleteGroup(groupId);
            } else {
                const groupElement = document.getElementById(groupId);
                if (groupElement) {
                    const newGroupElement = this.createGroupElement(groupId, group.images, group.timestamp);
                    newGroupElement.id = groupId;
                    groupElement.replaceWith(newGroupElement);
                }
                this.uploadedGroups.set(groupId, group);
            }
            this.saveToLocalStorage();
            this.updateEmptyState();
        }
    }

    /**
     * Delete an entire group from the gallery and update storage/UI.
     */
    deleteGroup(groupId) {
        const groupElement = document.getElementById(groupId);
        if (groupElement) {
            groupElement.style.opacity = '0';
            groupElement.style.transform = 'translateY(20px)';
            setTimeout(() => {
                groupElement.remove();
                this.uploadedGroups.delete(groupId);
                this.saveToLocalStorage();
                this.updateEmptyState();
            }, 300);
        }
    }

    /**
     * Delete all images/groups from the gallery and update storage/UI.
     * @param {boolean} confirmed - If true, hide the dialog after delete
     */
    deleteAllImages(confirmed = false) {
        const elements = Array.from(this.uploadedImagesList.children);
        let delay = 0;
        elements.forEach((element) => {
            setTimeout(() => {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px) scale(0.95)';
            }, delay);
            delay += 100;
        });
        setTimeout(() => {
            this.uploadedImagesList.innerHTML = '';
            this.uploadedGroups.clear();
            this.saveToLocalStorage();
            this.updateEmptyState();
            if (confirmed) this.hideDeleteConfirmation();
            if (window.toastManager) {
                window.toastManager.show('All images deleted successfully', 'success');
            }
        }, delay + 300);
    }

    /**
     * Format a timestamp for display in ARIA labels and UI.
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // If less than 1 minute ago
        if (diff < 60000) {
            return 'Just now';
        }
        
        // If less than 1 hour ago
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        }
        
        // If less than 24 hours ago
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // If this year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        }
        
        // Otherwise show full date
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /**
     * Show or hide the empty state message based on gallery contents.
     */
    updateEmptyState() {
        console.log(`updateEmptyState called. Groups count: ${this.uploadedGroups.size}`); // Debug log
        
        // Check if empty state element exists
        if (!this.emptyState) {
            console.error('Empty state element not found!');
            this.emptyState = document.getElementById('emptyState');
            if (!this.emptyState) {
                console.error('Still cannot find empty state element!');
                return;
            }
        }
        
        if (this.uploadedGroups.size === 0) {
            console.log('Showing empty state message'); // Debug log
            this.emptyState.classList.remove('hidden');
            this.deleteAllButton.classList.add('opacity-50', 'pointer-events-none');
        } else {
            console.log('Hiding empty state message'); // Debug log
            this.emptyState.classList.add('hidden');
            this.deleteAllButton.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    /**
     * Save all image groups to localStorage, with quota error handling.
     * Store as an array of groups: [{timestamp, images: [{id, name, type, data}]}]
     */
    async saveToLocalStorage() {
        try {
            if (this.uploadedGroups.size === 0) {
                localStorage.removeItem(this.storageKey);
                return;
            }
            // Store as array of groups
            const groupsArray = Array.from(this.uploadedGroups.values()).map(group => ({
                timestamp: group.timestamp,
                images: group.images.map(img => ({
                    id: img.id,
                    name: img.name,
                    type: img.type,
                    data: img.url || img.data // always store base64
                }))
            }));
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(groupsArray));
            } catch (e) {
                if (e.name === 'QuotaExceededError' || e.code === 22) {
                    if (window.toastManager) window.toastManager.show('Storage limit reached! Please delete some images.', 'error');
                    return;
                }
                throw e;
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    /**
     * Load all image groups from localStorage and render them in the gallery.
     *
     * Note: For very large galleries, consider lazy loading images for performance.
     */
    async loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) return;
            const groupsArray = JSON.parse(savedData);
            if (!Array.isArray(groupsArray)) return;
            this.uploadedGroups.clear();
            this.uploadedImagesList.innerHTML = '';
            for (const group of groupsArray) {
                if (!group.images || !Array.isArray(group.images)) continue;
                const groupId = `group-${group.timestamp}`;
                // Convert images to preview objects
                const previews = group.images.map(img => ({
                    id: img.id,
                    url: img.data,
                    name: img.name,
                    type: img.type
                }));
                const groupElement = this.createGroupElement(groupId, previews, group.timestamp);
                groupElement.id = groupId;
                this.uploadedImagesList.appendChild(groupElement);
                this.uploadedGroups.set(groupId, { images: previews, timestamp: group.timestamp });
            }
            this.updateEmptyState();
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            localStorage.removeItem(this.storageKey);
            throw error;
        }
    }

    /**
     * Show a user-friendly error message, using toast for non-critical errors.
     */
    showUserError(message, critical = false) {
        if (!critical && window.toastManager) {
            window.toastManager.show(message, 'error');
            return;
        }
        let errorMessage = document.getElementById('errorMessage');
        if (!errorMessage) {
            // If not present, create it at the top of the body
            errorMessage = document.createElement('div');
            errorMessage.id = 'errorMessage';
            errorMessage.className = 'bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-100 p-4 mb-6 rounded';
            errorMessage.setAttribute('role', 'alert');
            errorMessage.setAttribute('aria-live', 'polite');
            document.body.prepend(errorMessage);
        }
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    /**
     * Utility: Revoke object URLs if used for previews (future-proofing).
     */
    revokeObjectURLs() {
        // If you ever use URL.createObjectURL for image previews, store the URLs and call URL.revokeObjectURL(url) here
        // Currently, previews use base64, so this is not needed, but this is best practice for future-proofing.
        for (const url of this.imageCache.values()) {
            try { URL.revokeObjectURL(url); } catch (e) {}
        }
        this.imageCache.clear();
    }
}

// Don't auto-initialize here, let main.js handle it
// const sidePanel = new SidePanel();
// window.sidePanel = sidePanel; 

// Utility: Centralized localStorage error handler
function handleStorageError(error) {
    // Optionally show a toast or alert
    console.error('Storage error:', error);
}

window.SidePanel = SidePanel;
console.log('window.SidePanel set:', window.SidePanel); 
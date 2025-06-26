class SidePanel {
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
        
        // Debug logging for element initialization
        console.log('SidePanel constructor - Elements found:');
        console.log('- uploadedImagesList:', !!this.uploadedImagesList);
        console.log('- deleteAllButton:', !!this.deleteAllButton);
        console.log('- deleteConfirmationDialog:', !!this.deleteConfirmationDialog);
        console.log('- cancelDeleteButton:', !!this.cancelDeleteButton);
        console.log('- confirmDeleteButton:', !!this.confirmDeleteButton);
        console.log('- emptyState:', !!this.emptyState);
        
        // Check if all required elements exist
        if (!this.uploadedImagesList || !this.deleteAllButton || !this.deleteConfirmationDialog || 
            !this.cancelDeleteButton || !this.confirmDeleteButton || !this.emptyState) {
            throw new Error('Required DOM elements not found for SidePanel');
        }
        
        this.initializeEventListeners();
        this.setupMobileView();
        this.updateEmptyState();
    }

    // Test localStorage functionality
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

    // Initialize the side panel and load saved data
    async initialize() {
        try {
            console.log('SidePanel: Starting initialization...');
            
            // Test localStorage first
            if (!this.testLocalStorage()) {
                throw new Error('localStorage test failed');
            }
            
            await this.loadFromLocalStorage();
            this.isInitialized = true;
            console.log('SidePanel: Initialization complete');
        } catch (error) {
            console.error('SidePanel: Initialization failed:', error);
            this.isInitialized = true; // Mark as initialized even if loading fails
        }
    }

    initializeEventListeners() {
        this.deleteAllButton.addEventListener('click', () => this.showDeleteConfirmation());
        this.cancelDeleteButton.addEventListener('click', () => this.hideDeleteConfirmation());
        this.confirmDeleteButton.addEventListener('click', () => this.deleteAllImages());
        
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

    setupMobileView() {
        if (this.isMobile) {
            const handle = document.createElement('div');
            handle.className = 'w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing';
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
            } else {
                panel.style.transform = '';
            }
        };

        panel.addEventListener('touchstart', handleTouchStart);
        panel.addEventListener('touchmove', handleTouchMove);
        panel.addEventListener('touchend', handleTouchEnd);
    }

    showDeleteConfirmation() {
        this.deleteConfirmationDialog.classList.remove('hidden');
        this.deleteConfirmationDialog.classList.add('flex', 'animate-fade-in');
        
        // Add animation to dialog content
        const dialogContent = this.deleteConfirmationDialog.querySelector('.bg-white');
        if (dialogContent) {
            dialogContent.classList.add('animate-bounce-in');
        }
        
        this.cancelDeleteButton.focus();
    }

    hideDeleteConfirmation() {
        const dialog = this.deleteConfirmationDialog;
        const dialogContent = dialog.querySelector('.bg-white');
        
        if (dialogContent) {
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
        }, 300);
    }

    addImageGroup(images, timestamp) {
        console.log(`addImageGroup called with ${images.length} images`);
        
        if (!images || images.length === 0) {
            console.warn('addImageGroup: No images provided');
            return;
        }
        
        const groupId = `group-${Date.now()}`;
        const groupElement = this.createGroupElement(groupId, images, timestamp);
        
        // Add with animation
        groupElement.style.opacity = '0';
        groupElement.style.transform = 'translateY(20px) scale(0.95)';
        this.uploadedImagesList.prepend(groupElement);
        
        // Trigger animation
        requestAnimationFrame(() => {
            groupElement.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            groupElement.style.opacity = '1';
            groupElement.style.transform = 'translateY(0) scale(1)';
        });

        this.uploadedGroups.set(groupId, { images, timestamp });
        console.log(`Group added. Total groups: ${this.uploadedGroups.size}`);
        
        // Save to localStorage immediately
        this.saveToLocalStorage().then(() => {
            console.log('Successfully saved after adding image group');
        }).catch(error => {
            console.error('Failed to save after adding image group:', error);
        });
        
        this.updateEmptyState();

        // Show panel on mobile
        if (this.isMobile) {
            const panel = document.getElementById('uploadedImagesPanel');
            panel.classList.add('active');
        }
    }

    createGroupElement(groupId, images, timestamp) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'card-modern bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 transform transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1';
        groupDiv.id = groupId;

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-3';
        
        const timeElement = document.createElement('span');
        timeElement.className = 'text-sm text-gray-600 dark:text-gray-300 font-medium';
        timeElement.textContent = this.formatTimestamp(timestamp);
        
        const deleteGroupButton = document.createElement('button');
        deleteGroupButton.className = 'p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-target';
        deleteGroupButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
        deleteGroupButton.setAttribute('aria-label', 'Delete image group');
        
        deleteGroupButton.addEventListener('click', () => {
            groupDiv.style.opacity = '0';
            groupDiv.style.transform = 'scale(0.95) translateY(-10px)';
            setTimeout(() => this.deleteGroup(groupId), 300);
        });

        header.appendChild(timeElement);
        header.appendChild(deleteGroupButton);

        const imagesGrid = document.createElement('div');
        imagesGrid.className = 'grid grid-cols-2 gap-3';

        images.forEach((image, index) => {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'relative group aspect-square rounded-lg overflow-hidden';

            const img = document.createElement('img');
            img.src = URL.createObjectURL(image);
            img.className = 'w-full h-full object-cover transition-all duration-300 group-hover:scale-110';
            img.alt = `Uploaded image ${index + 1}`;
            img.loading = 'lazy';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 group-hover:scale-100 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg touch-target';
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';
            deleteButton.setAttribute('aria-label', 'Delete image');
            
            deleteButton.addEventListener('click', () => {
                imageContainer.style.opacity = '0';
                imageContainer.style.transform = 'scale(0.9) rotate(5deg)';
                setTimeout(() => this.deleteImage(groupId, index), 300);
            });

            imageContainer.appendChild(img);
            imageContainer.appendChild(deleteButton);
            imagesGrid.appendChild(imageContainer);
        });

        groupDiv.appendChild(header);
        groupDiv.appendChild(imagesGrid);

        return groupDiv;
    }

    deleteImage(groupId, imageIndex) {
        const group = this.uploadedGroups.get(groupId);
        if (group) {
            group.images.splice(imageIndex, 1);
            if (group.images.length === 0) {
                this.deleteGroup(groupId);
            } else {
                const groupElement = document.getElementById(groupId);
                if (groupElement) {
                    const newGroupElement = this.createGroupElement(groupId, group.images, group.timestamp);
                    groupElement.replaceWith(newGroupElement);
                }
            }
            
            // Save to localStorage immediately
            this.saveToLocalStorage().then(() => {
                console.log('Successfully saved after deleting image');
            }).catch(error => {
                console.error('Failed to save after deleting image:', error);
            });
            
            this.updateEmptyState();
        }
    }

    deleteGroup(groupId) {
        const groupElement = document.getElementById(groupId);
        if (groupElement) {
            groupElement.style.opacity = '0';
            groupElement.style.transform = 'translateY(20px)';
            setTimeout(() => {
                groupElement.remove();
                this.uploadedGroups.delete(groupId);
                
                // Save to localStorage immediately
                this.saveToLocalStorage().then(() => {
                    console.log('Successfully saved after deleting group');
                }).catch(error => {
                    console.error('Failed to save after deleting group:', error);
                });
                
                this.updateEmptyState();
            }, 300);
        }
    }

    deleteAllImages() {
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
            
            // Save to localStorage immediately
            this.saveToLocalStorage().then(() => {
                console.log('Successfully saved after deleting all images');
            }).catch(error => {
                console.error('Failed to save after deleting all images:', error);
            });
            
            this.updateEmptyState();
            this.hideDeleteConfirmation();
            
            // Show success message
            if (window.toastManager) {
                window.toastManager.show('All images deleted successfully', 'success');
            }
        }, delay + 300);
    }

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

    // Convert File object to base64 string for storage
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file || !(file instanceof File)) {
                reject(new Error('Invalid file object'));
                return;
            }
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Convert base64 string back to File object
    base64ToFile(base64String, fileName, mimeType) {
        try {
            if (!base64String || typeof base64String !== 'string') {
                throw new Error('Invalid base64 string');
            }
            
            const parts = base64String.split(',');
            if (parts.length !== 2) {
                throw new Error('Invalid base64 format');
            }
            
            const byteCharacters = atob(parts[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            return new File([byteArray], fileName, { type: mimeType });
        } catch (error) {
            console.error('Error converting base64 to file:', error);
            throw error;
        }
    }

    // Save uploaded images to localStorage
    async saveToLocalStorage() {
        try {
            console.log('Saving to localStorage...');
            console.log('Current uploadedGroups size:', this.uploadedGroups.size);
            
            if (this.uploadedGroups.size === 0) {
                console.log('No groups to save, clearing localStorage');
                localStorage.removeItem(this.storageKey);
                return;
            }
            
            const storageData = {};
            
            for (const [groupId, groupData] of this.uploadedGroups) {
                console.log(`Processing group ${groupId} for storage with ${groupData.images.length} images`);
                const imageData = [];
                
                for (const file of groupData.images) {
                    try {
                        console.log(`Converting file ${file.name} to base64...`);
                        const base64 = await this.fileToBase64(file);
                        imageData.push({
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            data: base64
                        });
                        console.log(`Converted ${file.name} successfully`);
                    } catch (error) {
                        console.error(`Failed to convert ${file.name}:`, error);
                        // Continue with other files
                    }
                }
                
                if (imageData.length > 0) {
                    storageData[groupId] = {
                        images: imageData,
                        timestamp: groupData.timestamp
                    };
                }
            }
            
            const jsonData = JSON.stringify(storageData);
            console.log('Saving data to localStorage, size:', jsonData.length);
            localStorage.setItem(this.storageKey, jsonData);
            
            // Verify the data was saved
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                console.log('Successfully saved to localStorage, verification passed');
            } else {
                throw new Error('Data not found in localStorage after save');
            }
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    // Load uploaded images from localStorage
    async loadFromLocalStorage() {
        try {
            console.log('Loading from localStorage...');
            const savedData = localStorage.getItem(this.storageKey);
            if (!savedData) {
                console.log('No saved data found in localStorage');
                return;
            }

            console.log('Found saved data, parsing...');
            const storageData = JSON.parse(savedData);
            console.log('Storage data keys:', Object.keys(storageData));
            
            let loadedCount = 0;
            for (const [groupId, groupData] of Object.entries(storageData)) {
                try {
                    console.log(`Processing group ${groupId}:`, groupData);
                    
                    if (!groupData.images || !Array.isArray(groupData.images)) {
                        console.warn(`Invalid group data for ${groupId}, skipping`);
                        continue;
                    }
                    
                    const images = [];
                    
                    for (const imageInfo of groupData.images) {
                        try {
                            if (!imageInfo.data || !imageInfo.name || !imageInfo.type) {
                                console.warn(`Invalid image info in group ${groupId}, skipping`);
                                continue;
                            }
                            
                            const file = this.base64ToFile(imageInfo.data, imageInfo.name, imageInfo.type);
                            images.push(file);
                            console.log(`Converted image: ${imageInfo.name}`);
                        } catch (error) {
                            console.error(`Failed to convert image ${imageInfo.name}:`, error);
                        }
                    }
                    
                    if (images.length > 0) {
                        // Create the group element and add to UI
                        const groupElement = this.createGroupElement(groupId, images, groupData.timestamp);
                        this.uploadedImagesList.appendChild(groupElement);
                        
                        // Add to the Map
                        this.uploadedGroups.set(groupId, {
                            images: images,
                            timestamp: groupData.timestamp
                        });
                        
                        loadedCount++;
                        console.log(`Successfully loaded group ${groupId} with ${images.length} images`);
                    }
                } catch (error) {
                    console.error(`Error processing group ${groupId}:`, error);
                }
            }
            
            console.log(`Loaded ${loadedCount} image groups from localStorage`);
            this.updateEmptyState();
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            // Clear corrupted data
            localStorage.removeItem(this.storageKey);
            throw error;
        }
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
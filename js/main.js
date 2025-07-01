document.addEventListener('DOMContentLoaded', async () => {
    // Utility: Centralized error handler
    function handleError(error, userMessage = 'An error occurred') {
        console.error(error);
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = userMessage;
            errorMessage.classList.remove('hidden');
            errorMessage.classList.add('error-shake');
            
            // Remove error animation after it completes
            setTimeout(() => {
                errorMessage.classList.remove('error-shake');
            }, 500);
        }
    }

    try {
        // Initialize the uploader
        const uploader = new DragDropUploader({
            dropZone: document.getElementById('dropZone'),
            fileInput: document.getElementById('fileInput'),
            previewSection: document.getElementById('previewSection'),
            imagePreview: document.getElementById('imagePreview'),
            progressBar: document.getElementById('progressBar'),
            fileCount: document.getElementById('fileCount'),
            totalSize: document.getElementById('totalSize'),
            uploadButton: document.getElementById('uploadButton'),
            cancelButton: document.getElementById('cancelButton'),
            uploadSpeed: document.getElementById('uploadSpeed'),
            timeRemaining: document.getElementById('timeRemaining'),
            errorMessage: document.getElementById('errorMessage'),
            maxFileSizeDisplay: document.getElementById('maxFileSizeDisplay'),
            maxFileSize: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
            storageKey: 'uploadedImagesData'
        });

        // Make toast manager globally available
        window.toastManager = uploader.toastManager;

        // Initialize the side panel
        console.log('window.SidePanel before instantiation:', window.SidePanel);
        const sidePanel = new window.SidePanel();
        window.sidePanel = sidePanel;
        
        // Initialize and load saved data
        await sidePanel.initialize();

        // Theme management
        class ThemeManager {
            constructor() {
                this.themeToggle = document.getElementById('themeToggle');
                this.sunIcon = document.getElementById('sunIcon');
                this.moonIcon = document.getElementById('moonIcon');
                this.html = document.documentElement;
                this.themeKey = 'theme';
                
                if (!this.themeToggle || !this.sunIcon || !this.moonIcon) {
                    throw new Error('Theme elements not found');
                }

                this.init();
            }

            init() {
                this.loadTheme();
                this.setupEventListeners();
            }

            loadTheme() {
                const savedTheme = localStorage.getItem(this.themeKey);
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                
                if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                    this.setDarkTheme();
                } else {
                    this.setLightTheme();
                }
            }

            setDarkTheme() {
                this.html.classList.add('dark');
                this.sunIcon.classList.add('hidden');
                this.moonIcon.classList.remove('hidden');
                localStorage.setItem(this.themeKey, 'dark');
            }

            setLightTheme() {
                this.html.classList.remove('dark');
                this.sunIcon.classList.remove('hidden');
                this.moonIcon.classList.add('hidden');
                localStorage.setItem(this.themeKey, 'light');
            }

            setupEventListeners() {
                this.themeToggle.addEventListener('click', () => {
                    if (this.html.classList.contains('dark')) {
                        this.setLightTheme();
                    } else {
                        this.setDarkTheme();
                    }
                });

                // Listen for system theme changes
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                    if (!localStorage.getItem(this.themeKey)) {
                        if (e.matches) {
                            this.setDarkTheme();
                        } else {
                            this.setLightTheme();
                        }
                    }
                });
            }
        }

        // Initialize theme manager
        const themeManager = new ThemeManager();

        // Cleanup on page unload
        window.addEventListener('unload', () => {
            if (uploader && typeof uploader.cleanup === 'function') {
                uploader.cleanup();
            }
        });

        // Event listener for successful uploads
        document.getElementById('dropZone').addEventListener('uploadSuccess', (e) => {
            if (e.detail.previews?.length) {
                // Use the same timestamp as in uploader's group
                const now = Date.now();
                sidePanel.addImageGroup(e.detail.previews, now);
            }
        });

        // Add enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + U to focus upload area
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                document.getElementById('dropZone').focus();
            }
            
            // Escape to close dialogs
            if (e.key === 'Escape') {
                const dialog = document.getElementById('deleteConfirmationDialog');
                if (!dialog.classList.contains('hidden')) {
                    sidePanel.hideDeleteConfirmation();
                }
            }
        });

    } catch (error) {
        handleError(error, 'Failed to initialize the application');
    }
});
export class Uploader {
    constructor(dropzoneId, inputId, onFileSelect) {
        this.dropzone = document.getElementById(dropzoneId);
        this.input = document.getElementById(inputId);
        this.onFileSelect = onFileSelect;

        this.init();
    }

    init() {
        if (!this.dropzone || !this.input) return;

        // Click to upload
        this.dropzone.addEventListener('click', () => this.input.click());
        this.input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.onFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.dropzone.addEventListener(eventName, () => {
                this.dropzone.classList.remove('drag-over');
            }, false);
        });

        this.dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                this.onFileSelect(files[0]);
            }
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
}

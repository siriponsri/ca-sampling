// CA Revalidation Static App
class CARevalidationApp {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.currentTab = 'unsampled';
        this.currentFilters = {
            floor: 'all',
            using: 'all'
        };

        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadData();
            this.setupEventListeners();
            this.updateFloorFilters();
            this.applyFilters();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('ไม่สามารถโหลดข้อมูลได้');
        }
    }

    async loadData() {
        // Load from localStorage first, then fallback to static data
        const storedData = localStorage.getItem('caRevalidationData');
        if (storedData) {
            this.data = JSON.parse(storedData);
        } else {
            this.data = [...caRevalidationData];
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('caRevalidationData', JSON.stringify(this.data));
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Floor filters
        document.getElementById('floor-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.setFloorFilter(e.target.dataset.filter);
            }
        });

        // Using filters
        document.getElementById('using-filters').addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.setUsingFilter(e.target.dataset.filter);
            }
        });
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab UI
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        this.applyFilters();
    }

    setFloorFilter(floor) {
        this.currentFilters.floor = floor;
        this.updateFloorFilterUI();
        this.applyFilters();
    }

    setUsingFilter(using) {
        this.currentFilters.using = using;
        this.updateUsingFilterUI();
        this.applyFilters();
    }

    updateFloorFilterUI() {
        document.querySelectorAll('#floor-filters .filter-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === this.currentFilters.floor);
        });
    }

    updateUsingFilterUI() {
        document.querySelectorAll('#using-filters .filter-btn').forEach(button => {
            button.classList.toggle('active', button.dataset.filter === this.currentFilters.using);
        });
    }

    updateFloorFilters() {
        const floors = [...new Set(this.data.map(item => item.floor))].sort();
        const floorFilters = document.getElementById('floor-filters');

        // Clear existing filters except "ทั้งหมด"
        const allButton = floorFilters.querySelector('[data-filter="all"]');
        floorFilters.innerHTML = '';
        floorFilters.appendChild(allButton);

        // Add floor buttons
        floors.forEach(floor => {
            const button = document.createElement('button');
            button.className = 'filter-btn';
            button.dataset.filter = floor;
            button.textContent = floor;
            floorFilters.appendChild(button);
        });

        this.updateFloorFilterUI();
    }

    applyFilters() {
        let filtered = [...this.data];

        // Filter by sampling status based on current tab
        if (this.currentTab === 'unsampled') {
            filtered = filtered.filter(item => !item.sampling);
        } else if (this.currentTab === 'sampled') {
            filtered = filtered.filter(item => item.sampling);
        } else if (this.currentTab === 'favorites') {
            filtered = filtered.filter(item => item.favorite);
        }

        // Apply floor filter
        if (this.currentFilters.floor !== 'all') {
            filtered = filtered.filter(item => item.floor === this.currentFilters.floor);
        }

        // Apply using filter
        if (this.currentFilters.using !== 'all') {
            filtered = filtered.filter(item => item.using === (this.currentFilters.using === 'true'));
        }

        // Sort by room number
        filtered.sort((a, b) => {
            const roomA = a.roomNo.toLowerCase();
            const roomB = b.roomNo.toLowerCase();
            return roomA.localeCompare(roomB);
        });

        this.filteredData = filtered;
        this.updateCounts();
        this.renderRooms();
    }

    updateCounts() {
        const unsampledCount = this.data.filter(item => !item.sampling).length;
        const sampledCount = this.data.filter(item => item.sampling).length;

        document.getElementById('unsampled-count').textContent = unsampledCount;
        document.getElementById('sampled-count').textContent = sampledCount;
    }

    renderRooms() {
        const roomList = document.getElementById('room-list');
        const emptyState = document.getElementById('empty-state');

        if (this.filteredData.length === 0) {
            roomList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        roomList.innerHTML = '';

        this.filteredData.forEach(item => {
            const roomCard = this.createRoomCard(item);
            roomList.appendChild(roomCard);
        });
    }

    createRoomCard(item) {
        const template = document.getElementById('room-card-template');
        const card = template.content.cloneNode(true);

        // Fill in the data
        card.querySelector('.room-no').textContent = item.roomNo;
        card.querySelector('.sterile-tag').textContent = item.sterileFilterTag;
        card.querySelector('.room-name').textContent = item.roomName;
        card.querySelector('.floor-badge').textContent = item.floor;

        // Using status
        const usingBadge = card.querySelector('.using-badge');
        usingBadge.textContent = item.using ? 'มีการใช้งาน' : 'ไม่มีการใช้งาน';
        usingBadge.classList.add(item.using ? 'using-true' : 'using-false');

        // Sampling date
        const samplingDate = card.querySelector('.sampling-date');
        samplingDate.textContent = item.samplingDate === 'none' ? 'ยังไม่มีการสุ่มตัวอย่าง' : item.samplingDate;

        // Sampling checkbox
        const checkbox = card.querySelector('.sampling-checkbox');
        checkbox.checked = item.sampling;
        checkbox.id = `checkbox-${item.id}`;

        // Sampling label
        const label = card.querySelector('.checkbox-label');
        label.setAttribute('for', `checkbox-${item.id}`);

        // Favorite checkbox
        const favoriteCheckbox = card.querySelector('.favorite-checkbox');
        favoriteCheckbox.checked = item.favorite;
        favoriteCheckbox.id = `favorite-${item.id}`;

        // Favorite label
        const favoriteLabel = card.querySelector('.favorite-label');
        favoriteLabel.setAttribute('for', `favorite-${item.id}`);

        // Event listener for sampling checkbox
        checkbox.addEventListener('change', () => {
            this.toggleSamplingStatus(item.id, checkbox.checked);
        });

        // Event listener for favorite checkbox
        favoriteCheckbox.addEventListener('change', () => {
            this.toggleFavoriteStatus(item.id, favoriteCheckbox.checked);
        });

        return card;
    }

    async toggleSamplingStatus(id, newStatus) {
        try {
            // Update data
            const item = this.data.find(item => item.id === id);
            if (item) {
                item.sampling = newStatus;
                item.samplingDate = newStatus ? this.getCurrentDate() : 'none';

                // Save to localStorage
                this.saveData();

                // Show success message
                this.showToast(newStatus ? 'ทำเครื่องหมายว่าสุ่มแล้ว' : 'ยกเลิกการสุ่ม', 'success');

                // Re-apply filters to move item to correct tab
                this.applyFilters();
            }
        } catch (error) {
            console.error('Error updating sampling status:', error);
            this.showToast('เกิดข้อผิดพลาดในการอัปเดต', 'error');
        }
    }

    async toggleFavoriteStatus(id, newStatus) {
        try {
            // Update data
            const item = this.data.find(item => item.id === id);
            if (item) {
                item.favorite = newStatus;

                // Save to localStorage
                this.saveData();

                // Show success message
                this.showToast(newStatus ? 'เพิ่มไปยังรายการโปรด' : 'ลบออกจากรายการโปรด', 'success');

                // Re-apply filters if we're on the favorites tab
                if (this.currentTab === 'favorites') {
                    this.applyFilters();
                }
            }
        } catch (error) {
            console.error('Error updating favorite status:', error);
            this.showToast('เกิดข้อผิดพลาดในการอัปเดต', 'error');
        }
    }

    getCurrentDate() {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        return `${day}/${month}/${year}`;
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showError(message) {
        this.hideLoading();
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // Add to body
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide and remove toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }

    clearFilters() {
        this.currentFilters = { floor: 'all', using: 'all' };
        this.updateFloorFilterUI();
        this.updateUsingFilterUI();
        this.applyFilters();
    }
}

// Toast styles (add to CSS)
const toastStyles = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    font-weight: 400;
    font-size: 13px;
    z-index: 1000;
    transform: translateX(100%);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    max-width: 250px;
    word-wrap: break-word;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.toast.show {
    transform: translateX(0);
}

.toast-success {
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.8));
}

.toast-error {
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(244, 67, 54, 0.8));
}

.toast-info {
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(33, 150, 243, 0.8));
}
`;

// Add toast styles to head
const style = document.createElement('style');
style.textContent = toastStyles;
document.head.appendChild(style);

// Global function for clear filters button
function clearFilters() {
    if (window.app) {
        window.app.clearFilters();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CARevalidationApp();
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

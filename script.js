// Advanced Task Manager with sophisticated features
class ProductivityManager {
    constructor() {
        this.tasks = this.loadFromStorage();
        this.currentFilter = 'all'; // Track current filter
        this.init();
    }

    init() {
        this.render();
        this.updateStats();
        this.bindEvents();
        this.enableCardMouseTracking();
        this.bindStatFilters();
    }

    loadFromStorage() {
        const data = localStorage.getItem('productivity-tasks-v2');
        return data ? JSON.parse(data) : [];
    }

    saveToStorage() {
        localStorage.setItem('productivity-tasks-v2', JSON.stringify(this.tasks));
    }

    addTask(text) {
        if (!text.trim()) return;

        const task = {
            id: Date.now() + Math.random(),
            text: text.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveToStorage();
        this.render();
        this.updateStats();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage();
            this.render();
            this.updateStats();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveToStorage();
        this.render();
        this.updateStats();
    }

    render() {
        const list = document.getElementById('taskList');
        
        // Filter tasks based on current filter
        let filteredTasks = this.tasks;
        if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        } else if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        }
        
        if (filteredTasks.length === 0) {
            let emptyMessage = 'Your canvas awaits.<br>Begin with your first task.';
            
            if (this.currentFilter === 'completed' && this.tasks.length > 0) {
                emptyMessage = 'No completed tasks yet.<br>Start checking off your accomplishments!';
            } else if (this.currentFilter === 'pending' && this.tasks.length > 0) {
                emptyMessage = 'All tasks completed!<br>You\'re doing amazing! 🎉';
            }
            
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">✦</div>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }

        list.innerHTML = filteredTasks.map(task => `
            <li class="task-item ${task.completed ? 'completed' : ''}" style="animation: slideInUp 0.4s ease-out backwards;">
                <div class="custom-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-actions">
                    <button class="icon-btn delete-task" data-id="${task.id}">×</button>
                </div>
            </li>
        `).join('');

        // Stagger animation
        document.querySelectorAll('.task-item').forEach((item, index) => {
            item.style.animationDelay = `${index * 0.05}s`;
        });

        this.bindTaskEvents();
    }

    bindTaskEvents() {
        document.querySelectorAll('.custom-checkbox').forEach(cb => {
            cb.addEventListener('click', (e) => {
                const id = parseFloat(e.target.dataset.id);
                this.toggleTask(id);
            });
        });

        document.querySelectorAll('.delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseFloat(e.target.dataset.id);
                this.deleteTask(id);
            });
        });
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        this.animateNumber('totalTasks', total);
        this.animateNumber('completedTasks', completed);
        this.animateNumber('pendingTasks', pending);
    }

    animateNumber(elementId, target) {
        const element = document.getElementById(elementId);
        const current = parseInt(element.textContent) || 0;
        const step = Math.ceil(Math.abs(target - current) / 10);
        
        if (current < target) {
            const timer = setInterval(() => {
                const newVal = parseInt(element.textContent) + step;
                if (newVal >= target) {
                    element.textContent = target;
                    clearInterval(timer);
                } else {
                    element.textContent = newVal;
                }
            }, 30);
        } else if (current > target) {
            element.textContent = target;
        }
    }

    bindEvents() {
        // Quick add
        const quickInput = document.getElementById('quickInput');
        quickInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask(quickInput.value);
                quickInput.value = '';
            }
        });

        // Modal
        const modal = new ModalManager(this);
        
        // Accordion
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                const isActive = header.classList.contains('active');

                document.querySelectorAll('.accordion-header').forEach(h => {
                    h.classList.remove('active');
                    h.nextElementSibling.classList.remove('active');
                });

                if (!isActive) {
                    header.classList.add('active');
                    content.classList.add('active');
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                modal.open();
            }
        });
    }

    enableCardMouseTracking() {
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                card.style.setProperty('--mouse-x', `${x}%`);
                card.style.setProperty('--mouse-y', `${y}%`);
            });
        });
    }

    bindStatFilters() {
        const statItems = document.querySelectorAll('.stat-item.clickable');
        const filterIndicator = document.getElementById('filterIndicator');
        
        statItems.forEach(item => {
            item.addEventListener('click', () => {
                const filter = item.dataset.filter;
                
                // Update current filter
                this.currentFilter = filter;
                
                // Update active state on stat items
                statItems.forEach(s => s.classList.remove('active'));
                item.classList.add('active');
                
                // Update filter indicator
                const filterText = {
                    'all': 'All Tasks',
                    'completed': 'Completed Tasks',
                    'pending': 'Pending Tasks'
                };
                
                filterIndicator.textContent = `Showing: ${filterText[filter]}`;
                filterIndicator.classList.add('active');
                
                // Re-render with filter
                this.render();
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

class ModalManager {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.overlay = document.getElementById('modalOverlay');
        this.input = document.getElementById('modalInput');
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('openModalBtn').addEventListener('click', () => this.open());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.close());
        document.getElementById('addTaskBtn').addEventListener('click', () => this.submit());
        
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submit();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
                this.close();
            }
        });
    }

    open() {
        this.overlay.classList.add('active');
        this.input.value = '';
        setTimeout(() => this.input.focus(), 100);
    }

    close() {
        this.overlay.classList.remove('active');
    }

    submit() {
        this.taskManager.addTask(this.input.value);
        this.close();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ProductivityManager();
});
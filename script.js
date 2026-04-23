// Savvy - Personal Finance Tracker
class FinanceTracker {
    constructor() {
        this.transactions = this.loadTransactions();
        this.recycleBin = this.loadRecycleBin();
        this.spendingChart = null;
        this.dailyChart = null;
        this.yearlyChart = null;
        this.currentFilter = 'full';
        this.editingId = null;
        this.confirmCallback = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initCharts();
        this.updateSummary();
        this.renderTransactions();
        this.updateCharts();
        this.checkBalanceWarning();
        this.cleanupRecycleBin();
    }

    initCharts() {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateSpendingChart();
            this.updateDailyChart();
            this.updateYearlyChart();
        }, 100);
    }

    // Local Storage Management
    loadTransactions() {
        const stored = localStorage.getItem('financeTransactions');
        return stored ? JSON.parse(stored) : [];
    }

    saveTransactions() {
        localStorage.setItem('financeTransactions', JSON.stringify(this.transactions));
    }

    loadRecycleBin() {
        const stored = localStorage.getItem('financeRecycleBin');
        return stored ? JSON.parse(stored) : [];
    }

    saveRecycleBin() {
        localStorage.setItem('financeRecycleBin', JSON.stringify(this.recycleBin));
    }

    // Event Listeners
    setupEventListeners() {
        const form = document.getElementById('transactionForm');
        const categorySelect = document.getElementById('category');
        const customCategoryInput = document.getElementById('customCategory');
        const timeFilter = document.getElementById('timeFilter');
        const clearBtn = document.getElementById('clearAll');
        const toggleBin = document.getElementById('toggleBin');
        const toggleTransactions = document.getElementById('toggleTransactions');
        const editForm = document.getElementById('editForm');
        const closeDangerAlert = document.getElementById('closeDangerAlert');

        // Form submission
        form.addEventListener('submit', (e) => this.handleAddTransaction(e));
        
        // Category handling
        categorySelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                customCategoryInput.style.display = 'block';
                customCategoryInput.required = true;
            } else {
                customCategoryInput.style.display = 'none';
                customCategoryInput.required = false;
                customCategoryInput.value = '';
            }
        });

        // Time filter
        timeFilter.addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.updateCharts();
        });

        // Clear all
        clearBtn.addEventListener('click', () => this.showConfirmModal(
            'Clear All Transactions',
            'Are you sure you want to delete all transactions? This action cannot be undone.',
            () => this.clearAllTransactions()
        ));

        // Toggle bin view
        toggleBin.addEventListener('click', () => this.showBinView());
        toggleTransactions.addEventListener('click', () => this.showTransactionsView());

        // Edit form
        editForm.addEventListener('submit', (e) => this.handleEditTransaction(e));

        // Modal controls
        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal('confirmModal'));
        document.getElementById('editCancel').addEventListener('click', () => this.hideModal('editModal'));
        document.getElementById('modalConfirm').addEventListener('click', () => {
            if (this.confirmCallback) {
                this.confirmCallback();
                this.hideModal('confirmModal');
            }
        });

        // Danger alert close
        closeDangerAlert.addEventListener('click', () => this.hideDangerAlert());
    }

    // Transaction Management
    handleAddTransaction(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        let category = formData.get('category');
        
        // Handle custom category
        if (category === 'custom') {
            category = formData.get('customCategory');
        }

        const description = formData.get('description');
        const amount = parseFloat(formData.get('amount'));
        const type = formData.get('type');

        // Check for duplicate transaction (same description AND same category)
        const duplicateIndex = this.transactions.findIndex(t => 
            t.description.toLowerCase().trim() === description.toLowerCase().trim() && 
            t.category.toLowerCase().trim() === category.toLowerCase().trim()
        );

        if (duplicateIndex !== -1) {
            // Update existing transaction instead of creating new one
            const existingTransaction = this.transactions[duplicateIndex];
            existingTransaction.amount += amount;
            existingTransaction.date = new Date().toISOString(); // Update last modified date
            
            this.saveTransactions();
            this.updateUI();
            this.highlightTransaction(existingTransaction.id);
            this.showToast('Transaction merged successfully!');
        } else {
            // Create new transaction
            const transaction = {
                id: Date.now(),
                description: description,
                amount: amount,
                category: category,
                type: type,
                date: new Date().toISOString()
            };

            this.transactions.unshift(transaction);
            this.saveTransactions();
            this.updateUI();
            this.showToast('Transaction added successfully!');
        }

        // Check financial danger zone for expenses
        if (type === 'expense') {
            this.checkFinancialDangerZone();
        }

        e.target.reset();
        
        // Reset custom category input
        document.getElementById('customCategory').style.display = 'none';
        document.getElementById('customCategory').required = false;
    }

    editTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (!transaction) return;

        this.editingId = id;
        document.getElementById('editDescription').value = transaction.description;
        this.showModal('editModal');
    }

    handleEditTransaction(e) {
        e.preventDefault();
        
        const description = document.getElementById('editDescription').value;
        
        const transactionIndex = this.transactions.findIndex(t => t.id === this.editingId);
        if (transactionIndex !== -1) {
            this.transactions[transactionIndex].description = description;
            this.saveTransactions();
            this.updateUI();
            this.hideModal('editModal');
            this.showToast('Transaction updated successfully!');
        }
    }

    deleteTransaction(id) {
        this.showConfirmModal(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            () => this.moveToRecycleBin(id)
        );
    }

    moveToRecycleBin(id) {
        const transactionIndex = this.transactions.findIndex(t => t.id === id);
        if (transactionIndex !== -1) {
            const transaction = this.transactions.splice(transactionIndex, 1)[0];
            transaction.deletedAt = new Date().toISOString();
            this.recycleBin.push(transaction);
            
            this.saveTransactions();
            this.saveRecycleBin();
            this.updateUI();
            this.showToast('Transaction moved to Recycle Bin');
        }
    }

    restoreTransaction(id) {
        const binIndex = this.recycleBin.findIndex(t => t.id === id);
        if (binIndex !== -1) {
            const transaction = this.recycleBin.splice(binIndex, 1)[0];
            delete transaction.deletedAt;
            this.transactions.unshift(transaction);
            
            this.saveTransactions();
            this.saveRecycleBin();
            this.updateUI();
            this.showToast('Transaction restored successfully!');
        }
    }

    clearAllTransactions() {
        this.transactions = [];
        this.saveTransactions();
        this.updateUI();
        this.showToast('All transactions cleared');
    }

    // UI Updates
    updateUI() {
        this.updateSummary();
        this.renderTransactions();
        this.updateCharts();
        this.checkBalanceWarning();
    }

    updateSummary() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;

        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(expenses);
        document.getElementById('balance').textContent = this.formatCurrency(balance);
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        
        if (this.transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 14l2 2 4-4"/>
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <p>No transactions yet</p>
                    <p class="empty-subtitle">Add your first transaction to get started</p>
                </div>
            `;
            return;
        }

        const transactionsHTML = this.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                    <div class="transaction-category">${this.escapeHtml(transaction.category)}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="transaction-edit" onclick="tracker.editTransaction(${transaction.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="transaction-delete" onclick="tracker.deleteTransaction(${transaction.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = transactionsHTML;
    }

    renderRecycleBin() {
        const container = document.getElementById('binList');
        
        if (this.recycleBin.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    <p>Recycle Bin is empty</p>
                    <p class="empty-subtitle">Deleted items will appear here for 7 days</p>
                </div>
            `;
            return;
        }

        const binHTML = this.recycleBin.map(transaction => {
            const daysLeft = this.getDaysLeft(transaction.deletedAt);
            const isExpired = daysLeft <= 0;
            
            return `
                <div class="transaction-item ${isExpired ? 'expired' : ''}">
                    <div class="transaction-info">
                        <div class="transaction-description">${this.escapeHtml(transaction.description)}</div>
                        <div class="transaction-category">${this.escapeHtml(transaction.category)}</div>
                        <div class="transaction-meta">
                            ${isExpired ? 'Expired' : `${daysLeft} days left`}
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </div>
                    <div class="transaction-actions">
                        ${!isExpired ? `
                            <button class="btn-restore" onclick="tracker.restoreTransaction(${transaction.id})">
                                Restore
                            </button>
                        ` : '<span class="expired-text">Auto-deleted</span>'}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = binHTML;
    }

    updateCharts() {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateSpendingChart();
            this.updateDailyChart();
            this.updateYearlyChart();
        }, 100);
    }

    updateSpendingChart() {
        const canvas = document.getElementById('spendingChart');
        if (!canvas) {
            console.error('Spending chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for spending chart');
            return;
        }
        
        // Filter transactions based on time filter
        const filteredTransactions = this.getFilteredTransactions();
        
        // Get expense data by category
        const expensesByCategory = {};
        filteredTransactions
            .filter(t => t.type === 'expense')
            .forEach(transaction => {
                if (!expensesByCategory[transaction.category]) {
                    expensesByCategory[transaction.category] = 0;
                }
                expensesByCategory[transaction.category] += transaction.amount;
            });

        const labels = Object.keys(expensesByCategory);
        const data = Object.values(expensesByCategory);

        // Blue/Purple theme color palette
        const colors = [
            '#9C27B0', // Deep Purple
            '#7B1FA2', // Medium Purple
            '#2196F3', // Royal Blue
            '#1976D2', // Dark Blue
            '#03A9F4', // Sky Blue
            '#00BCD4', // Cyan
            '#E91E63', // Pink
            '#FF9800', // Orange
            '#4CAF50', // Green
            '#FF5722'  // Deep Orange
        ];

        // Destroy existing chart instance
        if (this.spendingChart) {
            this.spendingChart.destroy();
            this.spendingChart = null;
        }

        if (labels.length === 0) {
            // Create empty chart with placeholder data
            labels.push('No Data');
            data.push(0);
        }

        try {
            this.spendingChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        hoverBorderWidth: 3,
                        hoverBorderColor: '#9C27B0'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: { size: 12, family: 'Segoe UI' },
                                color: '#212121',
                                generateLabels: function(chart) {
                                    const data = chart.data;
                                    if (data.labels.length && data.datasets.length) {
                                        return data.labels.map((label, i) => {
                                            const dataset = data.datasets[0];
                                            const value = dataset.data[i];
                                            return {
                                                text: `${label}: $${value.toFixed(2)}`,
                                                fillStyle: dataset.backgroundColor[i],
                                                hidden: false,
                                                index: i
                                            };
                                        });
                                    }
                                    return [];
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            borderColor: '#9C27B0',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true,
                        duration: 1000
                    }
                }
            });
        } catch (error) {
            console.error('Error creating spending chart:', error);
        }
    }

    updateDailyChart() {
        const canvas = document.getElementById('dailyChart');
        if (!canvas) {
            console.error('Daily chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for daily chart');
            return;
        }
        
        // Get daily spending for current month
        const dailySpending = {};
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Initialize days 1-30
        for (let i = 1; i <= 30; i++) {
            dailySpending[i] = 0;
        }
        
        this.transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === currentMonth && 
                       date.getFullYear() === currentYear;
            })
            .forEach(transaction => {
                const day = new Date(transaction.date).getDate();
                if (day <= 30) {
                    dailySpending[day] += transaction.amount;
                }
            });

        const labels = Object.keys(dailySpending);
        const data = Object.values(dailySpending);

        // Destroy existing chart instance
        if (this.dailyChart) {
            this.dailyChart.destroy();
            this.dailyChart = null;
        }

        try {
            this.dailyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Daily Spending',
                        data: data,
                        borderColor: '#03A9F4', // Sky Blue
                        backgroundColor: 'rgba(3, 169, 244, 0.1)', // Light Sky Blue
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#03A9F4',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#2196F3', // Royal Blue on hover
                        pointHoverBorderColor: '#FFFFFF',
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#FFFFFF',
                            borderColor: '#03A9F4',
                            borderWidth: 1,
                            callbacks: {
                                title: function(context) {
                                    return `Day ${context[0].label}`;
                                },
                                label: function(context) {
                                    return `Spent: $${context.parsed.y.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#757575',
                                font: {
                                    size: 11
                                },
                                maxTicksLimit: 15
                            },
                            title: {
                                display: true,
                                text: 'Day of Month',
                                color: '#212121',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                color: '#757575',
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return '$' + value.toFixed(0);
                                }
                            },
                            title: {
                                display: true,
                                text: 'Amount ($)',
                                color: '#212121',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            });
        } catch (error) {
            console.error('Error creating daily chart:', error);
        }
    }

    updateYearlyChart() {
        const canvas = document.getElementById('yearlyChart');
        if (!canvas) {
            console.error('Yearly chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context for yearly chart');
            return;
        }
        
        // Get monthly savings for the year
        const monthlySavings = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentYear = new Date().getFullYear();
        
        // Initialize months
        months.forEach((month, index) => {
            monthlySavings[month] = 0;
        });
        
        this.transactions
            .filter(t => new Date(t.date).getFullYear() === currentYear)
            .forEach(transaction => {
                const monthIndex = new Date(transaction.date).getMonth();
                const monthName = months[monthIndex];
                
                if (transaction.type === 'income') {
                    monthlySavings[monthName] += transaction.amount;
                } else {
                    monthlySavings[monthName] -= transaction.amount;
                }
            });

        const labels = months;
        const data = months.map(month => monthlySavings[month]);

        if (this.yearlyChart) {
            this.yearlyChart.destroy();
        }

        this.yearlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Savings',
                    data: data,
                    backgroundColor: data.map(value => value >= 0 ? '#4CAF50' : '#F44336'),
                    borderColor: data.map(value => value >= 0 ? '#45A049' : '#D32F2F'),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(0);
                            }
                        }
                    }
                }
            }
        });
    }

    // Utility Functions
    getFilteredTransactions() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        switch (this.currentFilter) {
            case 'week1':
                return this.transactions.filter(t => {
                    const date = new Date(t.date);
                    const dayOfMonth = date.getDate();
                    return date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear && 
                           dayOfMonth >= 1 && dayOfMonth <= 7;
                });
            case 'week2':
                return this.transactions.filter(t => {
                    const date = new Date(t.date);
                    const dayOfMonth = date.getDate();
                    return date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear && 
                           dayOfMonth >= 8 && dayOfMonth <= 14;
                });
            case 'week3':
                return this.transactions.filter(t => {
                    const date = new Date(t.date);
                    const dayOfMonth = date.getDate();
                    return date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear && 
                           dayOfMonth >= 15 && dayOfMonth <= 21;
                });
            case 'week4':
                return this.transactions.filter(t => {
                    const date = new Date(t.date);
                    const dayOfMonth = date.getDate();
                    return date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear && 
                           dayOfMonth >= 22;
                });
            default:
                return this.transactions.filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear;
                });
        }
    }

    getDaysLeft(deletedAt) {
        const deletedDate = new Date(deletedAt);
        const now = new Date();
        const diffTime = deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000) - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    cleanupRecycleBin() {
        const now = new Date();
        this.recycleBin = this.recycleBin.filter(transaction => {
            const deletedDate = new Date(transaction.deletedAt);
            const daysDiff = (now - deletedDate) / (1000 * 60 * 60 * 24);
            return daysDiff < 7;
        });
        this.saveRecycleBin();
    }

    checkBalanceWarning() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const balance = income - expenses;
        
        if (balance < 500 && balance > 0) {
            this.showToast('⚠️ Careful! You are about to finish your salary!', 'warning');
        }
    }

    // View Management
    showTransactionsView() {
        document.getElementById('transactionsSection').style.display = 'block';
        document.getElementById('binSection').style.display = 'none';
    }

    showBinView() {
        document.getElementById('transactionsSection').style.display = 'none';
        document.getElementById('binSection').style.display = 'block';
        this.renderRecycleBin();
    }

    // Modal Management
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showConfirmModal(title, message, callback) {
        this.confirmCallback = callback;
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;
        this.showModal('confirmModal');
    }

    // Utility Functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type === 'warning' ? 'warning' : ''}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    checkFinancialDangerZone() {
        const totalSalary = this.transactions
            .filter(t => t.type === 'income' && t.category.toLowerCase() === 'salary')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const remainingBalance = totalIncome - totalExpenses;
        
        // Use total salary if available, otherwise use total income
        const referenceAmount = totalSalary > 0 ? totalSalary : totalIncome;
        
        if (referenceAmount > 0) {
            const remainingPercentage = (remainingBalance / referenceAmount) * 100;
            
            if (remainingPercentage < 5 && remainingPercentage > 0) {
                this.showDangerAlert('5% Rule: You have less than 5% of your salary remaining!');
            }
        }
    }

    highlightTransaction(id) {
        // Remove existing highlights
        document.querySelectorAll('.transaction-item').forEach(item => {
            item.classList.remove('highlighted');
        });
        
        // Add highlight to the updated transaction
        setTimeout(() => {
            const transactionElements = document.querySelectorAll('.transaction-item');
            transactionElements.forEach((element, index) => {
                if (index < this.transactions.length && this.transactions[index].id === id) {
                    element.classList.add('highlighted');
                    // Remove highlight after animation completes
                    setTimeout(() => {
                        element.classList.remove('highlighted');
                    }, 2000);
                }
            });
        }, 100);
    }

    showDangerAlert(message) {
        const dangerAlert = document.getElementById('dangerAlert');
        const dangerMessage = document.getElementById('dangerMessage');
        
        dangerMessage.textContent = message;
        dangerAlert.classList.add('show');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideDangerAlert();
        }, 10000);
    }

    hideDangerAlert() {
        const dangerAlert = document.getElementById('dangerAlert');
        dangerAlert.classList.remove('show');
    }
}

// Initialize tracker when DOM is loaded
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new FinanceTracker();
});

// Make tracker globally accessible for inline event handlers
window.tracker = tracker;

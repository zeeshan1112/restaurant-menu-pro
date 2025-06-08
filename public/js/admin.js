document.addEventListener('DOMContentLoaded', () => {
    // Return to login if not authenticated
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
        window.location.href = '/login.html';
        return;
    }

    // --- DOM ELEMENTS & STATE ---
    // Common elements
    const logoutButton = document.getElementById('logout-button');
    const adminTabsContainer = document.getElementById('admin-tabs');

    // Page-specific elements (will be checked for existence)
    const toastNotification = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout;
    const adminMenuList = document.getElementById('admin-menu-list');
    const saveAllButton = document.getElementById('save-all-changes');
    const addItemForm = document.getElementById('add-item-form');
    const addCategoryForm = document.getElementById('add-category-form');
    const categoryListDiv = document.getElementById('category-list');
    const addItemCategorySelect = document.getElementById('item-category-select');
    const addItemDietarySelect = document.getElementById('item-dietary-select');
    let menuData = [];
    let categoriesData = [];
    let isMenuDirty = false;
    let isCategoriesDirty = false;

    // --- COMMON LOGIC (Logout) ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isAdminAuthenticated');
            window.location.href = '/login.html';
        });
    }

    // --- PUBLISH BUTTON STATE LOGIC ---
    const updatePublishButtonState = () => {
        if (saveAllButton) {
            if (isMenuDirty || isCategoriesDirty) {
                saveAllButton.disabled = false;
                saveAllButton.classList.remove('opacity-50', 'cursor-not-allowed');
            } else {
                saveAllButton.disabled = true;
                saveAllButton.classList.add('opacity-50', 'cursor-not-allowed');
            }
        }
    }

    // --- TAB NAVIGATION LOGIC ---
    if (adminTabsContainer) {
        const tabs = adminTabsContainer.querySelectorAll('.admin-tab');
        const tabContents = document.querySelectorAll('.admin-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Deactivate all tabs
                tabs.forEach(t => {
                    t.classList.remove('border-amber-500', 'text-amber-600');
                    t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                    t.removeAttribute('aria-current');
                });

                // Activate clicked tab
                tab.classList.add('border-amber-500', 'text-amber-600');
                tab.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                tab.setAttribute('aria-current', 'page');

                // Hide all tab contents
                tabContents.forEach(content => content.classList.add('hidden'));

                // Show target tab content
                const targetId = tab.dataset.tabTarget;
                const targetContent = document.querySelector(targetId);
                if (targetContent) {
                    targetContent.classList.remove('hidden');
                }
            });
        });
    }

    // --- TOAST NOTIFICATION LOGIC ---
    const showToast = (message, type = 'info', duration = 3000) => {
        if (!toastNotification || !toastMessage) return;

        clearTimeout(toastTimeout); // Clear any existing timeout

        toastMessage.textContent = message;
        toastNotification.classList.remove('bg-green-500', 'bg-red-500', 'bg-blue-500', 'opacity-0', '-translate-y-10', 'pointer-events-none');
        toastNotification.classList.add('pointer-events-auto');

        if (type === 'success') {
            toastNotification.classList.add('bg-green-500');
        } else if (type === 'error') {
            toastNotification.classList.add('bg-red-500');
        } else { // info or default
            toastNotification.classList.add('bg-blue-500');
        }

        // Animate in
        toastNotification.classList.remove('opacity-0', '-translate-y-10');
        toastNotification.classList.add('opacity-100', 'translate-y-0');

        if (duration > 0) {
            toastTimeout = setTimeout(() => {
                toastNotification.classList.remove('opacity-100', 'translate-y-0');
                toastNotification.classList.add('opacity-0', '-translate-y-10', 'pointer-events-none');
            }, duration);
        }
    };

    // --- HELPER & RENDER FUNCTIONS ---
    const populateCategoryDropdown = (selectElement, selectedValue) => {
        selectElement.innerHTML = '';
        if (!Array.isArray(categoriesData)) return;
        categoriesData.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === selectedValue) { option.selected = true; }
            selectElement.appendChild(option);
        });
    };

    const renderCategoryList = () => {
        if (!categoryListDiv || !Array.isArray(categoriesData)) return;
        categoryListDiv.innerHTML = categoriesData.map(cat => 
            `<div class="flex items-center justify-between py-1 text-gray-700">
                <span>${cat}</span>
                <button data-category-name="${cat}" class="delete-category-btn text-red-600 hover:text-red-500 text-xs font-semibold uppercase">Remove</button>
            </div>`
        ).join('');
        // Only populate addItemCategorySelect if it exists (i.e., on add-item.html)
        if (addItemCategorySelect) {
            populateCategoryDropdown(addItemCategorySelect);
        }
    };

    const renderAdminMenu = () => {
        if (!adminMenuList) return; // Only render if the list element exists
        adminMenuList.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'hidden md:grid md:grid-cols-6 gap-4 items-center border-b-2 border-gray-300 pb-2 font-bold text-sm text-gray-500 uppercase tracking-wider';
        header.innerHTML = `<span>Name</span><span>Category</span><span>Price</span><span>Dietary</span><span>Status</span><span>Action</span>`;
        adminMenuList.appendChild(header);

        if (!Array.isArray(menuData) || menuData.length === 0) return;
        menuData.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'grid grid-cols-1 md:grid-cols-6 gap-4 items-center border-b border-gray-300 py-4';
            
            const commonInputClasses = 'w-full px-3 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg focus:ring-amber-500 focus:border-amber-500 transition';

            itemDiv.innerHTML = `
                <input type="text" value="${item.name}" data-index="${index}" data-field="name" class="${commonInputClasses}">
                <div class="category-select-wrapper"></div>
                <input type="number" step="0.01" value="${item.price}" data-index="${index}" data-field="price" class="${commonInputClasses}">
                <div class="dietary-select-wrapper"></div>
                <div class="status-select-wrapper"></div>
                <div class="flex items-center justify-end">
                    <button class="delete-btn bg-red-600 text-white text-xs font-bold uppercase px-3 py-2 rounded-md hover:bg-red-700 transition-colors" data-index="${index}">Delete</button>
                </div>
            `;

            const categorySelect = document.createElement('select');
            categorySelect.className = commonInputClasses; categorySelect.dataset.index = index; categorySelect.dataset.field = 'category';
            populateCategoryDropdown(categorySelect, item.category);
            itemDiv.querySelector('.category-select-wrapper').replaceWith(categorySelect);

            const dietarySelect = document.createElement('select');
            dietarySelect.className = commonInputClasses; dietarySelect.dataset.index = index; dietarySelect.dataset.field = 'isVeg';
            dietarySelect.innerHTML = `<option value="true" ${item.isVeg ? 'selected' : ''}>Veg</option><option value="false" ${!item.isVeg ? 'selected' : ''}>Non-Veg</option>`;
            itemDiv.querySelector('.dietary-select-wrapper').replaceWith(dietarySelect);

            const availableSelect = document.createElement('select');
            availableSelect.className = commonInputClasses; availableSelect.dataset.index = index; availableSelect.dataset.field = 'isAvailable';
            availableSelect.innerHTML = `<option value="true" ${item.isAvailable ? 'selected' : ''}>Available</option><option value="false" ${!item.isAvailable ? 'selected' : ''}>Unavailable</option>`;
            itemDiv.querySelector('.status-select-wrapper').replaceWith(availableSelect);

            adminMenuList.appendChild(itemDiv);
        });
    };

    const saveData = async (dataType) => {
        const isMenu = dataType === 'menu';
        const endpoint = isMenu ? '/.netlify/functions/menu' : '/.netlify/functions/categories';
        const dataToSave = isMenu ? menuData : categoriesData;

        try {
            const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(dataToSave, null, 2) });
            if (!response.ok) {
                const errorData = await response.text(); // Try to get more error info
                throw new Error(`Failed to save ${dataType}. Server responded with: ${response.status} ${errorData}`);
            }
            // Return true on success for the caller to handle overall success message
            return true; 
        } catch (error) { 
            showToast(`Error saving ${dataType}. Check console.`, 'error');
            console.error(`Error in saveData for ${dataType}:`, error);
            return false; // Return false on failure
        }
    };

    const loadInitialData = async () => {
        try {
            const [menuResponse, categoriesResponse] = await Promise.all([fetch('/.netlify/functions/menu'), fetch('/.netlify/functions/categories')]);
            if (!menuResponse.ok || !categoriesResponse.ok) throw new Error('Failed to fetch initial data.');
            menuData = await menuResponse.json();
            categoriesData = await categoriesResponse.json();

            // Call render functions only if their target elements exist
            renderCategoryList();
            renderAdminMenu();
            // If on add-item page, populate its category dropdown initially
            if (addItemCategorySelect) {
                populateCategoryDropdown(addItemCategorySelect);
            }
            isMenuDirty = false; // Reset dirty flags after initial load
            isCategoriesDirty = false;
            updatePublishButtonState(); // Set initial state of publish button

        } catch (error) {
            const errorDisplayArea = adminMenuList || document.querySelector('main'); // Fallback to main
            if (errorDisplayArea) {
                errorDisplayArea.innerHTML = `<p class="text-red-600 font-medium col-span-full text-center">Could not load site data: ${error.message}</p>`;
            } else {
                showToast(`Could not load site data: ${error.message}`, 'error', 5000);
            }
        }
    };

    // --- PAGE-SPECIFIC EVENT LISTENERS & LOGIC ---
    // Ensure these are only attached if the elements exist on the current page

    // For Edit Menu Page (edit-menu.html)
    if (adminMenuList) {
        adminMenuList.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            if (index === undefined) return;
            const field = e.target.dataset.field;
            let value = e.target.value;
            if (field === 'isAvailable' || field === 'isVeg') { value = (e.target.value === 'true'); } 
            else if (e.target.type === 'number') { value = parseFloat(e.target.value); }
            menuData[index][field] = value;
            isMenuDirty = true;
            updatePublishButtonState();
        });

        adminMenuList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const index = e.target.dataset.index;
                if (confirm(`Delete "${menuData[index].name}"?`)) {
                    menuData.splice(index, 1);
                    renderAdminMenu();
                    isMenuDirty = true;
                    updatePublishButtonState();
                }
            }
        });
    }

    // For Edit Menu Page (edit-menu.html) - Save All Button
    if (saveAllButton) {
        saveAllButton.addEventListener('click', async () => {
            saveAllButton.textContent = 'Publishing...';
            saveAllButton.disabled = true;
            let menuSaveSuccess = false;
            let categorySaveSuccess = false;
            let overallSuccess = false;

            try {
                showToast('Publishing menu changes...', 'info', 0); // Indefinite info toast
                menuSaveSuccess = await saveData('menu');
                
                showToast('Publishing category changes...', 'info', 0); // Update info toast
                categorySaveSuccess = await saveData('categories');
                
                overallSuccess = menuSaveSuccess && categorySaveSuccess;
                if(overallSuccess) {
                    isMenuDirty = false; isCategoriesDirty = false;
                }
                showToast(overallSuccess ? 'All changes published successfully!' : 'Publishing completed. Some changes might not have been saved.', overallSuccess ? 'success' : 'error', 5000);

            } catch (error) {
                showToast('An unexpected error occurred during publishing.', 'error', 5000);
            } finally {
                saveAllButton.textContent = 'Publish All Changes';
                saveAllButton.disabled = false;
                updatePublishButtonState();
            }
        });
    }

    // For Manage Categories Page (manage-categories.html)
    if (categoryListDiv) {
        categoryListDiv.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-category-btn')) {
                const categoryToDelete = e.target.dataset.categoryName;
                if (menuData.some(item => item.category === categoryToDelete)) {
                    showToast(`Cannot delete "${categoryToDelete}" because it is in use by menu items.`, 'error', 4000);
                    return;
                }
                if (confirm(`Are you sure you want to delete the category "${categoryToDelete}"?`)) {
                    categoriesData = categoriesData.filter(cat => cat !== categoryToDelete);
                    showToast(`Category "${categoryToDelete}" removed. Publish to save changes.`, 'info');
                    isCategoriesDirty = true; updatePublishButtonState();
                    renderCategoryList();
                    // If adminMenuList exists (e.g., if this logic was on a combined page), update it.
                    if (adminMenuList) renderAdminMenu(); 
                }
            }
        });
    }

    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newCategoryInput = document.getElementById('new-category-name');
            const newCategory = newCategoryInput.value.trim();
            if (newCategory && !categoriesData.includes(newCategory)) {
                categoriesData.push(newCategory);
                categoriesData.sort();
                isCategoriesDirty = true; updatePublishButtonState();
                showToast(`Category "${newCategory}" added. Publish to save changes.`, 'info');
                renderCategoryList();
                // If adminMenuList exists, update it.
                if (adminMenuList) renderAdminMenu(); 
                newCategoryInput.value = '';
            } else if (!newCategory) {
                showToast('Category name cannot be empty.', 'error');
            } else {
                showToast(`Category "${newCategory}" already exists.`, 'error');
            }
        });
    }

    // For Add Item Page (add-item.html)
    if (addItemForm) {
        addItemForm.addEventListener('submit', (e) => { // No longer needs to be async
            e.preventDefault();
            const newName = document.getElementById('item-name').value;
            const newCategory = addItemCategorySelect ? addItemCategorySelect.value : ''; 
            const newDescription = document.getElementById('item-description').value;
            const newPrice = parseFloat(document.getElementById('item-price').value);
            const newIsVeg = addItemDietarySelect ? addItemDietarySelect.value === 'true' : true; 

            if (!newName || !newCategory || !newDescription || isNaN(newPrice)) {
                showToast('Please fill out all fields correctly to add an item.', 'error');
                return;
            }

            const newItem = { 
                name: newName, 
                description: newDescription, 
                price: newPrice, 
                category: newCategory, 
                isAvailable: true, // Default to available
                isVeg: newIsVeg, 
                image: `https://placehold.co/600x400/333333/FBBF24?text=${encodeURIComponent(newName)}` // Use encodeURIComponent
            };
            menuData.push(newItem);
            showToast(`Item "${newName}" added. Publish to save changes.`, 'info');
            isMenuDirty = true; updatePublishButtonState();
            // After successfully saving, re-render the menu list
            // to reflect the newly added item in the "Update Menu" tab.
            if (adminMenuList) renderAdminMenu();
            e.target.reset();
            if (addItemCategorySelect) populateCategoryDropdown(addItemCategorySelect); // Repopulate to reset selection
        });
    }

    loadInitialData();
});
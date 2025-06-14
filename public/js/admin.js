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
    const globalAddItemButton = document.getElementById('global-add-item-button');
    const saveAllButton = document.getElementById('save-all-changes');
    // const addItemForm = document.getElementById('add-item-form'); // Removed
    const addCategoryForm = document.getElementById('add-category-form');
    const categoryListDiv = document.getElementById('category-list');
    // const addItemCategorySelect = document.getElementById('item-category-select'); // Removed, use modal's select
    // Site Settings Elements
    const siteSettingsForm = document.getElementById('site-settings-form');
    const accentColorPicker = document.getElementById('accent-color-picker');
    const accentColorHexInput = document.getElementById('accent-color-hex');
    const announcementTextInput = document.getElementById('announcement-text-input');
    const enableAnnouncementCheckbox = document.getElementById('enable-announcement-checkbox');
    // const addItemDietarySelect = document.getElementById('item-dietary-select'); // Removed, use modal's select
    const adminBrandTitle = document.getElementById('admin-brand-title');

    // Modal Elements
    const addItemModal = document.getElementById('add-edit-item-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalItemForm = document.getElementById('modal-item-form');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalCancelButton = document.getElementById('modal-cancel-button');
    // Modal form fields will be selected inside functions as needed or globally if preferred

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
                const currentAccentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();

                tabs.forEach(t => {
                    t.style.borderColor = 'transparent'; // Use style for dynamic color
                    t.style.color = ''; // Revert to CSS class color
                    t.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                    t.classList.remove('text-amber-600'); // Remove old hardcoded class if any
                    t.removeAttribute('aria-current');
                });

                // Activate clicked tab
                tab.style.borderColor = currentAccentColor;
                tab.style.color = currentAccentColor; // Or a darker shade if preferred
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

    // Helper function to determine text color (black or white) based on background
    // (Copied from main.js for use in admin panel)
    const getTextColorForBackground = (hexBgColor) => {
        if (!hexBgColor) return '#FFFFFF'; // Default to white if no color provided

        const hex = hexBgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate luminance using the YIQ formula
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF'; // Return black for light backgrounds, white for dark
    };

    // --- DYNAMIC ACCENT COLOR APPLICATION (ADMIN) ---
    const applyAccentColorToAdmin = (color, hoverColor) => {
        document.documentElement.style.setProperty('--accent-color', color);
        document.documentElement.style.setProperty('--accent-color-hover', hoverColor);
        
        // Style for all .btn-primary elements.
        // Their background color is assumed to be var(--accent-color) via CSS,
        // or explicitly set for specific buttons like 'saveAllButton'.
        // We will now make their text color adaptive.
        const adaptiveTextColor = getTextColorForBackground(color);
        document.querySelectorAll('.btn-primary').forEach(button => {
            if (button.id === 'save-all-changes') { // This is the saveAllButton (Publish button)
                button.style.backgroundColor = color; // Explicitly set background for this one
            }
            button.style.color = adaptiveTextColor; 
        });

        if (adminBrandTitle) {
            adminBrandTitle.style.color = color;
        }
        // Active tab styling is handled by CSS variables or direct style in tab click handler
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
        ).join('') || '<p class="text-gray-500">No categories yet. Add one!</p>';
        // The modal's category select will be populated when the modal opens.
    };

    // Store the index of the item being edited, null if adding new
    let editingItemIndex = null; 
    
    const renderAdminMenu = () => {
        if (!adminMenuList) return; // Only render if the list element exists
        adminMenuList.innerHTML = '';
        // Desktop header
        const desktopHeader = document.createElement('div');
        desktopHeader.className = 'hidden md:grid md:grid-cols-6 gap-x-3 items-center border-b-2 border-gray-300 pb-2 font-bold text-sm text-gray-500 uppercase tracking-wider';
        desktopHeader.innerHTML = `<span>Name</span><span>Category</span><span>Price</span><span>Dietary</span><span>Status</span><span class="text-right">Actions</span>`;
        adminMenuList.appendChild(desktopHeader);

        if (!Array.isArray(menuData) || menuData.length === 0) return;
        menuData.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            // Adjusted grid for edit/delete buttons
            // Mobile: 2 columns (info, actions). Desktop: 6 columns. Further reduced vertical padding.
            itemDiv.className = 'grid grid-cols-[1fr_auto] md:grid-cols-6 gap-x-2 sm:gap-x-3 gap-y-1.5 sm:gap-y-1 items-center border-b border-gray-300 py-1 sm:py-2';

            itemDiv.innerHTML = `
                <!-- Mobile: Combined info, Desktop: Separate spans -->
                <div class="md:col-span-1"> <!-- Name for Desktop -->
                    <span class="font-medium text-gray-700 text-sm sm:text-base">${item.name}</span>
                    <div class="text-xs text-gray-500 md:hidden"> <!-- Category, Price for Mobile -->
                        ${item.category} &bull; ₹${parseFloat(item.price).toFixed(2)} &bull; ${item.isVeg ? 'Veg' : 'Non-Veg'} &bull; <span class="${item.isAvailable ? 'text-green-500' : 'text-red-500'}">${item.isAvailable ? 'Available' : 'Unavailable'}</span>
                    </div>
                </div>
                <span class="hidden md:inline-block text-gray-600 text-sm">${item.category}</span>
                <span class="hidden md:inline-block text-gray-600 text-sm">₹${parseFloat(item.price).toFixed(2)}</span>
                <span class="hidden md:inline-block text-gray-600 text-sm">${item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                <span class="hidden md:inline-block ${item.isAvailable ? 'text-green-600' : 'text-red-500'} text-sm font-semibold ">${item.isAvailable ? 'Available' : 'Unavailable'}</span>
                <div class="flex items-center justify-end space-x-0.5 sm:space-x-1 md:col-span-1">
                    <button class="edit-item-btn text-amber-600 hover:text-amber-500 p-1 sm:p-1.5 rounded hover:bg-amber-100 transition-colors" data-index="${index}" title="Edit Item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button class="delete-item-btn text-red-600 hover:text-red-500 p-1 sm:p-1.5 rounded hover:bg-red-100 transition-colors" data-index="${index}" title="Delete Item">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            `;
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
            await loadAndApplySiteSettings(); // Load site settings including accent color
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

    // --- MODAL LOGIC ---
    const openItemModal = (index = null) => {
        editingItemIndex = index;
        const modalItemCategorySelect = document.getElementById('modal-item-category-select');
        const modalItemName = document.getElementById('modal-item-name');
        const modalItemDescription = document.getElementById('modal-item-description');
        const modalItemPrice = document.getElementById('modal-item-price');
        const modalItemDietarySelect = document.getElementById('modal-item-dietary-select');
        const modalItemIsAvailableSelect = document.getElementById('modal-item-is-available-select');
        const modalItemImage = document.getElementById('modal-item-image');

        if (index !== null && menuData[index]) { // Editing existing item
            const item = menuData[index];
            modalTitle.textContent = 'Edit Menu Item';
            document.getElementById('modal-item-index').value = index;
            modalItemName.value = item.name;
            populateCategoryDropdown(modalItemCategorySelect, item.category);
            modalItemDescription.value = item.description;
            modalItemPrice.value = item.price;
            modalItemDietarySelect.value = item.isVeg.toString();
            modalItemIsAvailableSelect.value = item.isAvailable.toString();
            modalItemImage.value = item.image || '';
        } else { // Adding new item
            modalItemForm.reset(); // Clear form only when adding a new item
            modalTitle.textContent = 'Add New Menu Item';
            document.getElementById('modal-item-index').value = '';
            populateCategoryDropdown(modalItemCategorySelect); // Populate with no preselection
        }
        addItemModal.classList.remove('hidden');
    };

    const closeItemModal = () => {
        addItemModal.classList.add('hidden');
        editingItemIndex = null;
    };

    if (globalAddItemButton) {
        globalAddItemButton.addEventListener('click', () => openItemModal());
    }
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeItemModal);
    if (modalCancelButton) modalCancelButton.addEventListener('click', closeItemModal);

    // Handle click outside modal to close (optional)
    if (addItemModal) {
        addItemModal.addEventListener('click', (e) => {
            if (e.target === addItemModal) { // Check if the click is on the backdrop itself
                closeItemModal();
            }
        });
    }

    if (modalItemForm) {
        modalItemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('modal-item-name').value.trim();
            const category = document.getElementById('modal-item-category-select').value;
            const description = document.getElementById('modal-item-description').value.trim();
            const price = parseFloat(document.getElementById('modal-item-price').value);
            const isVeg = document.getElementById('modal-item-dietary-select').value === 'true';
            const isAvailable = document.getElementById('modal-item-is-available-select').value === 'true';
            let image = document.getElementById('modal-item-image').value.trim();

            if (!name || !category || !description || isNaN(price) || price < 0) {
                showToast('Please fill all required fields correctly.', 'error');
                return;
            }
            if (!image) { // Default placeholder if image is empty
                image = `https://placehold.co/600x400/333333/FBBF24?text=${encodeURIComponent(name)}`;
            }

            const itemData = { name, category, description, price, isVeg, isAvailable, image };

            if (editingItemIndex !== null) { // Update existing
                menuData[editingItemIndex] = { ...menuData[editingItemIndex], ...itemData };
                showToast(`Item "${name}" updated. Publish to save.`, 'info');
            } else { // Add new
                menuData.push(itemData);
                showToast(`Item "${name}" added. Publish to save.`, 'info');
            }
            isMenuDirty = true;
            updatePublishButtonState();
            renderAdminMenu();
            closeItemModal();
        });
    }

    // Event listener for Edit/Delete buttons on menu items
    if (adminMenuList) {
        adminMenuList.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.delete-item-btn');
            const editButton = e.target.closest('.edit-item-btn');

            if (deleteButton) {
                const index = deleteButton.dataset.index;
                if (confirm(`Are you sure you want to delete "${menuData[index].name}"?`)) {
                    menuData.splice(index, 1);
                    renderAdminMenu(); // Re-render the list
                    isMenuDirty = true;
                    updatePublishButtonState();
                    showToast('Item deleted. Publish to save changes.', 'info');
                }
            } else if (editButton) {
                const indexString = editButton.dataset.index;
                if (typeof indexString === 'string' && indexString.length > 0) {
                    const index = parseInt(indexString, 10); // Always specify radix 10
                    if (!isNaN(index)) {
                        openItemModal(index); // Open modal for editing
                    } else {
                        console.error("Failed to parse index for edit. Original data-index:", indexString);
                        showToast("Error: Could not edit item due to invalid item identifier.", "error");
                    }
                } else {
                    console.error("Failed to get valid index string for edit. data-index was:", indexString, "on button:", editButton);
                    showToast("Error: Could not edit item. Missing item identifier.", "error");
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
                saveAllButton.textContent = 'Publish';
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

    // --- SITE SETTINGS LOGIC ---
    const loadAndApplySiteSettings = async () => {
        try {
            const response = await fetch('/.netlify/functions/settings');
            if (!response.ok) throw new Error('Failed to fetch site settings.');
            const settings = await response.json();
            if (settings.accentColor && accentColorPicker && accentColorHexInput) {
                accentColorPicker.value = settings.accentColor;
                accentColorHexInput.value = settings.accentColor;
            }
            if (settings.announcementText !== undefined && announcementTextInput) {
                announcementTextInput.value = settings.announcementText;
            }
            if (settings.announcementEnabled !== undefined && enableAnnouncementCheckbox) {
                enableAnnouncementCheckbox.checked = settings.announcementEnabled;
            }
            applyAccentColorToAdmin(settings.accentColor, settings.accentColorHover);
        } catch (error) {
            console.error("Error loading site settings:", error);
            showToast('Could not load site settings.', 'error');
        }
    };

    // Ensure site settings are loaded which includes announcement fields

    if (siteSettingsForm && accentColorPicker && accentColorHexInput) {
        accentColorPicker.addEventListener('input', (e) => {
            accentColorHexInput.value = e.target.value;
        });
        accentColorHexInput.addEventListener('input', (e) => {
            if (/^#[0-9A-F]{6}$/i.test(e.target.value) || /^#[0-9A-F]{3}$/i.test(e.target.value)) {
                accentColorPicker.value = e.target.value;
            }
        });

        siteSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newAccentColor = accentColorHexInput.value;
            const announcementText = announcementTextInput ? announcementTextInput.value : '';
            const announcementEnabled = enableAnnouncementCheckbox ? enableAnnouncementCheckbox.checked : false;

            if (!newAccentColor || !/^#[0-9A-F]{6}$/i.test(newAccentColor)) {
                showToast('Please enter a valid 6-digit hex color (e.g., #F59E0B).', 'error');
                return;
            }

            const settingsToSave = {
                accentColor: newAccentColor,
                announcementText: announcementText,
                announcementEnabled: announcementEnabled
            };

            try {
                const response = await fetch('/.netlify/functions/settings', {
                    method: 'POST', // Body will now include announcement settings
                    body: JSON.stringify(settingsToSave) 
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Failed to save accent color.');
                                
                // Use the message from the server, which indicates if GitHub save was successful
                // and determine toast type based on whether the write to GitHub was successful (if not local dev)
                const toastType = result.writeAttemptedOnServer && !result.writeSuccessfulOnServer ? 'info' : 'success';
                showToast(result.message, toastType); 

                // Always apply to current session for immediate feedback
                if (result.settings) {
                    applyAccentColorToAdmin(result.settings.accentColor, result.settings.accentColorHover);
                    // No need to update announcement fields here as they don't have immediate visual admin UI impact beyond the form itself
                }
            } catch (error) {
                showToast(`Error saving accent color: ${error.message}`, 'error');
                console.error("Error saving accent color:", error);
            }
        });
    }
    loadInitialData();
});
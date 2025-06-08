document.addEventListener('DOMContentLoaded', () => {
    // Return to login if not authenticated
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
        window.location.href = '/login.html';
        return;
    }

    // --- DOM ELEMENTS & STATE ---
    const adminMenuList = document.getElementById('admin-menu-list');
    const saveAllButton = document.getElementById('save-all-changes');
    const addItemForm = document.getElementById('add-item-form');
    const logoutButton = document.getElementById('logout-button');
    const addCategoryForm = document.getElementById('add-category-form');
    const categoryListDiv = document.getElementById('category-list');
    const addItemCategorySelect = document.getElementById('item-category-select');
    const addItemDietarySelect = document.getElementById('item-dietary-select');
    let menuData = [];
    let categoriesData = [];

    // --- LOGOUT LOGIC ---
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminAuthenticated');
        alert('You have been logged out.');
        window.location.href = '/login.html';
    });

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
        if (!Array.isArray(categoriesData)) return;
        categoryListDiv.innerHTML = categoriesData.map(cat => 
            `<div class="flex items-center justify-between py-1 text-gray-700">
                <span>${cat}</span>
                <button data-category-name="${cat}" class="delete-category-btn text-red-600 hover:text-red-500 text-xs font-semibold uppercase">Remove</button>
            </div>`
        ).join('');
        populateCategoryDropdown(addItemCategorySelect);
    };

    const renderAdminMenu = () => {
        adminMenuList.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'hidden md:grid md:grid-cols-6 gap-4 items-center border-b-2 border-gray-300 pb-2 font-bold text-sm text-gray-500 uppercase tracking-wider';
        header.innerHTML = `<span>Name</span><span>Category</span><span>Price</span><span>Dietary</span><span>Status</span><span>Action</span>`;
        adminMenuList.appendChild(header);

        if (!Array.isArray(menuData)) return;
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
        const button = isMenu ? saveAllButton : null;
        if (button) { button.textContent = 'Saving...'; button.disabled = true; }
        try {
            const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(dataToSave, null, 2) });
            if (!response.ok) throw new Error(`Failed to save ${dataType}`);
            if (isMenu) alert('Menu Published Successfully!');
        } catch (error) { alert(`Error saving ${dataType}. Check console.`); } finally {
            if (button) { button.textContent = 'Publish All Changes'; button.disabled = false; }
        }
    };

    const loadInitialData = async () => {
        try {
            const [menuResponse, categoriesResponse] = await Promise.all([fetch('/.netlify/functions/menu'), fetch('/.netlify/functions/categories')]);
            if (!menuResponse.ok || !categoriesResponse.ok) throw new Error('Failed to fetch initial data.');
            menuData = await menuResponse.json();
            categoriesData = await categoriesResponse.json();
            renderCategoryList();
            renderAdminMenu();
        } catch (error) {
            adminMenuList.innerHTML = `<p class="text-red-600 font-medium">Could not load site data: ${error.message}</p>`;
        }
    };

    adminMenuList.addEventListener('change', (e) => {
        const index = e.target.dataset.index;
        if (index === undefined) return;
        const field = e.target.dataset.field;
        let value = e.target.value;
        if (field === 'isAvailable' || field === 'isVeg') { value = (e.target.value === 'true'); } 
        else if (e.target.type === 'number') { value = parseFloat(e.target.value); }
        menuData[index][field] = value;
    });

    adminMenuList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = e.target.dataset.index;
            if (confirm(`Delete "${menuData[index].name}"?`)) {
                menuData.splice(index, 1);
                renderAdminMenu();
            }
        }
    });

    categoryListDiv.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-category-btn')) {
            const categoryToDelete = e.target.dataset.categoryName;
            if (menuData.some(item => item.category === categoryToDelete)) {
                alert(`Cannot delete "${categoryToDelete}" because it is in use.`);
                return;
            }
            if (confirm(`Are you sure you want to delete the category "${categoryToDelete}"?`)) {
                categoriesData = categoriesData.filter(cat => cat !== categoryToDelete);
                await saveData('categories');
                renderCategoryList();
                renderAdminMenu();
            }
        }
    });

    addCategoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newCategoryInput = document.getElementById('new-category-name');
        const newCategory = newCategoryInput.value.trim();
        if (newCategory && !categoriesData.includes(newCategory)) {
            categoriesData.push(newCategory);
            categoriesData.sort();
            await saveData('categories');
            renderCategoryList();
            renderAdminMenu();
            newCategoryInput.value = '';
        } else {
            alert('Category is empty or already exists.');
        }
    });

    addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = document.getElementById('item-name').value;
        const newCategory = document.getElementById('item-category-select').value;
        const newDescription = document.getElementById('item-description').value;
        const newPrice = parseFloat(document.getElementById('item-price').value);
        const newIsVeg = document.getElementById('item-dietary-select').value === 'true';
        if (!newName || !newCategory || !newDescription || isNaN(newPrice)) {
            alert('Please fill out all fields to add an item.');
            return;
        }
        menuData.push({ name: newName, description: newDescription, price: newPrice, category: newCategory, isAvailable: true, isVeg: newIsVeg, image: `https://placehold.co/600x400/333333/FBBF24?text=${newName.replace(/\s/g, '+')}`});
        renderAdminMenu();
        e.target.reset();
    });

    saveAllButton.addEventListener('click', () => saveData('menu'));
    loadInitialData();
});
document.addEventListener('DOMContentLoaded', () => {
  // --- SECURITY & DOM ELEMENTS ---
  if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    window.location.href = '/login.html';
    return;
  }

  const adminMenuList = document.getElementById('admin-menu-list');
  const saveAllButton = document.getElementById('save-all-changes');
  const addItemForm = document.getElementById('add-item-form');
  const logoutButton = document.getElementById('logout-button');
  const addCategoryForm = document.getElementById('add-category-form');
  const categoryListDiv = document.getElementById('category-list');
  const addItemCategorySelect = document.getElementById('item-category-select');

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
    categoriesData.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      if (category === selectedValue) {
        option.selected = true;
      }
      selectElement.appendChild(option);
    });
  };

  // --- NEW: This function now adds a delete button next to each category ---
  const renderCategoryList = () => {
    categoryListDiv.innerHTML = '';
    categoriesData.forEach(category => {
      const categoryItemDiv = document.createElement('div');
      categoryItemDiv.className = 'flex items-center justify-between py-1';
      categoryItemDiv.innerHTML = `
        <span>${category}</span>
        <button data-category-name="${category}" class="delete-category-btn text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
      `;
      categoryListDiv.appendChild(categoryItemDiv);
    });
    populateCategoryDropdown(addItemCategorySelect);
  };

  const renderAdminMenu = () => {
    adminMenuList.innerHTML = '';
    menuData.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'grid grid-cols-1 md:grid-cols-5 gap-4 items-center border-b border-gray-200 py-4';
      
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = item.name;
      nameInput.dataset.index = index;
      nameInput.dataset.field = 'name';
      nameInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent transition';
      
      const categorySelect = document.createElement('select');
      categorySelect.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-brand-accent focus:border-brand-accent transition';
      categorySelect.dataset.index = index;
      categorySelect.dataset.field = 'category';
      populateCategoryDropdown(categorySelect, item.category);

      const priceInput = document.createElement('input');
      priceInput.type = 'number';
      priceInput.step = '0.01';
      priceInput.value = item.price;
      priceInput.dataset.index = index;
      priceInput.dataset.field = 'price';
      priceInput.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent transition';
      
      const availableLabel = document.createElement('label');
      availableLabel.className = 'flex items-center justify-start space-x-2 cursor-pointer';
      availableLabel.innerHTML = `
        <input type="checkbox" ${item.available ? 'checked' : ''} data-index="${index}" data-field="available" class="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary">
        <span class="text-sm font-medium text-gray-700">Available</span>`;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-btn bg-gray-700 text-white text-xs font-bold uppercase px-3 py-2 rounded-md hover:bg-black transition-colors';
      deleteButton.dataset.index = index;
      deleteButton.textContent = 'Delete';

      itemDiv.appendChild(nameInput);
      itemDiv.appendChild(categorySelect);
      itemDiv.appendChild(priceInput);
      itemDiv.appendChild(availableLabel);
      itemDiv.appendChild(deleteButton);
      adminMenuList.appendChild(itemDiv);
    });
  };

  // --- DATA HANDLING & API FUNCTIONS ---
  const saveData = async (dataType) => {
    const isMenu = dataType === 'menu';
    const endpoint = isMenu ? '/.netlify/functions/menu' : '/.netlify/functions/categories';
    const dataToSave = isMenu ? menuData : categoriesData;
    const button = isMenu ? saveAllButton : null;

    if (button) {
      button.textContent = 'Saving...';
      button.disabled = true;
    }
    
    try {
      const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify(dataToSave, null, 2) });
      if (!response.ok) throw new Error(`Failed to save ${dataType}`);
      if (isMenu) alert('Menu Published Successfully!');
    } catch (error) {
      console.error(`Error saving ${dataType}:`, error);
      alert(`Error saving ${dataType}. Please check the console and try again.`);
    } finally {
      if (button) {
        button.textContent = 'Publish All Changes';
        button.disabled = false;
      }
    }
  };

  const loadInitialData = async () => {
    try {
      const [menuResponse, categoriesResponse] = await Promise.all([
        fetch('/.netlify/functions/menu'),
        fetch('/.netlify/functions/categories')
      ]);
      if (!menuResponse.ok) throw new Error('Failed to fetch menu.');
      if (!categoriesResponse.ok) throw new Error('Failed to fetch categories.');
      menuData = await menuResponse.json();
      categoriesData = await categoriesResponse.json();
      renderCategoryList();
      renderAdminMenu();
    } catch (error) {
      console.error("Failed to load initial data:", error);
      adminMenuList.innerHTML = `<p class="text-red-500 font-medium">Could not load site data. Please check the console and refresh. Error: ${error.message}</p>`; 
    }
  };

  // --- EVENT LISTENERS ---
  adminMenuList.addEventListener('change', (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;
    const field = e.target.dataset.field;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    menuData[index][field] = value;
  });

  adminMenuList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const index = e.target.dataset.index;
      if (confirm(`Are you sure you want to delete "${menuData[index].name}"?`)) {
        menuData.splice(index, 1);
        renderAdminMenu();
      }
    }
  });

  // --- NEW: Event listener for deleting a category ---
  categoryListDiv.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-category-btn')) {
      const categoryToDelete = e.target.dataset.categoryName;
      
      // Prevent deleting a category that is still in use
      const isCategoryInUse = menuData.some(item => item.category === categoryToDelete);
      if (isCategoryInUse) {
        alert(`Cannot delete "${categoryToDelete}" because it is still being used by one or more menu items.`);
        return;
      }

      if (confirm(`Are you sure you want to permanently delete the category "${categoryToDelete}"?`)) {
        // Remove from the local data array
        categoriesData = categoriesData.filter(cat => cat !== categoryToDelete);
        // Re-render the UI
        renderCategoryList();
        renderAdminMenu();
        // Save the changes immediately to the server
        await saveData('categories');
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
      renderCategoryList();
      renderAdminMenu();
      await saveData('categories');
      newCategoryInput.value = '';
    } else {
      alert('Category cannot be empty or already exists.');
    }
  });

  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newName = document.getElementById('item-name').value;
    const newCategory = document.getElementById('item-category-select').value;
    const newDescription = document.getElementById('item-description').value;
    const newPrice = parseFloat(document.getElementById('item-price').value);

    if (!newName || !newCategory || !newDescription || isNaN(newPrice)) {
      alert('Please fill out all fields to add an item.');
      return;
    }

    menuData.push({ name: newName, description: newDescription, price: newPrice, category: newCategory, available: true });
    renderAdminMenu();
    e.target.reset();
  });
  
  saveAllButton.addEventListener('click', () => saveData('menu'));

  // --- INITIALIZE THE PAGE ---
  loadInitialData();
});
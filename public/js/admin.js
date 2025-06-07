document.addEventListener('DOMContentLoaded', () => {
  // --- SECURITY & DOM ELEMENTS ---
  if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    window.location.href = '/login.html';
    return;
  }

  // Get references to all interactive elements on the page
  const adminMenuList = document.getElementById('admin-menu-list');
  const saveAllButton = document.getElementById('save-all-changes');
  const addItemForm = document.getElementById('add-item-form');
  const logoutButton = document.getElementById('logout-button');
  const addCategoryForm = document.getElementById('add-category-form');
  const categoryListDiv = document.getElementById('category-list');
  const addItemCategorySelect = document.getElementById('item-category-select');

  // In-memory data stores
  let menuData = [];
  let categoriesData = [];

  // --- LOGOUT LOGIC ---
  logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    alert('You have been logged out.');
    window.location.href = '/login.html';
  });

  // --- HELPER & RENDER FUNCTIONS ---

  /**
   * Populates any <select> dropdown with the current list of categories.
   * @param {HTMLSelectElement} selectElement The dropdown element to populate.
   * @param {string} [selectedValue] The value that should be pre-selected.
   */
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

  /**
   * Renders the simple text list of existing categories.
   */
  const renderCategoryList = () => {
    categoryListDiv.innerHTML = categoriesData.map(cat => `<p class="py-1">${cat}</p>`).join('');
    // Also update the main dropdown in the "Add Item" form
    populateCategoryDropdown(addItemCategorySelect);
  };

  /**
   * Redraws the entire list of editable menu items.
   */
  const renderAdminMenu = () => {
    adminMenuList.innerHTML = '';
    menuData.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'grid grid-cols-1 md:grid-cols-5 gap-4 items-center border-b border-gray-200 py-4';

      // Create each input element individually for clarity and to attach event listeners if needed
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

      // Append all created elements to the row
      itemDiv.appendChild(nameInput);
      itemDiv.appendChild(categorySelect);
      itemDiv.appendChild(priceInput);
      itemDiv.appendChild(availableLabel);
      itemDiv.appendChild(deleteButton);
      
      adminMenuList.appendChild(itemDiv);
    });
  };

  // --- DATA HANDLING & API FUNCTIONS ---

  /**
   * A generic function to save data ('menu' or 'categories') to the server.
   * @param {'menu' | 'categories'} dataType The type of data to save.
   */
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

  /**
   * Loads both menu and category data when the page first opens.
   */
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

  // Listens for any change in the item list (typing, checking a box, changing a dropdown)
  adminMenuList.addEventListener('change', (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return;
    
    const field = e.target.dataset.field;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    
    menuData[index][field] = value;
  });

  // Listens for clicks on delete buttons
  adminMenuList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const index = e.target.dataset.index;
      if (confirm(`Are you sure you want to delete "${menuData[index].name}"?`)) {
        menuData.splice(index, 1);
        renderAdminMenu();
      }
    }
  });

  // Listens for the "Add Category" form submission
  addCategoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newCategoryInput = document.getElementById('new-category-name');
    const newCategory = newCategoryInput.value.trim();
    
    if (newCategory && !categoriesData.includes(newCategory)) {
      categoriesData.push(newCategory);
      categoriesData.sort();
      renderCategoryList(); // Update the UI list
      renderAdminMenu(); // Redraw menu items to include the new category in their dropdowns
      await saveData('categories'); // Save the new category list to the server immediately
      newCategoryInput.value = '';
    } else {
      alert('Category cannot be empty or already exists.');
    }
  });

  // Listens for the "Add Item" form submission
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
  
  // Listens for clicks on the main "Publish All Changes" button
  saveAllButton.addEventListener('click', () => saveData('menu'));

  // --- INITIALIZE THE PAGE ---
  loadInitialData();
});
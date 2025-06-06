document.addEventListener('DOMContentLoaded', () => {
  // Security Check: If the user hasn't logged in, redirect them away.
  if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
    window.location.href = '/login.html';
    return; // Stop the rest of the script from running
  }

  // Get references to all the important elements on the page
  const adminMenuList = document.getElementById('admin-menu-list');
  const saveAllButton = document.getElementById('save-all-changes');
  const addItemForm = document.getElementById('add-item-form');
  let menuData = []; // This array will hold the menu items in the browser's memory

  // --- LOGOUT LOGIC ---
  // Find the new logout button by its ID
  const logoutButton = document.getElementById('logout-button');

  // Add a click listener to the button
  logoutButton.addEventListener('click', () => {
      // 1. Remove the authentication flag from the browser's session storage
      sessionStorage.removeItem('isAdminAuthenticated');

      // 2. Redirect the user back to the login page
      alert('You have been logged out.');
      window.location.href = '/login.html';
  });

  // --- RENDER FUNCTION ---
  // Redraws the entire list of editable menu items
  const renderAdminMenu = () => {
    adminMenuList.innerHTML = '';
    menuData.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        // This styles the container for each row.
        itemDiv.className = 'grid grid-cols-1 md:grid-cols-5 gap-4 items-center border-b border-gray-200 py-4';

        // This is the new, fully styled HTML that will be generated for each item.
        itemDiv.innerHTML = `
            <input type="text" value="${item.name}" data-index="${index}" data-field="name" placeholder="Name"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent transition">

            <input type="text" value="${item.category}" data-index="${index}" data-field="category" placeholder="Category"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent transition">

            <input type="number" step="0.01" value="${item.price}" data-index="${index}" data-field="price" placeholder="Price"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-accent focus:border-brand-accent transition">
            
            <label class="flex items-center justify-start space-x-2 cursor-pointer">
                <input type="checkbox" ${item.available ? 'checked' : ''} data-index="${index}" data-field="available"
                       class="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary">
                <span class="text-sm font-medium text-gray-700">Available</span>
            </label>
            
            <button class="delete-btn bg-gray-700 text-white text-xs font-bold uppercase px-3 py-2 rounded-md hover:bg-black transition-colors" data-index="${index}">
                Delete
            </button>
        `;
        adminMenuList.appendChild(itemDiv);
    });
  };

  // --- DATA FUNCTIONS ---
  // Fetches the latest menu from the server
  const loadMenu = async () => {
    try {
      const response = await fetch('/.netlify/functions/menu');
      menuData = await response.json();
      renderAdminMenu();
    } catch (error) { 
      console.error("Failed to load menu:", error);
      adminMenuList.innerHTML = '<p>Could not load menu data. Please refresh.</p>'; 
    }
  };

  // Sends the entire updated menuData array to the server to be saved
  const saveMenu = async () => {
    saveAllButton.textContent = 'Saving...';
    saveAllButton.disabled = true;
    try {
      await fetch('/.netlify/functions/menu', {
        method: 'POST',
        body: JSON.stringify(menuData, null, 2), // The "null, 2" makes the JSON in the file readable
      });
      alert('Menu Published Successfully!');
    } catch (error) {
      alert('Error saving menu. Please try again.');
    } finally {
      saveAllButton.textContent = 'Publish All Changes';
      saveAllButton.disabled = false;
    }
  };

  // --- EVENT LISTENERS ---
  // Listens for any change in the item list (e.g., typing in a box, checking a box)
  adminMenuList.addEventListener('change', (e) => {
    const index = e.target.dataset.index;
    if (index === undefined) return; // Exit if the change wasn't on a menu item input
    
    const field = e.target.dataset.field;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    
    menuData[index][field] = value; // Update the data in our local array
  });

  // Listens for clicks on the delete buttons
  adminMenuList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const index = e.target.dataset.index;
      if (confirm(`Are you sure you want to delete "${menuData[index].name}"?`)) {
        menuData.splice(index, 1); // Remove the item from our local array
        renderAdminMenu(); // Redraw the list
      }
    }
  });

  // Listens for the "Add Item" form submission
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get values directly from the form inputs by their ID
    const newName = document.getElementById('item-name').value;
    const newCategory = document.getElementById('item-category').value;
    const newDescription = document.getElementById('item-description').value;
    const newPrice = parseFloat(document.getElementById('item-price').value);

    // Validate that all fields are filled correctly
    if (!newName || !newCategory || !newDescription || isNaN(newPrice)) {
        alert('Please fill out all fields to add an item.');
        return;
    }

    menuData.push({
      name: newName,
      description: newDescription,
      price: newPrice,
      category: newCategory,
      available: true, // New items are always available by default
    });

    renderAdminMenu(); // Redraw the list with the new item
    e.target.reset(); // Clear the form fields
  });
  
  // Listens for clicks on the main "Save" button
  saveAllButton.addEventListener('click', saveMenu);

  // --- INITIAL LOAD ---
  // Load the menu from the server as soon as the page opens
  loadMenu();
});
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
      itemDiv.className = 'admin-item';
      itemDiv.innerHTML = `
        <input type="text" value="${item.name}" data-index="${index}" data-field="name" placeholder="Name">
        <input type="text" value="${item.category}" data-index="${index}" data-field="category" placeholder="Category">
        <input type="number" step="0.01" value="${item.price}" data-index="${index}" data-field="price" placeholder="Price">
        <label><input type="checkbox" ${item.available ? 'checked' : ''} data-index="${index}" data-field="available"> Available</label>
        <button class="delete-btn" data-index="${index}">Delete</button>
      `;
      // Note: We don't show the long description here to keep the UI clean, but it's still saved.
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
    const form = e.target;
    const newName = form.querySelector('[placeholder="Name"]').value;
    const newDescription = form.querySelector('[placeholder="Description"]').value;
    const newPrice = parseFloat(form.querySelector('[placeholder="Price"]').value);
    const newCategory = form.querySelector('[placeholder="Category"]').value;

    if (!newName || !newDescription || isNaN(newPrice) || !newCategory) {
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
    form.reset(); // Clear the form fields
  });
  
  // Listens for clicks on the main "Save" button
  saveAllButton.addEventListener('click', saveMenu);

  // --- INITIAL LOAD ---
  // Load the menu from the server as soon as the page opens
  loadMenu();
});
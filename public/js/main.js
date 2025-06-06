document.addEventListener('DOMContentLoaded', async () => {
  const menuContainer = document.getElementById('menu-container');
  try {
    const response = await fetch('/.netlify/functions/menu');
    const menuItems = await response.json();
    
    // Group items by category
    const menuByCategory = menuItems.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {});

    menuContainer.innerHTML = ''; // Clear any loading message

    // Render each category and its items
    for (const category in menuByCategory) {
      const categorySection = document.createElement('section');
      categorySection.className = 'menu-category';
      categorySection.innerHTML = `<h2>${category}</h2>`;

      const grid = document.createElement('div');
      grid.className = 'menu-grid';

      menuByCategory[category].forEach(item => {
        const card = document.createElement('div');
        card.className = `menu-card ${!item.available ? 'unavailable' : ''}`;
        card.innerHTML = `
          <span class="price">$${item.price.toFixed(2)}</span>
          <h3>${item.name}</h3>
          <p>${item.description}</p>
          ${!item.available ? '<div class="unavailable-tag">SOLD OUT</div>' : ''}
        `;
        grid.appendChild(card);
      });

      categorySection.appendChild(grid);
      menuContainer.appendChild(categorySection);
    }
  } catch (error) {
    menuContainer.innerHTML = '<p>We are currently updating our menu. Please check back shortly.</p>';
  }
});
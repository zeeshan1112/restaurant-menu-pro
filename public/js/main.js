document.addEventListener('DOMContentLoaded', async () => {
    // Find the container element in your index.html where the menu will be displayed.
    const menuContainer = document.getElementById('menu-container');

    // Safety check: If the container isn't found, stop the script to prevent errors.
    if (!menuContainer) {
        console.error('Error: The #menu-container element was not found on the page.');
        return;
    }

    try {
        // Fetch the menu data from our secure Netlify serverless function.
        const response = await fetch('/.netlify/functions/menu');
        const menuItems = await response.json();

        // Group all menu items by their "category" property.
        // This creates an object where each key is a category name (e.g., "Starters")
        // and its value is an array of menu items belonging to that category.
        const menuByCategory = menuItems.reduce((accumulator, item) => {
            (accumulator[item.category] = accumulator[item.category] || []).push(item);
            return accumulator;
        }, {});

        // Clear the "Loading..." message from the container.
        menuContainer.innerHTML = '';

        // Loop through each category we found (e.g., "Starters", then "Mains").
        for (const category in menuByCategory) {
            // Create a <section> element for each category.
            const categorySection = document.createElement('section');
            categorySection.className = 'menu-category';

            // Add the stylish category title, built with Tailwind classes.
            categorySection.innerHTML = `<h2 class="text-4xl font-playfair border-b-2 border-brand-accent pb-4 mb-8">${category}</h2>`;

            // Create the grid container for all the menu cards in this category.
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 md:grid-cols-2 gap-8';

            // Now, loop through each item within the current category.
            menuByCategory[category].forEach(item => {
                const card = document.createElement('div');
                
                // Style the menu card itself with Tailwind classes.
                // It adds a special 'opacity-50' class if the item is not available.
                card.className = `bg-brand-surface p-6 rounded-xl shadow-lg transition hover:shadow-2xl hover:-translate-y-1 relative ${!item.available ? 'opacity-50' : ''}`;
                
                // Create the inner HTML of the card with all the item details and styles.
                card.innerHTML = `
                    <div class="flex justify-between items-start">
                        <h3 class="text-2xl font-playfair mb-2">${item.name}</h3>
                        <p class="text-2xl font-jakarta font-semibold text-brand-primary whitespace-nowrap ml-4">$${item.price.toFixed(2)}</p>
                    </div>
                    <p class="text-brand-secondary pr-16">${item.description}</p>
                    ${!item.available ? '<div class="absolute top-4 right-4 bg-gray-700 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">Sold Out</div>' : ''}
                `;

                // Add the completed card to the grid.
                grid.appendChild(card);
            });

            // Add the completed grid to the category section.
            categorySection.appendChild(grid);
            // Add the completed category section to the main menu container.
            menuContainer.appendChild(categorySection);
        }
    } catch (error) {
        // If the fetch fails for any reason, display a user-friendly error message.
        console.error('Failed to load menu:', error);
        menuContainer.innerHTML = '<p class="text-center text-lg text-brand-secondary">We are currently updating our menu. Please check back shortly.</p>';
    }
});
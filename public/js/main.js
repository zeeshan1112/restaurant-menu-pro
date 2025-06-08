document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const categoryTabsContainer = document.getElementById('category-tabs');
    const vegToggleSwitch = document.getElementById('veg-toggle-switch');
    
    // Safety check: if these elements don't exist, we're not on the menu page, so stop.
    if (!menuGrid || !categoryTabsContainer || !vegToggleSwitch) {
        return;
    }

    const vegToggleKnob = document.getElementById('veg-toggle-knob');
    const noItemsMessage = document.getElementById('no-items-message');
    const vegToggleLabels = {
        all: document.querySelector('.toggle-label-all'),
        veg: document.querySelector('.toggle-label-veg'),
        nonVeg: document.querySelector('.toggle-label-nonveg')
    };

    let allMenuItems = [];
    let allCategories = [];
    let activeCategory = 'All';
    let activeFoodType = 'all';
    let vegToggleState = 0;

    const renderMenu = () => {
        menuGrid.innerHTML = '';
        const filteredByCategory = activeCategory === 'All' ? allMenuItems : allMenuItems.filter(item => item.category === activeCategory);
        const finalItems = activeFoodType === 'all' ? filteredByCategory : filteredByCategory.filter(item => activeFoodType === 'veg' ? item.isVeg : !item.isVeg);
        
        noItemsMessage.classList.toggle('hidden', finalItems.length > 0);

        finalItems.forEach(item => {
            const card = document.createElement('div');
            let cardBaseClasses = 'bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200';
            let toggleClasses = 'p-4 flex justify-between items-center accordion-toggle cursor-pointer'; // Always allow cursor pointer
            let soldOutOverlayHTML = '';
            let soldOutTagHTML = '';
            let imageClasses = 'w-full h-48 object-cover';
            let accordionArrowHTML = `<svg class="w-6 h-6 text-gray-500 transform transition-transform duration-300 accordion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
            
            const priceHTML = `<p class="font-semibold text-gray-700 text-lg">₹${parseFloat(item.price).toFixed(2)}</p>`;

            if (!item.isAvailable) {
                cardBaseClasses += ' is-sold-out'; // General class for sold-out state
                imageClasses += ' filter grayscale opacity-60'; // Style the image when sold out
                soldOutTagHTML = `<span class="text-xs font-bold uppercase px-3 py-1.5 rounded-md bg-red-600 text-white">Sold Out</span>`;
                soldOutOverlayHTML = `
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 pointer-events-none">
                        <span class="text-white text-3xl font-bold uppercase tracking-wider transform -rotate-12 border-4 border-white px-4 py-2 rounded shadow-lg">Sold Out</span>
                    </div>
                `;
                // Keep accordionArrowHTML for sold out items as well, if they are to be expandable
            }

            card.className = cardBaseClasses;

            card.innerHTML = `
                <div class="${toggleClasses}">
                    <div class="flex-grow"><div class="flex items-center gap-3">${item.isVeg ?
                        `<i class="fa-solid fa-leaf h-5 w-5 text-green-500" title="Veg"></i>` :
                        `<i class="fa-solid fa-drumstick-bite h-5 w-5 text-red-500" title="Non-Veg"></i>`
                    }<h3 class="font-bold text-lg text-gray-800">${item.name}</h3></div></div>
                    <div class="flex items-center gap-x-3">
                        ${priceHTML}
                        ${soldOutTagHTML}
                        ${accordionArrowHTML}
                    </div>
                </div>
                <div class="accordion-content relative">
                    ${soldOutOverlayHTML}
                    <img src="${item.image}" alt="${item.name}" class="${imageClasses}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/f0f0f0/333333?text=Image+Not+Found';">
                    <div class="p-4">
                        <p class="text-gray-700 text-base">${item.description}</p>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    };
    const renderCategoryTabs = () => {
        categoryTabsContainer.innerHTML = '';
        ['All', ...allCategories].forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            // Light theme category tabs
            const activeClasses = 'bg-amber-500 text-gray-900'; // Active tab
            const inactiveClasses = 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:text-gray-800'; // Inactive tab
            
            button.className = `px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${category === activeCategory ? activeClasses : inactiveClasses}`;
            button.dataset.category = category;
            categoryTabsContainer.appendChild(button);
        });
    };
    menuGrid.addEventListener('click', (e) => {
        const toggle = e.target.closest('.accordion-toggle');
        if (toggle) {
            const content = toggle.nextElementSibling;
            const icon = toggle.querySelector('.accordion-arrow');
            const isExpanded = content.style.maxHeight && content.style.maxHeight !== "0px";
            document.querySelectorAll('.accordion-content').forEach(c => c.style.maxHeight = null);
            document.querySelectorAll('.accordion-arrow').forEach(i => i.classList.remove('rotate-180'));
            if (!isExpanded && icon) { 
                content.style.maxHeight = content.scrollHeight + "px";
                icon.classList.add('rotate-180');
            }
        }
    });
    categoryTabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            activeCategory = e.target.dataset.category;
            renderCategoryTabs();
            renderMenu();
        }
    });
    vegToggleSwitch.addEventListener('click', () => {
         vegToggleState = (vegToggleState + 1) % 3;
         Object.values(vegToggleLabels).forEach(label => label.classList.remove('text-amber-400'));
         vegToggleLabels.nonVeg.classList.add('hidden');
         vegToggleLabels.all.classList.remove('hidden');
         vegToggleLabels.veg.classList.remove('hidden');
         switch(vegToggleState) {
             case 0: // All
                activeFoodType = 'all'; 
                vegToggleKnob.style.transform = 'translateX(0px)'; 
                vegToggleSwitch.classList.remove('bg-red-400', 'bg-green-400'); // Use slightly lighter shades for toggle bg
                vegToggleSwitch.classList.add('bg-gray-300'); // Default from index.html
                vegToggleLabels.all.classList.add('text-amber-400'); 
                break;
             case 1: // Veg
                activeFoodType = 'veg'; 
                vegToggleKnob.style.transform = 'translateX(28px)'; 
                vegToggleSwitch.classList.remove('bg-red-400', 'bg-gray-300'); 
                vegToggleSwitch.classList.add('bg-green-400'); 
                vegToggleLabels.veg.classList.add('text-amber-400'); 
                break;
             case 2: // Non-Veg
                activeFoodType = 'non-veg'; 
                vegToggleKnob.style.transform = 'translateX(0px)'; // Knob moves back for non-veg in this 3-state toggle
                vegToggleSwitch.classList.remove('bg-green-400', 'bg-gray-300'); 
                vegToggleSwitch.classList.add('bg-red-400'); 
                vegToggleLabels.nonVeg.classList.remove('hidden'); 
                vegToggleLabels.nonVeg.classList.add('text-amber-400'); 
                vegToggleLabels.all.classList.add('hidden'); 
                vegToggleLabels.veg.classList.add('hidden'); 
                break;
         }
         renderMenu();
    });
    const init = async () => {
        try {
            const [menuResponse, categoriesResponse] = await Promise.all([fetch('/.netlify/functions/menu'), fetch('/.netlify/functions/categories')]);
            if (!menuResponse.ok || !categoriesResponse.ok) throw new Error('Could not connect to the menu service.');
            allMenuItems = await menuResponse.json();
            allCategories = await categoriesResponse.json();
            renderCategoryTabs();
            renderMenu();
            vegToggleLabels.all.classList.add('text-amber-400');
        } catch (error) {
            console.error("Failed to load initial data:", error);
            menuGrid.innerHTML = `<p class="text-center text-red-600 col-span-full">${error.message}</p>`; // Darker red for better contrast on light bg
        }
    };
    init();
});
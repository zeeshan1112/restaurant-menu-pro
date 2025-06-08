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
            card.className = 'bg-gray-800 rounded-lg overflow-hidden shadow-lg border border-gray-700';
            const availabilityClass = item.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
            const availabilityText = item.isAvailable ? 'Available' : 'Unavailable';
            card.innerHTML = `
                <div class="p-4 cursor-pointer flex justify-between items-center accordion-toggle">
                    <div class="flex-grow"><div class="flex items-center gap-3">${item.isVeg ? `<svg title="Veg" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>` : `<svg title="Non-Veg" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>`}<h3 class="font-bold text-lg text-gray-100">${item.name}</h3></div></div>
                    <div class="flex items-center gap-4"><span class="text-xs font-semibold px-2 py-1 rounded-full ${availabilityClass}">${availabilityText}</span><svg class="w-6 h-6 text-gray-400 transform transition-transform duration-300 accordion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg></div>
                </div>
                <div class="accordion-content"><img src="${item.image}" alt="${item.name}" class="w-full h-48 object-cover" onerror="this.onerror=null;this.src='https://placehold.co/600x400/1a1a1a/f0f0f0?text=Image+Not+Found';"><div class="p-4"><p class="text-gray-400 mt-1 mb-2 text-sm">₹${parseFloat(item.price).toFixed(2)}</p><p class="text-gray-300 text-base">${item.description}</p></div></div>
            `;
            menuGrid.appendChild(card);
        });
    };
    const renderCategoryTabs = () => {
        categoryTabsContainer.innerHTML = '';
        ['All', ...allCategories].forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            button.className = `px-4 py-2 rounded-lg font-semibold transition-colors duration-300 ${category === activeCategory ? 'tab-active' : 'tab-inactive'}`;
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
            if (!isExpanded) {
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
             case 0: activeFoodType = 'all'; vegToggleKnob.style.transform = 'translateX(0px)'; vegToggleSwitch.classList.remove('bg-red-500', 'bg-green-500'); vegToggleSwitch.classList.add('bg-gray-600'); vegToggleLabels.all.classList.add('text-amber-400'); break;
             case 1: activeFoodType = 'veg'; vegToggleKnob.style.transform = 'translateX(28px)'; vegToggleSwitch.classList.remove('bg-red-500'); vegToggleSwitch.classList.add('bg-green-500'); vegToggleLabels.veg.classList.add('text-amber-400'); break;
             case 2: activeFoodType = 'non-veg'; vegToggleKnob.style.transform = 'translateX(0px)'; vegToggleSwitch.classList.remove('bg-green-500'); vegToggleSwitch.classList.add('bg-red-500'); vegToggleLabels.nonVeg.classList.remove('hidden'); vegToggleLabels.nonVeg.classList.add('text-amber-400'); vegToggleLabels.all.classList.add('hidden'); vegToggleLabels.veg.classList.add('hidden'); break;
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
            menuGrid.innerHTML = `<p class="text-center text-red-400 col-span-full">${error.message}</p>`;
        }
    };
    init();
});
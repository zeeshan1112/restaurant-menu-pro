document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const categoryTabsContainer = document.getElementById('category-tabs');
    
    const vegOnlySwitch = document.getElementById('veg-only-switch');
    const vegOnlyKnob = document.getElementById('veg-only-knob');
    const nonVegOnlySwitch = document.getElementById('non-veg-only-switch');
    const nonVegOnlyKnob = document.getElementById('non-veg-only-knob');
    const noItemsMessage = document.getElementById('no-items-message');

    if (!menuGrid || !categoryTabsContainer || !vegOnlySwitch || !vegOnlyKnob || !nonVegOnlySwitch || !nonVegOnlyKnob || !noItemsMessage) {
        console.warn('One or more essential elements for menu filtering are missing. Menu script will not run.');
        return;
    }

    let allMenuItems = [];
    let allCategories = [];
    let activeCategory = 'All';
    let showOnlyVeg = false;
    let showOnlyNonVeg = false;

    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    const updateSwitchUI = (switchEl, knobEl, isActive) => {
        if (isActive) {
            knobEl.style.transform = 'translateX(22px)'; // For w-12 h-6 track (48px), w-5 h-5 knob (20px), p-0.5 (2px each side) -> 48 - 20 - 4 = 24px. Let's use 22px for a bit of margin.
            switchEl.classList.remove('bg-gray-200');
            switchEl.classList.add('bg-amber-500'); // Use accent color for active state
        } else {
            knobEl.style.transform = 'translateX(0px)';
            switchEl.classList.remove('bg-amber-500');
            switchEl.classList.add('bg-gray-200'); // Lighter gray for inactive state
        }
    };
    
    const renderMenu = () => {
        menuGrid.innerHTML = '';
        const filteredByCategory = activeCategory === 'All' 
            ? allMenuItems 
            : allMenuItems.filter(item => item.category === activeCategory);

        let finalItems = filteredByCategory;
        if (showOnlyVeg) {
            finalItems = finalItems.filter(item => item.isVeg);
        } else if (showOnlyNonVeg) {
            finalItems = finalItems.filter(item => !item.isVeg);
        }
        
        noItemsMessage.classList.toggle('hidden', finalItems.length > 0);

        finalItems.forEach(item => {
            const card = document.createElement('div');
            let cardBaseClasses = 'bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200';
            let toggleClasses = 'p-4 flex justify-between items-center accordion-toggle cursor-pointer';
            let soldOutOverlayHTML = '';
            let soldOutTagHTML = '';
            let imageClasses = 'w-full h-48 object-cover';
            let accordionArrowHTML = `<svg class="w-6 h-6 text-gray-500 transform transition-transform duration-300 accordion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;
            
            const priceHTML = `<p class="font-semibold text-gray-700 text-lg">₹${parseFloat(item.price).toFixed(2)}</p>`;

            if (!item.isAvailable) {
                cardBaseClasses += ' is-sold-out';
                imageClasses += ' filter grayscale opacity-60';
                soldOutTagHTML = `<span class="text-xs font-bold uppercase px-3 py-1.5 rounded-md bg-red-600 text-white">Sold Out</span>`;
                soldOutOverlayHTML = `
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 pointer-events-none">
                        <span class="text-white text-3xl font-bold uppercase tracking-wider transform -rotate-12 border-4 border-white px-4 py-2 rounded shadow-lg">Sold Out</span>
                    </div>
                `;
            }

            card.className = cardBaseClasses;
            card.innerHTML = `
                <div class="${toggleClasses}">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3">
                            <div title="${item.isVeg ? 'Veg' : 'Non-Veg'}" class="w-5 h-5 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} flex items-center justify-center flex-shrink-0">
                                <div class="w-2.5 h-2.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'} rounded-full"></div>
                            </div>
                            <h3 class="font-bold text-lg text-gray-800">${item.name}</h3>
                        </div>
                    </div>
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
            // Base classes for all tabs
            let tabClasses = 'px-3 py-3 text-base md:text-lg focus:outline-none transition-all duration-300 ease-in-out';
            if (category === activeCategory) {
                tabClasses += ' text-amber-500 border-b-2 border-amber-500 font-semibold';
            } else {
                tabClasses += ' text-gray-500 hover:text-amber-500 border-b-2 border-transparent hover:border-amber-300 font-medium';
            }
            button.className = tabClasses;
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
            
            document.querySelectorAll('.accordion-content').forEach(c => {
                if (c !== content) c.style.maxHeight = null;
            });
            document.querySelectorAll('.accordion-arrow').forEach(i => {
                if (i !== icon) i.classList.remove('rotate-180');
            });

            if (!isExpanded && icon) { 
                content.style.maxHeight = content.scrollHeight + "px";
                icon.classList.add('rotate-180');
            } else if (icon) {
                content.style.maxHeight = null;
                icon.classList.remove('rotate-180');
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

    vegOnlySwitch.addEventListener('click', () => {
        showOnlyVeg = !showOnlyVeg;
        if (showOnlyVeg) {
            showOnlyNonVeg = false;
        }
        updateSwitchUI(vegOnlySwitch, vegOnlyKnob, showOnlyVeg);
        updateSwitchUI(nonVegOnlySwitch, nonVegOnlyKnob, showOnlyNonVeg);
        renderMenu();
    });

    nonVegOnlySwitch.addEventListener('click', () => {
        showOnlyNonVeg = !showOnlyNonVeg;
        if (showOnlyNonVeg) {
            showOnlyVeg = false;
        }
        updateSwitchUI(vegOnlySwitch, vegOnlyKnob, showOnlyVeg);
        updateSwitchUI(nonVegOnlySwitch, nonVegOnlyKnob, showOnlyNonVeg);
        renderMenu();
    });

    const init = async () => {
        try {
            const [menuResponse, categoriesResponse] = await Promise.all([
                fetch('/.netlify/functions/menu'), 
                fetch('/.netlify/functions/categories')
            ]);

            if (!menuResponse.ok || !categoriesResponse.ok) {
                throw new Error('Could not connect to the menu service.');
            }
            allMenuItems = await menuResponse.json();
            allCategories = await categoriesResponse.json();
            
            renderCategoryTabs();
            updateSwitchUI(vegOnlySwitch, vegOnlyKnob, showOnlyVeg); // Initial UI for veg switch
            updateSwitchUI(nonVegOnlySwitch, nonVegOnlyKnob, showOnlyNonVeg); // Initial UI for non-veg switch
            renderMenu();

        } catch (error) {
            console.error("Failed to load initial data:", error);
            if (menuGrid) {
                menuGrid.innerHTML = `<p class="text-center text-red-600 col-span-full">${error.message}</p>`;
            }
        }
    };

    init();
});

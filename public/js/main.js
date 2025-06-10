document.addEventListener('DOMContentLoaded', () => {
    const menuGrid = document.getElementById('menu-grid');
    const menuContentSection = document.getElementById('menu-content'); // For showing/hiding
    const categoryTabsContainer = document.getElementById('category-tabs');
    
    const vegOnlySwitch = document.getElementById('veg-only-switch');
    const vegOnlyKnob = document.getElementById('veg-only-knob');
    const nonVegOnlySwitch = document.getElementById('non-veg-only-switch');
    const nonVegOnlyKnob = document.getElementById('non-veg-only-knob');
    const noItemsMessage = document.getElementById('no-items-message');
    const mainNav = document.getElementById('main-nav');
    const pageSections = document.querySelectorAll('.page-content');
    const faqAccordionContainer = document.getElementById('faq-accordion');

    // Adjusted safety check for new structure
    if (!menuContentSection || !categoryTabsContainer || !vegOnlySwitch || !nonVegOnlySwitch || !mainNav || !faqAccordionContainer) {
        console.warn('One or more essential elements for menu filtering are missing. Menu script will not run.');
        return;
    }

    let allMenuItems = [];
    let allCategories = [];
    let activeCategory = 'All';
    let showOnlyVeg = false;
    let showOnlyNonVeg = false;
    let currentPage = 'menu'; // To track the currently visible page/section

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

    const faqData = [
        {
            question: "Do you use Ajinomoto (MSG) in your food?",
            answer: "No, we are committed to using only natural ingredients. We do not add Ajinomoto (MSG) to any of our dishes. We believe in letting the fresh spices and ingredients provide the flavor."
        },
        {
            question: "Is the meat you serve Halal?",
            answer: "Yes, all the meat used in our non-vegetarian dishes is 100% Halal certified. We source our meat from trusted local suppliers who adhere to strict Halal standards."
        },
        {
            question: "Do you offer catering services for events?",
            answer: "Yes, we offer comprehensive catering services for parties, corporate events, and special occasions. Please contact us directly to discuss your requirements and get a custom quote."
        }
    ];

    const renderFaq = () => {
        if (!faqAccordionContainer) return;
        faqAccordionContainer.innerHTML = ''; // Clear loading message
        faqData.forEach((faqItem, index) => {
            const itemDiv = document.createElement('div');
            // Added 'faq-item-group' for easier selection in the click handler
            itemDiv.className = 'bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 group faq-item-group';
            itemDiv.innerHTML = `
                <button class="w-full p-4 text-left flex justify-between items-center focus:outline-none faq-toggle hover:bg-gray-50 transition-colors duration-200" aria-expanded="false">
                    <span class="font-semibold text-gray-700">${faqItem.question}</span>
                    <span class="faq-icon text-amber-500 text-2xl font-light transform transition-transform duration-300 group-[.is-expanded]:rotate-45">
                        +
                    </span>
                </button>
                <div class="faq-content px-4 text-gray-600" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease-out, padding-bottom 0.3s ease-out;">
                    <p>${faqItem.answer}</p>
                </div>
            `;
            faqAccordionContainer.appendChild(itemDiv);
        });

        document.querySelectorAll('.faq-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const content = button.nextElementSibling;
                const currentParentGroup = button.closest('.faq-item-group'); // Use the new class
                const isCurrentlyExpanded = currentParentGroup.classList.contains('is-expanded');

                // Close all other FAQ items
                document.querySelectorAll('.faq-item-group').forEach(group => {
                    if (group !== currentParentGroup) {
                        group.classList.remove('is-expanded');
                        group.querySelector('.faq-toggle').setAttribute('aria-expanded', 'false');
                        const contentToClose = group.querySelector('.faq-content');
                        if (contentToClose) {
                            contentToClose.classList.remove('pb-4'); // Remove padding when closing others
                            contentToClose.style.maxHeight = '0px';
                        }
                    }
                });

                // Toggle the clicked item
                if (!isCurrentlyExpanded) {
                    content.classList.add('pb-4'); // Add padding back before expanding
                    content.style.maxHeight = content.scrollHeight + "px";
                    currentParentGroup.classList.add('is-expanded');
                    button.setAttribute('aria-expanded', 'true');
                } else {
                    content.classList.remove('pb-4'); // Remove padding when closing
                    content.style.maxHeight = '0px';
                    currentParentGroup.classList.remove('is-expanded');
                    button.setAttribute('aria-expanded', 'false');
                }
            });
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

    const showPage = (pageId) => {
        currentPage = pageId;
        pageSections.forEach(section => {
            if (section.id === `${pageId}-content`) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        // Update active nav link
        mainNav.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.page === pageId) {
                link.classList.add('text-amber-500', 'font-bold'); // Example active style
            } else {
                link.classList.remove('text-amber-500', 'font-bold');
            }
        });
        window.scrollTo(0,0); // Scroll to top when changing "pages"
    };

    mainNav.addEventListener('click', (e) => {
        if (e.target.matches('.nav-link') && e.target.dataset.page) {
            e.preventDefault();
            showPage(e.target.dataset.page);
        }
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
            renderFaq(); // Render FAQ items
            renderMenu();
            showPage('menu'); // Show menu page by default

        } catch (error) {
            console.error("Failed to load initial data:", error);
            if (menuGrid) {
                menuGrid.innerHTML = `<p class="text-center text-red-600 col-span-full">${error.message}</p>`;
            }
        }
    };

    init();
});

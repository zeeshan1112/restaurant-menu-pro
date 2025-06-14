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
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const themeIconLight = document.getElementById('theme-icon-light');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const stickyCategoryBarWrapper = document.getElementById('sticky-category-bar-wrapper');
    const brandTitleLink = document.querySelector('h1.font-brand[data-page="menu"]'); // For navigation
    const scrollCatLeft = document.getElementById('scroll-cat-left');
    const scrollCatRight = document.getElementById('scroll-cat-right');
    // Announcement Bar Elements
    const announcementBar = document.getElementById('announcement-bar');
    const announcementTextDisplay = document.getElementById('announcement-text-display');
    const closeAnnouncementButton = document.getElementById('close-announcement-button');


    if (!menuContentSection || !categoryTabsContainer || !vegOnlySwitch || !nonVegOnlySwitch || !mainNav || !faqAccordionContainer || !themeToggleButton || !themeIconLight || !themeIconDark || !stickyCategoryBarWrapper || !scrollCatLeft || !scrollCatRight) {
        console.warn('One or more essential elements are missing. Script functionalities might be limited.');
        return;
    }

    let allMenuItems = [];
    let allCategories = [];
    let activeCategory = 'All';
    let showOnlyVeg = false;
    let showOnlyNonVeg = false;
    // let currentPage = 'menu'; // No longer strictly needed if using hash for state

    const PAGE_IDS = {
        MENU: 'menu', ABOUT: 'about', FAQ: 'faq'
    };

    const currentYearEl = document.getElementById('current-year');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // Helper function to determine text color (black or white) based on background
    const getTextColorForBackground = (hexBgColor) => {
        if (!hexBgColor) return '#FFFFFF'; // Default to white if no color provided

        const hex = hexBgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        // Calculate luminance using the YIQ formula
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#000000' : '#FFFFFF'; // Return black for light backgrounds, white for dark
    };

    // --- ANNOUNCEMENT BAR LOGIC ---
    const displayAnnouncement = (text, enabled, accentColor) => {
        if (!announcementBar || !announcementTextDisplay) return; // Ensure elements exist

        if (enabled && text) {
            let textColor = '#FFFFFF'; // Default text color if accentColor is not provided
            if (accentColor) {
                announcementBar.style.backgroundColor = accentColor;
                textColor = getTextColorForBackground(accentColor);
            }
            announcementBar.style.color = textColor; // Apply to bar, children like span will inherit
            if (closeAnnouncementButton) { // Explicitly set for the button as well
                closeAnnouncementButton.style.color = textColor;
            }
            announcementTextDisplay.textContent = text;
            announcementBar.classList.remove('hidden');
        } else {
            announcementBar.classList.add('hidden');
        }
    };

    // --- DYNAMIC ACCENT COLOR APPLICATION (PUBLIC) ---
    const applyPublicSiteStyles = (settings) => {
        // Accent Color
        document.documentElement.style.setProperty('--accent-color', settings.accentColor);
        document.documentElement.style.setProperty('--accent-color-hover', settings.accentColorHover);
        // If theme toggle icons need to change color based on accent:
        if (themeIconLight) themeIconLight.style.color = settings.accentColor;
        // Note: themeIconDark uses indigo, might want to keep it or make it themeable too

        // Section Title Font
        if (settings.sectionTitleFont) {
            document.documentElement.style.setProperty('--section-title-font-family', settings.sectionTitleFont);
        }
    };


    // --- THEME SWITCHER LOGIC ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIconLight.classList.add('hidden');
            themeIconDark.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeIconLight.classList.remove('hidden');
            themeIconDark.classList.add('hidden');
        }
        localStorage.setItem('theme', theme);
    };

    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    const updateSwitchUI = (switchEl, knobEl, isActive) => {
        if (isActive) {
            // w-8 track (2rem/32px), w-3 knob (0.75rem/12px), p-0.5 (0.125rem/2px each side)
            knobEl.style.transform = 'translateX(1rem)'; // 32px - 12px - 4px = 16px = 1rem
            switchEl.classList.remove('bg-gray-300', 'dark:bg-gray-600');
            switchEl.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
        } else {
            knobEl.style.transform = 'translateX(0px)'; // Corrected from 'translateX(0px)' to ensure it's a string
            switchEl.style.backgroundColor = ''; // Revert to CSS classes
            switchEl.classList.add('bg-gray-300', 'dark:bg-gray-600'); // Add back both light and dark inactive states
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
            let cardBaseClasses = 'bg-theme-secondary rounded-lg overflow-hidden shadow-lg border border-theme'; // Use theme classes
            let toggleClasses = 'p-3 sm:p-4 flex justify-between items-center accordion-toggle cursor-pointer'; // Reduced padding
            let soldOutOverlayHTML = '';
            let soldOutTagHTML = '';
            let imageClasses = 'w-full h-36 sm:h-40 object-cover'; // Reduced image height
            let accordionArrowHTML = `<svg class="w-5 h-5 text-theme-secondary transform transition-transform duration-300 accordion-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`; // Smaller arrow
            
            const priceHTML = `<p class="font-semibold text-theme-secondary text-md sm:text-lg">₹${parseFloat(item.price).toFixed(2)}</p>`; // Adjusted price font size

            if (!item.isAvailable) {
                cardBaseClasses += ' is-sold-out';
                imageClasses += ' filter grayscale opacity-60';
                soldOutTagHTML = `<span class="text-xs font-bold uppercase px-2 py-1 rounded-md bg-red-600 text-white">Sold Out</span>`; // Slightly smaller sold out tag
                soldOutOverlayHTML = `
                    <div class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 pointer-events-none">
                        <span class="text-white text-2xl sm:text-3xl font-bold uppercase tracking-wider transform -rotate-12 border-2 sm:border-4 border-white px-3 py-1 sm:px-4 sm:py-2 rounded shadow-lg">Sold Out</span>
                    </div>
                `;
            }

            card.className = cardBaseClasses;
            card.innerHTML = `
                <div class="${toggleClasses}">
                    <div class="flex-grow mr-2">
                        <div class="flex items-center gap-2">
                            <div title="${item.isVeg ? 'Veg' : 'Non-Veg'}" class="w-4 h-4 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} flex items-center justify-center flex-shrink-0">
                                <div class="w-2 h-2 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'} rounded-full"></div>
                            </div>
                            <h3 class="font-bold text-md sm:text-lg text-theme-primary leading-tight">${item.name}</h3>
                        </div>
                    </div>
                    <div class="flex items-center gap-x-2 text-theme-primary flex-shrink-0">
                        ${priceHTML}
                        ${soldOutTagHTML}
                        ${accordionArrowHTML}
                    </div>
                </div>
                <div class="accordion-content relative">
                    ${soldOutOverlayHTML}
                    <img src="${item.image}" alt="${item.name}" class="${imageClasses}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/f0f0f0/333333?text=Image+Not+Found';">
                    <div class="p-3 sm:p-4">
                        <p class="text-theme-secondary text-sm sm:text-base">${item.description}</p>
                    </div>
                </div>
            `;
            menuGrid.appendChild(card);
        });
    };

    const updateCategoryScrollArrows = () => {
        if (!categoryTabsContainer || !scrollCatLeft || !scrollCatRight) return;

        // RAF to prevent layout thrashing if called frequently
        requestAnimationFrame(() => {
            const { scrollWidth, clientWidth, scrollLeft } = categoryTabsContainer;
            const scrollThreshold = 5; // Pixels of tolerance

            const canScrollLeft = scrollLeft > scrollThreshold;
            const canScrollRight = scrollLeft < (scrollWidth - clientWidth - scrollThreshold);

            scrollCatLeft.classList.toggle('hidden', !canScrollLeft);
            scrollCatRight.classList.toggle('hidden', !canScrollRight);

            if (scrollWidth <= clientWidth) { // If no scrolling is possible
                scrollCatLeft.classList.add('hidden');
                scrollCatRight.classList.add('hidden');
            }
        });
    };
    const renderCategoryTabs = () => {
        categoryTabsContainer.innerHTML = '';
        ['All', ...allCategories].forEach(category => {
            const button = document.createElement('button');
            button.textContent = category;
            // Base classes for all tabs
            // Reduced padding (px-2 py-2) and font size (text-sm) for mobile, slightly larger for md and up
            let tabClasses = 'px-2 py-2 text-sm md:px-3 md:py-3 md:text-base focus:outline-none transition-all duration-300 ease-in-out';
            if (category === activeCategory) {
                tabClasses += ' text-theme-accent border-b-2 border-theme-accent font-semibold';
            } else {
                tabClasses += ' text-theme-secondary hover:text-theme-accent border-b-2 border-transparent hover:border-theme-accent font-medium';
            }
            button.className = tabClasses;
            button.dataset.category = category;
            categoryTabsContainer.appendChild(button);
        });
        updateCategoryScrollArrows(); // Update arrows after tabs are rendered
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
                if (c !== content) c.style.maxHeight = '0px'; // Consistent collapsed state
            });
            document.querySelectorAll('.accordion-arrow').forEach(i => {
                if (i !== icon) i.classList.remove('rotate-180');
            });

            if (!isExpanded && icon) { 
                content.style.maxHeight = content.scrollHeight + "px";
                icon.classList.add('rotate-180');
            } else if (icon) {
                content.style.maxHeight = '0px'; // Consistent collapsed state
                icon.classList.remove('rotate-180');
            }
        }
    });

    categoryTabsContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            activeCategory = e.target.dataset.category;
            renderCategoryTabs();
            renderMenu();

            // Ensure menu items are scrolled into view below the sticky category bar
            if (stickyCategoryBarWrapper && menuGrid.children.length > 0) {
                const stickyBarBottomViewport = stickyCategoryBarWrapper.getBoundingClientRect().bottom;
                const menuGridTopViewport = menuGrid.getBoundingClientRect().top;
                
                const scrollAmount = menuGridTopViewport - stickyBarBottomViewport;

                if (Math.abs(scrollAmount) > 1) { // Only scroll if not already aligned (with a 1px tolerance)
                    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
                }
                // Note: renderCategoryTabs is called above, which in turn calls updateCategoryScrollArrows
            }
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

    const setActiveNavLink = (pageId) => {
        const navLinks = mainNav.querySelectorAll('a[data-page]');
        const allTriggers = brandTitleLink ? [...navLinks, brandTitleLink] : [...navLinks];

        allTriggers.forEach(link => {
            if (link.dataset.page === pageId) {
                link.classList.add('active'); // Assumes .active handles text color via CSS variables
                if (link.tagName === 'A') link.classList.remove('text-theme-secondary');
            } else {
                link.classList.remove('active');
                if (link.tagName === 'A') link.classList.add('text-theme-secondary');
            }
        });
    };

    const showPage = (pageId, fromHashChange = false) => {
        pageSections.forEach(section => {
            if (section.id === `${pageId}-content`) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        setActiveNavLink(pageId);

        // Show/hide sticky category bar based on page
        if (stickyCategoryBarWrapper) {
            stickyCategoryBarWrapper.classList.toggle('hidden', pageId !== PAGE_IDS.MENU);
        }

        if (!fromHashChange) {
            window.location.hash = pageId; // Update URL hash
        }
        
        // Scroll to top only if not navigating from hash change (which might be a back/forward action)
        // or if the target is the top of the page.
        if (!fromHashChange || window.scrollY > 0) {
            window.scrollTo(0, 0);
        }
    };

    const handleNavigationClick = (e) => {
        const targetLink = e.target.closest('a[data-page], h1[data-page]');
        if (targetLink && targetLink.dataset.page) {
            e.preventDefault();
            showPage(targetLink.dataset.page);
        }
    };

    mainNav.addEventListener('click', handleNavigationClick);
    if (brandTitleLink) {
        brandTitleLink.addEventListener('click', handleNavigationClick);
    }

    // Category Scroll Arrow Click Handlers
    if (scrollCatLeft) {
        scrollCatLeft.addEventListener('click', () => {
            if (categoryTabsContainer) {
                categoryTabsContainer.scrollBy({ left: -categoryTabsContainer.clientWidth * 0.7, behavior: 'smooth' });
            }
        });
    }
    if (scrollCatRight) {
        scrollCatRight.addEventListener('click', () => {
            if (categoryTabsContainer) {
                categoryTabsContainer.scrollBy({ left: categoryTabsContainer.clientWidth * 0.7, behavior: 'smooth' });
            }
        });
    }



    const init = async () => {
        // Setup close announcement button listener if elements exist
        if (closeAnnouncementButton && announcementBar) {
            closeAnnouncementButton.addEventListener('click', () => {
                announcementBar.classList.add('hidden');
            });
        }

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
            
            // Apply stored theme on initial load
            const storedTheme = localStorage.getItem('theme') || 'light';
            applyTheme(storedTheme);

            // Fetch and apply site settings (accent color)
            try {
                const settingsResponse = await fetch('/.netlify/functions/settings');
                if (settingsResponse.ok) {
                    const siteSettings = await settingsResponse.json();
                    applyPublicSiteStyles(siteSettings); // Apply all relevant styles
                    displayAnnouncement(siteSettings.announcementText, siteSettings.announcementEnabled, siteSettings.accentColor);
                } else {
                    console.warn('Could not retrieve site settings or response not OK.');
                    if (announcementBar) announcementBar.classList.add('hidden'); // Ensure hidden
                }
            } catch (settingsError) {
                console.error("Failed to load site settings:", settingsError);
                if (announcementBar) announcementBar.classList.add('hidden'); // Ensure hidden on error
            }
            
            renderMenu(); // Render menu data first
            handleHashNavigation(); // Then determine which page to show based on hash or default

        } catch (error) {
            console.error("Failed to load initial data:", error);
            if (menuGrid) {
                menuGrid.innerHTML = `<p class="text-center text-red-600 col-span-full">${error.message}</p>`;
            }
        }
    };

    const handleHashNavigation = () => {
        const hash = window.location.hash.substring(1);
        const validPages = Object.values(PAGE_IDS);
        if (hash && validPages.includes(hash)) {
            showPage(hash, true); // Pass true to indicate it's from hash change
        } else {
            showPage(PAGE_IDS.MENU, true); // Default to menu
        }
    };

    // Listen for hash changes (browser back/forward)
    window.addEventListener('hashchange', handleHashNavigation);
    // Listen for scroll events on the category tabs to update arrows
    if (categoryTabsContainer) {
        categoryTabsContainer.addEventListener('scroll', updateCategoryScrollArrows, { passive: true });
    }
    // Listen for window resize to update arrows as scrollability might change
    window.addEventListener('resize', updateCategoryScrollArrows);


    init();
});

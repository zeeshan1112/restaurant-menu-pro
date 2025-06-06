/* /js/main.js */

document.addEventListener('DOMContentLoaded', () => {
    
    /**
     * Intersection Observer to fade in menu items on scroll.
     * This adds a modern, dynamic feel to the page as the user explores the menu.
     */
    const menuItems = document.querySelectorAll('.menu-item');

    const observerOptions = {
        root: null, // observes intersections relative to the viewport
        rootMargin: '0px',
        threshold: 0.1 // Triggers when 10% of the item is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // If the element is intersecting (visible)
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Stop observing the element once it's visible
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Attach the observer to each menu item
    menuItems.forEach(item => {
        observer.observe(item);
    });

    /**
     * Future functionality could be added here.
     * For example:
     * * 1. Fetching menu from an API:
     * fetch('/api/menu')
     * .then(response => response.json())
     * .then(data => {
     * // Code to dynamically generate menu items
     * });
     * * 2. Client-side filtering:
     * const filterButtons = document.querySelectorAll('.filter-btn');
     * filterButtons.forEach(button => {
     * button.addEventListener('click', () => {
     * // Code to show/hide menu items based on category (e.g., 'veg', 'non-veg')
     * });
     * });
     */

    console.log("Virundhu Mane interactive menu loaded.");

});
// assets/js/premium-society/app.js
import { PS_DOM } from './core.js';
import { initUI } from './ui.js';
import { SwipeController } from './swipe.js';

window.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Visuals & Interactions
    initUI();

    // 2. Initialize Swipe Logic
    SwipeController.init();

    // 3. Remove Loader smoothly
    setTimeout(() => {
        if(PS_DOM.loader) {
            PS_DOM.loader.style.opacity = '0';
            setTimeout(() => PS_DOM.loader.remove(), 500);
        }
        if(PS_DOM.layout) PS_DOM.layout.style.opacity = '1';
    }, 1000);
});
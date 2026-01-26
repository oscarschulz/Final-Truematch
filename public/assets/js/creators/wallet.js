import { DOM } from './dom.js';

export function initWallet(TopToast) {
    const modal = document.getElementById('add-card-modal');
    const btnCancel = document.querySelector('.btn-cancel-modal');
    const btnSubmit = document.querySelector('.btn-submit-card-modal');

    // FIX: Event Delegation para gumana kahit dynamic content (Settings View)
    document.addEventListener('click', (e) => {
        // Check if clicked element or its parent has the class
        const btn = e.target.closest('.btn-add-payment-card');
        
        if (btn) {
            e.preventDefault();
            if(modal) {
                modal.classList.remove('hidden');
                // Small delay for transition
                setTimeout(() => modal.classList.add('open'), 10);
            }
        }
    });

    // Close Modal Function
    const closeModal = () => {
        if(!modal) return;
        modal.classList.remove('open');
        setTimeout(() => modal.classList.add('hidden'), 200);
    };

    // Listeners for closing
    if(btnCancel) btnCancel.addEventListener('click', closeModal);
    
    // Close on click outside
    if(modal) {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) closeModal();
        });
    }

    // Submit Logic
    if(btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            closeModal();
            TopToast.fire({ icon: 'success', title: 'Card Added Successfully!' });
        });
    }
}
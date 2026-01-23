import { DOM } from './dom.js';

export function initWallet(TopToast) {
    const btnAddCard = document.querySelector('.btn-add-payment-card');
    const modal = document.getElementById('add-card-modal');
    const btnCancel = document.querySelector('.btn-cancel-modal');
    const btnSubmit = document.querySelector('.btn-submit-card-modal');

    // Open Modal logic
    if(btnAddCard && modal) {
        btnAddCard.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.remove('hidden');
            // Small delay to allow CSS transition
            setTimeout(() => modal.classList.add('open'), 10);
        });
    }

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

    // Submit Logic (Demo)
    if(btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            closeModal();
            TopToast.fire({ icon: 'success', title: 'Card Added Successfully!' });
        });
    }
}
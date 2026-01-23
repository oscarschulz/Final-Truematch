import { DOM } from './dom.js';

export function initHome(TopToast) {
    
    // 1. Compose Actions (Poll, Media, Text)
    if (DOM.composeActions) {
        DOM.composeActions.addEventListener('click', (e) => {
            const target = e.target;
            
            // Media Upload
            if (target.classList.contains('fa-image')) {
                if (DOM.mediaUploadInput) DOM.mediaUploadInput.click();
            }
            // Poll Toggle
            else if (target.classList.contains('fa-square-poll-horizontal') || target.id === 'btn-trigger-poll') {
                if(DOM.pollUI) DOM.pollUI.classList.toggle('hidden');
            }
            // Text Tools Toggle
            else if (target.id === 'btn-trigger-text' || target.innerText === 'Aa') {
                if(DOM.textTools) DOM.textTools.classList.toggle('hidden');
            }
        });
    }

    if (DOM.closePollBtn) {
        DOM.closePollBtn.addEventListener('click', () => {
            if(DOM.pollUI) DOM.pollUI.classList.add('hidden');
        });
    }

    // 2. Global Feed Interactions
    document.addEventListener('click', (e) => {
        // Like Button
        if (e.target.classList.contains('fa-heart')) {
            if (e.target.classList.contains('fa-regular')) {
                e.target.classList.replace('fa-regular', 'fa-solid');
                e.target.style.color = '#ff4757';
                e.target.style.transform = 'scale(1.2)';
                setTimeout(() => e.target.style.transform = 'scale(1)', 200);
            } else {
                e.target.classList.replace('fa-solid', 'fa-regular');
                e.target.style.color = '';
            }
        }
        
        // Comment Toggle
        if (e.target.classList.contains('btn-toggle-comment') || e.target.classList.contains('fa-comment')) {
            const postCard = e.target.closest('.post-card');
            if (postCard) {
                const commentSection = postCard.querySelector('.post-comments-section');
                if (commentSection) commentSection.classList.toggle('hidden');
            }
        }

        // Bookmark
        if (e.target.classList.contains('fa-bookmark')) {
            if (e.target.classList.contains('fa-regular')) {
                e.target.classList.replace('fa-regular', 'fa-solid');
                e.target.style.color = '#64E9EE';
                TopToast.fire({ icon: 'success', title: 'Saved to Collections' });
            } else {
                e.target.classList.replace('fa-solid', 'fa-regular');
                e.target.style.color = '';
            }
        }

        // Tip Button
        if (e.target.classList.contains('fa-dollar-sign') && e.target.closest('.post-actions')) {
            Swal.fire({
                title: 'Send Tip', text: 'Support this creator!', input: 'number', inputLabel: 'Amount ($)', inputPlaceholder: '5.00',
                showCancelButton: true, confirmButtonText: 'Send Tip', confirmButtonColor: '#64E9EE', background: '#0d1423', color: '#fff'
            }).then((result) => {
                if (result.isConfirmed && result.value) {
                    TopToast.fire({ icon: 'success', title: `Sent $${result.value} tip!` });
                }
            });
        }
    });
}
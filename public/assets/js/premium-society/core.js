// assets/js/premium-society/core.js

export const PS_DOM = {
    layout: document.getElementById('psMainLayout'),
    loader: document.getElementById('app-loader'),
    tabs: document.querySelectorAll('.ps-nav-btn'),
    panels: document.querySelectorAll('.ps-panel[data-panel]'),
    sidebar: document.getElementById('psMainSidebar'),
    
    // Header
    headerAvatar: document.getElementById('psHeaderAvatar'),
    headerName: document.getElementById('psWelcomeName'),
    
    // Containers
    dailyPickContainer: document.getElementById('psDailyPickContainer'),
    storiesContainer: document.getElementById('psStoriesContainer'),
    admirerContainer: document.getElementById('psAdmirerContainer'),
    admirerCount: document.getElementById('psAdmirerCount'),
    
    // Matches Containers
    matchesContainer: document.getElementById('psMatchesContainer'), // List
    newMatchesRail: document.getElementById('psNewMatchesRail'),     // Rail
    newMatchCount: document.getElementById('psNewMatchCount'),

    activeNearbyContainer: document.getElementById('psActiveNearbyContainer'),
    
    // Chat Window
    chatWindow: document.getElementById('psChatWindow'),
    btnCloseChat: document.getElementById('psBtnCloseChat'),
    chatAvatar: document.getElementById('psChatAvatar'),
    chatName: document.getElementById('psChatName'),
    chatBody: document.getElementById('psChatBody'),
    chatInput: document.getElementById('psChatInput'),
    chatEmojiPicker: document.getElementById('psChatEmojiPicker'),

    // Story Viewer
    storyViewer: document.getElementById('psStoryViewer'),
    btnCloseStory: document.getElementById('psBtnCloseStory'),
    storyFullImg: document.getElementById('psStoryImageDisplay'),
    storyName: document.getElementById('psStoryName'),
    storyAvatar: document.getElementById('psStoryAvatar'),
    storyProgress: document.getElementById('psStoryProgress'),
    storyCommentInput: document.getElementById('psStoryCommentInput'),
    storyEmojiPicker: document.getElementById('psStoryEmojiPicker'),

    // Add Story Modal
    addStoryModal: document.getElementById('psAddStoryModal'),
    storyInput: document.getElementById('psStoryInput'),

    // Mini Profile
    miniAvatar: document.getElementById('psMiniAvatar'),
    miniName: document.getElementById('psMiniName'),
    miniLogout: document.getElementById('ps-btn-logout'),

    // Refresh Popover
    refreshPopover: document.getElementById('psRefreshPopover'),
    btnRefreshDeck: document.getElementById('psBtnRefreshDeck'),

    // Mobile Toggles
    mobileMenuBtn: document.getElementById('psMobileNavToggle'),
    mobileMomentsBtn: document.getElementById('psMobileMomentsToggle'),
    momentsPopup: document.getElementById('psMomentsPopup'),
    
    // Swipe
    swipeStack: document.getElementById('psSwipeStack'),
    swipeControls: document.getElementById('psSwipeControls'),
    btnSwipePass: document.getElementById('psBtnSwipePass'),
    btnSwipeLike: document.getElementById('psBtnSwipeLike'),
    btnSwipeSuper: document.getElementById('psBtnSwipeSuper'),
    
    // Stats & Toast
    ringCircle: document.getElementById('psStatsRingCircle'),
    countDisplay: document.getElementById('psStatsCountDisplay'),
    toast: document.getElementById('ps-toast'),
    
    // Timer Display
    timerDisplay: document.querySelector('.ps-stats-body p.ps-tiny'),

    // Panels
    panelCreatorsBody: document.getElementById('ps-panel-creators'),
    panelPremiumBody: document.getElementById('ps-panel-premium')
};

export function getRandomColor() {
    const colors = ['#00aff0', '#ff3366', '#3ad4ff', '#800080', '#00ff88', '#333'];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function showToast(msg) {
    if (!PS_DOM.toast) return;
    PS_DOM.toast.innerHTML = `<i class="fa-solid fa-fire"></i> ${msg}`;
    PS_DOM.toast.className = `ps-toast ps-visible`;
    setTimeout(() => PS_DOM.toast.classList.remove('ps-visible'), 3000);
}
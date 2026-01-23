export const DOM = {
    // --- LAYOUT ---
    mainFeedColumn: document.querySelector('.main-feed-column'),
    rightSidebar: document.getElementById('right-sidebar'),
    appLoader: document.getElementById('app-loader'),

    // --- VIEWS ---
    viewHome: document.getElementById('view-home'),
    viewNotif: document.getElementById('view-notifications'),
    viewMessages: document.getElementById('view-messages'),
    viewCollections: document.getElementById('view-collections'),
    viewAddCard: document.getElementById('view-add-card'),
    viewMyProfile: document.getElementById('view-my-profile'), // ADDED

    // --- PROFILE ELEMENTS (NEW) ---
    profileTabPosts: document.getElementById('tab-profile-posts'),
    profileTabMedia: document.getElementById('tab-profile-media'),
    profileContentPosts: document.getElementById('profile-content-posts'),
    profileContentMedia: document.getElementById('profile-content-media'),

    // --- SIDEBAR WIDGETS ---
    rsSuggestions: document.getElementById('rs-suggestions-view'),
    rsCollections: document.getElementById('rs-collections-view'),
    rsWalletView: document.getElementById('rs-wallet-view'),
    
    // Collections Sidebar
    rsTitle: document.getElementById('rs-col-title'),
    rsViewUsers: document.getElementById('rs-view-type-users'),
    rsViewMedia: document.getElementById('rs-view-type-media'),
    rsMediaGrid: document.getElementById('rs-media-grid-content'),
    rsMediaEmpty: document.getElementById('rs-media-empty-state'),

    // --- NAVIGATION ---
    navHome: document.getElementById('nav-link-home'),
    navNotif: document.getElementById('nav-link-notif'),
    navMessages: document.getElementById('nav-link-messages'),
    navCollections: document.getElementById('nav-link-collections'),
    navSubs: document.getElementById('nav-link-subs'),
    navAddCard: document.getElementById('nav-link-add-card'),
    navProfile: document.getElementById('nav-link-profile'), // ADDED
    
    // Mobile
    mobHome: document.getElementById('mob-nav-home'),
    mobNotif: document.getElementById('mob-nav-notif'),
    mobMessages: document.getElementById('mob-nav-messages'),

    // --- GLOBAL POPUPS ---
    themeToggle: document.getElementById('themeToggle'),
    popover: document.getElementById('settings-popover'),
    closePopoverBtn: document.getElementById('btnClosePopover'),
    triggers: [
        document.getElementById('trigger-profile-card'),
        document.getElementById('trigger-more-btn')
    ],
    paymentModal: document.getElementById('payment-modal'),
    btnPayConfirm: document.getElementById('btnPayConfirm'),
    btnPayCancel: document.getElementById('btnPayCancel'),
    btnSubscribe: document.getElementById('btnSubscribe'),

    // --- HOME / COMPOSE ---
    composeActions: document.querySelector('.compose-actions'),
    mediaUploadInput: document.getElementById('media-upload-input'),
    pollUI: document.getElementById('poll-creator-ui'),
    textTools: document.getElementById('text-format-toolbar'),
    closePollBtn: document.querySelector('.close-poll-btn'),

    // --- MESSAGES ---
    btnNewMsg: document.getElementById('btn-new-msg'),
    btnTriggerSearch: document.getElementById('trigger-msg-search'),
    btnCloseSearch: document.getElementById('close-msg-search'),
    msgSearchBox: document.getElementById('msg-search-box'),
    msgSearchInput: document.getElementById('msg-search-input'),
    msgTabs: document.querySelectorAll('#msg-tabs span'),
    msgUserItems: document.querySelectorAll('.msg-user-item'),
    
    // Chat Area
    activeChatAvatar: document.getElementById('active-chat-avatar'),
    activeChatName: document.getElementById('active-chat-name'),
    chatHistoryContainer: document.getElementById('chat-history-container'),
    chatInput: document.getElementById('chat-message-input'),
    btnSendMsg: document.getElementById('btn-send-message'),
    btnEmoji: document.getElementById('btn-emoji-trigger'),
    emojiContainer: document.getElementById('emoji-picker-container'),
    btnPPV: document.getElementById('btn-ppv-trigger'),
    btnChatSearch: document.getElementById('btn-chat-search'),
    chatSearchBar: document.getElementById('chat-inner-search-bar'),
    closeChatSearch: document.getElementById('close-chat-search'),
    chatSearchInput: document.getElementById('chat-history-search'),
    btnChatStar: document.getElementById('btn-chat-star'),

    // Info Panel
    infoNickname: document.getElementById('info-nickname'),
    infoHandle: document.getElementById('info-handle'),
    infoJoined: document.getElementById('info-joined'),
    infoSpent: document.getElementById('info-spent'),

    // --- COLLECTIONS ---
    colListWrapper: document.getElementById('collection-list-wrapper'),
    colBtnSearch: document.getElementById('col-btn-search'),
    colBtnAdd: document.getElementById('col-btn-add'),
    colSearchContainer: document.getElementById('col-search-container'),
    colSearchInput: document.getElementById('col-search-input'),
    colSearchClose: document.getElementById('col-search-close'),
    colTabUsers: document.getElementById('tab-col-users'),
    colTabBookmarks: document.getElementById('tab-col-bookmarks'),

    // --- NOTIFICATIONS ---
    notifPills: document.querySelectorAll('.notif-tabs-bar .n-pill'),

    // --- WALLET ---
    btnAddPaymentCard: document.querySelector('.btn-add-payment-card')
};
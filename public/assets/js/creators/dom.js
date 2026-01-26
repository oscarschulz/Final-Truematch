export const DOM = {
    // --- LAYOUT ---
    mainFeedColumn: document.querySelector('.main-feed-column'),
    rightSidebar: document.getElementById('right-sidebar'),
    appLoader: document.getElementById('app-loader'),

    // --- VIEWS ---
    viewHome: document.getElementById('view-home'),
    viewAddCard: document.getElementById('view-add-card'),     // Form View (Sidebar)
    viewYourCards: document.getElementById('view-your-cards'), // OnlyFans Style View (Popover)
    viewBecomeCreator: document.getElementById('view-become-creator'), // New Creator View
    viewMyProfile: document.getElementById('view-my-profile'),
    
    // FETCHED VIEWS (USE GETTERS)
    get viewMessages() { return document.getElementById('view-messages'); },
    get viewSettings() { return document.getElementById('view-settings'); },
    get viewNotif() { return document.getElementById('view-notifications'); },
    get viewCollections() { return document.getElementById('view-collections'); },

    // --- PROFILE ELEMENTS ---
    profileTabPosts: document.getElementById('tab-profile-posts'),
    profileTabMedia: document.getElementById('tab-profile-media'),
    profileContentPosts: document.getElementById('profile-content-posts'),
    profileContentMedia: document.getElementById('profile-content-media'),

    // --- CARD TABS (YOUR CARDS VIEW) ---
    btnTabCards: document.getElementById('btn-tab-cards'),
    btnTabPayments: document.getElementById('btn-tab-payments'),
    tabContentCards: document.getElementById('tab-content-cards'),
    tabContentPayments: document.getElementById('tab-content-payments'),

    // --- SIDEBAR WIDGETS ---
    rsSuggestions: document.getElementById('rs-suggestions-view'),
    rsCollections: document.getElementById('rs-collections-view'),
    rsWalletView: document.getElementById('rs-wallet-view'),
    rsSettingsView: document.getElementById('rs-settings-view'),
    
    rsTitle: document.getElementById('rs-col-title'),
    rsViewUsers: document.getElementById('rs-view-type-users'),
    rsViewMedia: document.getElementById('rs-view-type-media'),
    rsMediaGrid: document.getElementById('rs-media-grid-content'),
    rsMediaEmpty: document.getElementById('rs-media-empty-state'),

    // --- SETTINGS ELEMENTS ---
    get settingsItems() { return document.querySelectorAll('.set-item'); },
    settingsContents: {
        get profile() { return document.getElementById('set-content-profile'); },
        get account() { return document.getElementById('set-content-account'); },
        get privacy() { return document.getElementById('set-content-privacy'); },
        get display() { return document.getElementById('set-content-display'); },
        get notifications() { return document.getElementById('set-content-notifications'); },
        get subscription() { return document.getElementById('set-content-subscription'); },
        get cards() { return document.getElementById('set-content-cards'); },
        get bank() { return document.getElementById('set-content-bank'); },
        get security() { return document.getElementById('set-content-security'); },
        get help() { return document.getElementById('set-content-help'); }
    },

    // --- NAVIGATION (DESKTOP) ---
    navHome: document.getElementById('nav-link-home'),
    navNotif: document.getElementById('nav-link-notif'),
    navMessages: document.getElementById('nav-link-messages'),
    navCollections: document.getElementById('nav-link-collections'),
    navSubs: document.getElementById('nav-link-subs'),
    navAddCard: document.getElementById('nav-link-add-card'),
    navProfile: document.getElementById('nav-link-profile'),
    
    // --- MOBILE NAVIGATION ---
    mobHome: document.getElementById('mob-nav-home'),
    mobExplore: document.getElementById('mob-nav-explore'),
    mobAdd: document.getElementById('mob-nav-add'),
    mobNotif: document.getElementById('mob-nav-notif'),
    mobMessages: document.getElementById('mob-nav-messages'),

    // --- GLOBAL POPOVERS & BUTTONS ---
    themeToggle: document.getElementById('themeToggle'),
    popover: document.getElementById('settings-popover'),
    closePopoverBtn: document.getElementById('btnClosePopover'),
    btnSettingsPop: document.getElementById('btn-settings-pop'),
    
    get popoverLinks() { return document.querySelectorAll('.pop-item'); },

    get btnMore() { return document.getElementById('trigger-more-btn'); },
    get profileCard() { return document.getElementById('trigger-profile-card'); },

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
    
    get composeInput() { return document.querySelector('.compose-top input'); }, 

    // --- MESSAGES ---
    get btnNewMsg() { return document.getElementById('btn-new-msg'); },
    get btnTriggerSearch() { return document.getElementById('trigger-msg-search'); },
    get btnCloseSearch() { return document.getElementById('close-msg-search'); },
    get msgSearchBox() { return document.getElementById('msg-search-box'); },
    get msgSearchInput() { return document.getElementById('msg-search-input'); },
    get msgTabs() { return document.querySelectorAll('#msg-tabs span'); },
    get msgUserList() { return document.getElementById('msg-user-list'); }, 
    get msgUserItems() { return document.querySelectorAll('.msg-user-item'); },
    
    // Chat Area
    get activeChatAvatar() { return document.getElementById('active-chat-avatar'); },
    get activeChatName() { return document.getElementById('active-chat-name'); },
    get chatHistoryContainer() { return document.getElementById('chat-history-container'); },
    get chatInput() { return document.getElementById('chat-message-input'); },
    get btnSendMsg() { return document.getElementById('btn-send-message'); },
    get btnEmoji() { return document.getElementById('btn-emoji-trigger'); },
    get emojiContainer() { return document.getElementById('emoji-picker-container'); },
    get btnPPV() { return document.getElementById('btn-ppv-trigger'); },
    get btnChatSearch() { return document.getElementById('btn-chat-search'); },
    get chatSearchBar() { return document.getElementById('chat-inner-search-bar'); },
    get closeChatSearch() { return document.getElementById('close-chat-search'); },
    get chatSearchInput() { return document.getElementById('chat-history-search'); },
    get btnChatStar() { return document.getElementById('btn-chat-star'); },

    // Info Panel
    get infoNickname() { return document.getElementById('info-nickname'); },
    get infoHandle() { return document.getElementById('info-handle'); },
    get infoJoined() { return document.getElementById('info-joined'); },
    get infoSpent() { return document.getElementById('info-spent'); },

    // --- COLLECTIONS ---
    get colListWrapper() { return document.getElementById('collection-list-wrapper'); },
    get colBtnSearch() { return document.getElementById('col-btn-search'); },
    get colBtnAdd() { return document.getElementById('col-btn-add'); },
    get colSearchContainer() { return document.getElementById('col-search-container'); },
    get colSearchInput() { return document.getElementById('col-search-input'); },
    get colSearchClose() { return document.getElementById('col-search-close'); },
    get colTabUsers() { return document.getElementById('tab-col-users'); },
    get colTabBookmarks() { return document.getElementById('tab-col-bookmarks'); },

    // --- NOTIFICATIONS ---
    get notifPills() { return document.querySelectorAll('.notif-tabs-bar .n-pill'); },

    // --- WALLET ---
    btnAddPaymentCard: document.querySelector('.btn-add-payment-card')
};
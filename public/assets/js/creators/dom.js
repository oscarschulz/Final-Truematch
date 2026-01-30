export const DOM = {
    // --- LAYOUT ---
    get mainFeedColumn() { return document.querySelector('.main-feed-column'); },
    get rightSidebar() { return document.getElementById('right-sidebar'); },
    get appLoader() { return document.getElementById('app-loader'); },

    // --- VIEWS (Static & Dynamic) ---
    get viewHome() { return document.getElementById('view-home'); },
    get viewAddCard() { return document.getElementById('view-add-card'); },
    get viewYourCards() { return document.getElementById('view-your-cards'); },
    get viewBecomeCreator() { return document.getElementById('view-become-creator'); },
    get viewMyProfile() { return document.getElementById('view-my-profile'); },
    
    // FETCHED VIEWS
    get viewMessages() { return document.getElementById('view-messages'); },
    get viewSettings() { return document.getElementById('view-settings'); },
    get viewNotif() { return document.getElementById('view-notifications'); },
    get viewCollections() { return document.getElementById('view-collections'); },

    // --- PROFILE ELEMENTS (Dynamic Updates) ---
    get profileName() { return document.querySelector('#view-my-profile h1'); },
    get profileHandle() { return document.querySelector('#view-my-profile .ph-handle-text'); }, 
    get profileBio() { return document.querySelector('#view-my-profile .profile-bio-text'); }, 
    get profileHeaderImg() { return document.querySelector('#view-my-profile .profile-header-bg'); },
    get profileAvatar() { return document.querySelector('#view-my-profile .profile-avatar-main'); }, 
    get btnEditProfile() { return document.getElementById('btn-edit-profile'); },
    get backToHomeBtn() { return document.querySelector('#view-my-profile .back-btn'); },

    get profileTabPosts() { return document.getElementById('tab-profile-posts'); },
    get profileTabMedia() { return document.getElementById('tab-profile-media'); },
    get profileContentPosts() { return document.getElementById('profile-content-posts'); },
    get profileContentMedia() { return document.getElementById('profile-content-media'); },

    // --- CARD TABS ---
    get btnTabCards() { return document.getElementById('btn-tab-cards'); },
    get btnTabPayments() { return document.getElementById('btn-tab-payments'); },
    get tabContentCards() { return document.getElementById('tab-content-cards'); },
    get tabContentPayments() { return document.getElementById('tab-content-payments'); },

    // --- SIDEBAR WIDGETS ---
    get rsSuggestions() { return document.getElementById('rs-suggestions-view'); },
    get rsCollections() { return document.getElementById('rs-collections-view'); },
    get rsWalletView() { return document.getElementById('rs-wallet-view'); },
    get rsSettingsView() { return document.getElementById('rs-settings-view'); },
    
    get rsTitle() { return document.getElementById('rs-col-title'); },
    get rsViewUsers() { return document.getElementById('rs-view-type-users'); },
    get rsViewMedia() { return document.getElementById('rs-view-type-media'); },
    get rsMediaGrid() { return document.getElementById('rs-media-grid-content'); },
    get rsMediaEmpty() { return document.getElementById('rs-media-empty-state'); },

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

    // --- NAVIGATION ---
    get navHome() { return document.getElementById('nav-link-home'); },
    get navNotif() { return document.getElementById('nav-link-notif'); },
    get navMessages() { return document.getElementById('nav-link-messages'); },
    get navCollections() { return document.getElementById('nav-link-collections'); },
    get navSubs() { return document.getElementById('nav-link-subs'); },
    get navAddCard() { return document.getElementById('nav-link-add-card'); },
    get navProfile() { return document.getElementById('nav-link-profile'); },
    
    // --- MOBILE NAVIGATION ---
    get mobHome() { return document.getElementById('mob-nav-home'); },
    get mobExplore() { return document.getElementById('mob-nav-explore'); },
    get mobAdd() { return document.getElementById('mob-nav-add'); },
    get mobNotif() { return document.getElementById('mob-nav-notif'); },
    get mobMessages() { return document.getElementById('mob-nav-messages'); },

    // --- GLOBAL POPOVERS ---
    get themeToggle() { return document.getElementById('themeToggle'); },
    get popover() { return document.getElementById('settings-popover'); },
    get closePopoverBtn() { return document.getElementById('btnClosePopover'); },
    get btnSettingsPop() { return document.getElementById('btn-settings-pop'); },
    
    get popoverLinks() { return document.querySelectorAll('.pop-item'); },
    get btnMore() { return document.getElementById('trigger-more-btn'); },
    get profileCard() { return document.getElementById('trigger-profile-card'); },

    get paymentModal() { return document.getElementById('payment-modal'); },
    get btnPayConfirm() { return document.getElementById('btnPayConfirm'); },
    get btnPayCancel() { return document.getElementById('btnPayCancel'); },
    get btnSubscribe() { return document.getElementById('btnSubscribe'); },

    // --- HOME / COMPOSE ---
    get composeActions() { return document.querySelector('.compose-actions'); },
    get mediaUploadInput() { return document.getElementById('media-upload-input'); },
    get pollUI() { return document.getElementById('poll-creator-ui'); },
    get textTools() { return document.getElementById('text-format-toolbar'); },
    get closePollBtn() { return document.querySelector('.close-poll-btn'); },
    get composeInput() { return document.getElementById('compose-input'); }, 
    get btnPostSubmit() { return document.getElementById('btn-post-submit'); },
    get creatorFeed() { return document.getElementById('creator-feed'); },
    get feedEmptyState() { return document.querySelector('.feed-empty-state'); },

    // --- MESSAGES ---
    get btnNewMsg() { return document.getElementById('btn-new-msg'); },
    get btnTriggerSearch() { return document.getElementById('trigger-msg-search'); },
    get btnCloseSearch() { return document.getElementById('close-msg-search'); },
    get msgSearchBox() { return document.getElementById('msg-search-box'); },
    get msgSearchInput() { return document.getElementById('msg-search-input'); },
    get msgTabs() { return document.querySelectorAll('#msg-tabs span'); },
    get msgUserList() { return document.getElementById('msg-user-list'); }, 
    get msgUserItems() { return document.querySelectorAll('.msg-user-item'); },
    
    // 🔥 NEW MESSAGE UI SELECTORS 🔥
    get newMsgOverlay() { return document.getElementById('new-msg-overlay'); },
    get btnCloseNewMsg() { return document.getElementById('btn-close-new-msg'); },
    get newMsgResults() { return document.getElementById('new-msg-results'); },
    get newMsgInput() { return document.querySelector('.new-msg-search input'); },

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
    get notifGearBtn() { return document.getElementById('notif-btn-settings'); },
    get notifSearchBtn() { return document.getElementById('notif-btn-search'); },
    get notifSearchContainer() { return document.getElementById('notif-search-container'); },
    get notifSearchInput() { return document.getElementById('notif-search-input'); },
    get notifPills() { return document.querySelectorAll('.notif-tabs-bar .n-pill'); },

    // --- WALLET ---
    get btnAddPaymentCard() { return document.querySelector('.btn-add-payment-card'); }
};
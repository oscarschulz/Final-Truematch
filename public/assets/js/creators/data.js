export const BLANK_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20fill%3D%22%23222%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3C%2Fsvg%3E';
export const DEFAULT_AVATAR = 'assets/images/truematch-mark.png';

export let COLLECTIONS_DB = [
    { id: 'fans', name: 'Fans', type: 'user', count: 120, system: true },
    { id: 'following', name: 'Following', type: 'user', count: 45, system: true },
    { id: 'restricted', name: 'Restricted', type: 'user', count: 2, system: true },
    { id: 'blocked', name: 'Blocked', type: 'user', count: 5, system: true },
    { id: 'favorites', name: 'Favorite Posts', type: 'post', count: 10, system: true },
    { id: 'watch_later', name: 'Watch Later', type: 'post', count: 3, system: false }
];

export const CHAT_DATA = {
    1: [
        { type: 'received', text: 'Hey! I saw your new post. Looks great!', time: '10:30 AM' },
        { type: 'sent', text: 'Thanks! Glad you liked it. 😊', time: '10:32 AM' },
        { type: 'received', text: 'Are you planning to release more content like that?', time: '10:33 AM' },
        { type: 'sent', text: 'Yes, actually working on a new set right now!', time: '10:35 AM' }
    ]
};

// --- LANGUAGE DICTIONARY ---
export const TRANSLATIONS = {
    'en': {
        name: 'English',
        // Sidebar
        nav_home: 'Home', nav_notif: 'Notifications', nav_msg: 'Messages', nav_col: 'Collections', nav_subs: 'Subscriptions', nav_card: 'Add card', nav_profile: 'My profile', nav_more: 'More', nav_post: 'NEW POST',
        // Settings Menu
        set_header: 'SETTINGS',
        set_profile: 'Profile', set_profile_desc: 'Edit details, avatar, cover',
        set_account: 'Account', set_account_desc: 'Username, email, phone',
        set_privacy: 'Privacy and safety', set_privacy_desc: 'Discoverability, message privacy',
        set_security: 'Security', set_security_desc: 'Password, 2FA, Sessions',
        set_notif: 'Notifications', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Subscription price', set_sub_desc: 'Bundles, promotions',
        set_pay_title: 'Payments',
        set_cards: 'Your cards', set_cards_desc: 'To subscribe',
        set_bank: 'Bank details', set_bank_desc: 'To earn',
        set_gen_title: 'General',
        set_display: 'Display', set_display_desc: 'Dark mode, language',
        set_help: 'Help and support', set_help_desc: 'FAQ, Support tickets',
        // Popover
        pop_profile: 'My profile', pop_col: 'Collections', pop_set: 'Settings',
        pop_cards: 'Your cards', pop_cards_sub: '(to subscribe)',
        pop_creator: 'Become a creator', pop_creator_sub: '(to earn)',
        pop_help: 'Help and support', pop_dark: 'Dark mode', pop_logout: 'Log out',
        // Settings Content
        lbl_lang: 'Language', lbl_dark: 'Dark Mode',
        // Cards UI
        card_tab_cards: 'YOUR CARDS', card_tab_pay: 'PAYMENTS',
        card_alert: 'Please add a new card to subscribe to other users or recharge your wallet.',
        card_compliant: 'We are fully compliant with Payment Card Industry Data Security Standards.',
        card_statement: 'The charges on your credit card statement will appear as iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    },
    'ph': {
        name: 'Filipino (Tagalog)',
        nav_home: 'Home', nav_notif: 'Abiso', nav_msg: 'Mensahe', nav_col: 'Koleksyon', nav_subs: 'Subscriptions', nav_card: 'Maglagay ng Card', nav_profile: 'Aking Profile', nav_more: 'Iba pa', nav_post: 'POST',
        set_header: 'SETTINGS',
        set_profile: 'Profile', set_profile_desc: 'Palitan ang detalye, avatar',
        set_account: 'Account', set_account_desc: 'Username, email, telepono',
        set_privacy: 'Privacy at Ligtas', set_privacy_desc: 'Sino makakakita sayo',
        set_security: 'Seguridad', set_security_desc: 'Password, 2FA',
        set_notif: 'Abiso', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Presyo ng Subskripsyon', set_sub_desc: 'Bundles, promosyon',
        set_pay_title: 'Bayad',
        set_cards: 'Iyong mga Card', set_cards_desc: 'Pambayad',
        set_bank: 'Bangko', set_bank_desc: 'Payouts at Kita',
        set_gen_title: 'Pangkalahatan',
        set_display: 'Itsura', set_display_desc: 'Dark mode, wika',
        set_help: 'Tulong', set_help_desc: 'FAQ, Tickets',
        pop_profile: 'Aking profile', pop_col: 'Koleksyon', pop_set: 'Settings',
        pop_cards: 'Mga Card', pop_cards_sub: '(pambayad)',
        pop_creator: 'Maging Creator', pop_creator_sub: '(kumita)',
        pop_help: 'Tulong at Suporta', pop_dark: 'Dark mode', pop_logout: 'Mag-logout',
        lbl_lang: 'Wika', lbl_dark: 'Dark Mode',
        card_tab_cards: 'MGA CARD MO', card_tab_pay: 'MGA BAYAD',
        card_alert: 'Maglagay ng card para makapag-subscribe sa iba o lagyan ng laman ang wallet.',
        card_compliant: 'Kami ay fully compliant sa Payment Card Industry Data Security Standards.',
        card_statement: 'Ang lalabas sa statement ng iyong credit card ay iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    },
    'es': {
        name: 'Español',
        nav_home: 'Inicio', nav_notif: 'Notificaciones', nav_msg: 'Mensajes', nav_col: 'Colecciones', nav_subs: 'Suscripciones', nav_card: 'Añadir tarjeta', nav_profile: 'Mi perfil', nav_more: 'Más', nav_post: 'PUBLICAR',
        set_header: 'CONFIGURACIÓN',
        set_profile: 'Perfil', set_profile_desc: 'Editar detalles, avatar',
        set_account: 'Cuenta', set_account_desc: 'Usuario, email, teléfono',
        set_privacy: 'Privacidad', set_privacy_desc: 'Visibilidad, mensajes',
        set_security: 'Seguridad', set_security_desc: 'Contraseña, 2FA',
        set_notif: 'Notificaciones', set_notif_desc: 'Push, Email, Telegram',
        set_sub: 'Precio de suscripción', set_sub_desc: 'Paquetes, promociones',
        set_pay_title: 'Pagos',
        set_cards: 'Tus tarjetas', set_cards_desc: 'Para suscribirse',
        set_bank: 'Detalles bancarios', set_bank_desc: 'Pagos y Ganancias',
        set_gen_title: 'General',
        set_display: 'Pantalla', set_display_desc: 'Modo oscuro, idioma',
        set_help: 'Ayuda', set_help_desc: 'FAQ, Soporte',
        pop_profile: 'Mi perfil', pop_col: 'Colecciones', pop_set: 'Ajustes',
        pop_cards: 'Tus tarjetas', pop_cards_sub: '(para suscribirse)',
        pop_creator: 'Ser creador', pop_creator_sub: '(para ganar)',
        pop_help: 'Ayuda y soporte', pop_dark: 'Modo oscuro', pop_logout: 'Cerrar sesión',
        lbl_lang: 'Idioma', lbl_dark: 'Modo oscuro',
        card_tab_cards: 'TUS TARJETAS', card_tab_pay: 'PAGOS',
        card_alert: 'Por favor añade una tarjeta para suscribirte a otros usuarios.',
        card_compliant: 'Cumplimos totalmente con los estándares de seguridad de datos.',
        card_statement: 'Los cargos en tu estado de cuenta aparecerán como iTrueMatch',
        card_footer_1: 'Fenix International Limited, 9th Floor, 107 Cheapside, London, EC2V 6DN',
        card_footer_2: 'Fenix Internet LLC, 1000 N.West Street, Suite 1200, Wilmington, Delaware, 19801 USA'
    }
};
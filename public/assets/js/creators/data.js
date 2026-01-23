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
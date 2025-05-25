
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import CONFIG from './config';

// Do precaching
precacheAndRoute(self.__WB_MANIFEST);

// Runtime caching
registerRoute(
    ({ url }) => {
        return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com';
    },
    new CacheFirst({
        cacheName: 'google-fonts',
    }),
);
registerRoute(
    ({ url }) => {
        return url.origin === 'https://cdnjs.cloudflare.com' || url.origin.includes('fontawesome');
    },
    new CacheFirst({
        cacheName: 'fontawesome',
    }),
);
registerRoute(
    ({ url }) => {
        return url.origin === 'https://ui-avatars.com';
    },
    new CacheFirst({
        cacheName: 'avatars-api',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    }),
);
registerRoute(
    ({ request, url }) => {
        const baseUrl = new URL(CONFIG.BASE_URL);
        return baseUrl.origin === url.origin && request.destination !== 'image';
    },
    new NetworkFirst({
        cacheName: 'story-share-api',
    }),
);
registerRoute(
    ({ request, url }) => {
        const baseUrl = new URL(CONFIG.BASE_URL);
        return baseUrl.origin === url.origin && request.destination === 'image';
    },
    new StaleWhileRevalidate({
        cacheName: 'story-share-api-images',
    }),
);
registerRoute(
    ({ url }) => {
        return url.origin.includes('maptiler');
    },
    new CacheFirst({
        cacheName: 'maptiler-api',
    }),
);

self.addEventListener('push', (event) => {
    console.log('Service worker pushing...');

    async function chainPromise() {
        let title = 'Story berhasil dibuat';
        let body = 'Anda telah membuat story baru';
        let data = {};

        // Check if push event has data
        if (event.data) {
            try {
                const pushData = event.data.json();
                console.log('Push data received:', pushData);

                // Extract title and body from push data
                title = pushData.title || title;
                body = pushData.options.body || body;
                data = pushData.data || {};

                // DEBUG
                console.log("New body :", body);

            } catch (error) {
                console.error('Error parsing push data:', error);
                // Fallback to default message
                body = 'Anda telah membuat story baru dengan deskripsi ...';
            }
        } else {
            // No data received, use default message
            body = 'Anda telah membuat story baru dengan deskripsi ...';
        }

        await self.registration.showNotification(title, {
            body: body,
            data: data,
            requireInteraction: false,
        });
    }

    event.waitUntil(chainPromise());
});
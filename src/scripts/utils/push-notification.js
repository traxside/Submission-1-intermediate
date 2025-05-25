
import { subscribeNotification, unsubscribeNotification } from '../data/api.js';
import Auth from '../data/auth.js';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

class PushNotificationManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.registration = null;
        this.subscription = null;
    }

    // Check if push notifications are supported
    isNotificationSupported() {
        return this.isSupported;
    }

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Push notifications are not supported');
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    // Check current permission status
    getPermissionStatus() {
        if (!this.isSupported) return 'unsupported';
        return Notification.permission;
    }

    // Register service worker
    async registerServiceWorker() {
        if (!this.isSupported) {
            throw new Error('Service Worker is not supported');
        }

        try {
            this.registration = await navigator.serviceWorker.register('./sw.bundle.js');
            console.log('Service Worker registered:', this.registration);
            return this.registration;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    // Convert VAPID key to Uint8Array
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Subscribe to push notifications
    async subscribe() {
        try {
            // Check permission
            const hasPermission = await this.requestPermission();
            if (!hasPermission) {
                throw new Error('Permission denied for notifications');
            }

            // Register service worker if not already registered
            if (!this.registration) {
                await this.registerServiceWorker();
            }

            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;

            // Subscribe to push manager
            const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            console.log('Push subscription:', this.subscription);

            // Send subscription to server
            const user = Auth.getUser();
            const token = Auth.getToken();
            console.log("This is inside user :", user);
            if (!user || !user.id) {
                throw new Error('User not authenticated');
            }

            const result = await subscribeNotification(token, this.subscription.toJSON());
            console.log('Subscription sent to server:', result);
            new Notification('Subscription created successfully', { body: 'Kamu sudah berhasil mengaktifkan notification untuk story-app-share'});
            return {
                success: true,
                subscription: this.subscription,
                message: 'Successfully subscribed to push notifications'
            };

        } catch (error) {
            console.error('Subscribe error:', error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe() {
        try {
            if (!this.subscription) {
                // Try to get existing subscription
                if (this.registration) {
                    this.subscription = await this.registration.pushManager.getSubscription();
                }
            }

            if (!this.subscription) {
                throw new Error('No active subscription found');
            }

            // Unsubscribe from push manager
            const success = await this.subscription.unsubscribe();

            if (success) {
                // Notify server about unsubscription
                const user = Auth.getUser();
                const token = Auth.getToken();
                if (user && user.id) {
                    try {
                        await unsubscribeNotification(token, this.subscription.endpoint);
                        console.log('Unsubscription sent to server');
                    } catch (serverError) {
                        console.warn('Failed to notify server about unsubscription:', serverError);
                    }
                }

                this.subscription = null;
                return {
                    success: true,
                    message: 'Successfully unsubscribed from push notifications'
                };
            } else {
                throw new Error('Failed to unsubscribe');
            }

        } catch (error) {
            console.error('Unsubscribe error:', error);
            throw error;
        }
    }

    // Check if user is currently subscribed
    async isSubscribed() {
        try {
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.getRegistration();
            }

            if (!this.registration) {
                return false;
            }

            this.subscription = await this.registration.pushManager.getSubscription();
            return !!this.subscription;

        } catch (error) {
            console.error('Error checking subscription status:', error);
            return false;
        }
    }

    // Get current subscription
    async getSubscription() {
        try {
            if (!this.registration) {
                this.registration = await navigator.serviceWorker.getRegistration();
            }

            if (!this.registration) {
                return null;
            }

            this.subscription = await this.registration.pushManager.getSubscription();
            return this.subscription;

        } catch (error) {
            console.error('Error getting subscription:', error);
            return null;
        }
    }
}

// Create singleton instance
const pushNotificationManager = new PushNotificationManager();

export default pushNotificationManager;
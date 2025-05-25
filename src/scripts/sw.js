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
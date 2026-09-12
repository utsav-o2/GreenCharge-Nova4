export function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      resolve(null);
    }, 8000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation error:", error);
        clearTimeout(timeoutId);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

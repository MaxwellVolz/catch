// src/handlers/markerUpdate.js

export function updateMarkers(balls, markers) {
    balls.forEach(ball => {
        const marker = markers.get(ball.id);
        if (marker) {
            const yPosition = ball.mesh.position.y;
            marker.position.set(ball.mesh.position.x, 0.01, ball.mesh.position.z);  // Update marker position below the ball

            // Adjust marker opacity based on y position
            const opacity = Math.min(0.8, yPosition / 10 * 0.8);
            marker.material.opacity = opacity;

            const scale = Math.max(0.5, yPosition / 10);  // Scale based on Y position, with a minimum scale
            marker.scale.set(scale, scale, scale);
        }
    });
}

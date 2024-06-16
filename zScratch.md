

Get-Content '.\game-client\src\index.js','.\game-client\src\components\player.js','.\game-client\src\utils\initEnvironment.js','.\game-client\src\utils\networking.js','.\game-server\src\server.js', '.\game-client\src\utils\eventHandlers.js' | Out-File all_scripts.js




    function createMarker() {
        const geometry = new CircleGeometry(0.5, 32);
        const material = new MeshBasicMaterial({ color: 0xffff00 });
        const marker = new Mesh(geometry, material);
        marker.rotation.x = -Math.PI / 2;
        return marker;
    }
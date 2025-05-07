document.querySelectorAll('.button-link').forEach(link => {
    link.addEventListener('click', function(event) {
        event.preventDefault();

        const href = this.getAttribute('href');

        const sound = document.getElementById("buttonClick");
        sound.currentTime = 0;
        sound.volume = 0.3;

        sound.play().then(() => {
            setTimeout(() => {
                if (this.id === 'startButton') {
                    const selectedMode = document.getElementById('gameModeSelect').value;
                    if (selectedMode === 'wave') {
                        window.location.href = './html/game2.html';
                    } else {
                        window.location.href = './html/game1.html';
                    }
                } else {
                    window.location.href = href;
                }
            }, 200);
        }).catch(() => {
            window.location.href = href;
        });
    });
});

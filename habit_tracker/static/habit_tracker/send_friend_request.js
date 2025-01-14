document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.send_friend_request').forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const receiver_id = button.dataset.userId; // Get user ID from the button
            const token = document.querySelector('[name=csrfmiddlewaretoken]').value; // Get CSRF token

            fetch('/habit_tracker/api/habit_tracker/send_friend_request/', {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'X-CSRFToken': token,
                },
                body: JSON.stringify({ receiver_id: receiver_id }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    button.classList.add('animate__animated', 'animate__zoomOutLeft');
                    setTimeout(() => {
                        button.classList.remove('animate__zoomOutLeft');
                        button.innerHTML = '<i class="fas fa-handshake"></i> Request Pending';
                        button.classList.remove('btn-primary');
                        button.classList.add('btn-secondary', 'animate__zoomInLeft');
                        button.classList.remove('send_friend_request');
                    }, 1000);
                    console.log(data.message);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => console.log('Error sending request: ', error));
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.accept-friend-request').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.dataset.requestId;
            handleFriendRequest(requestId, 'accept', button);
        });
    });

    document.querySelectorAll('.deny-friend-request').forEach(button => {
        button.addEventListener('click', () => {
            const requestId = button.dataset.requestId;
            handleFriendRequest(requestId, 'deny', button);
        });
    });
});

function handleFriendRequest(requestId, action, button) {
    const token = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(`/habit_tracker/api/habit_tracker/friend_request/${action}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': token,
        },
        body: JSON.stringify({ request_id: requestId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Friend request ${action}ed successfully.`);
            
            // Remove the notification from the DOM
            const notificationElement = button.closest('.notification-item'); // Assuming each notification has a specific wrapper
            if (notificationElement) {
                notificationElement.remove();
            }
        } else {
            console.log(data.message || "Something went wrong.");
        }
    })
    .catch(error => console.error('Error handling friend request:', error));
}

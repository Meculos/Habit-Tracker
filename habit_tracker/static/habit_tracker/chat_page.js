document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('#chat-messages');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const friendId = document.querySelector('#send-button').dataset.friendId;

    // Function to create a new message element in the chat
    const createMessageElement = (msg, isOutgoing, profilePictureUrl = null) => {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', isOutgoing ? 'outgoing' : 'incoming', 'd-flex', 'mb-3', 'align-items-end');

        if (!isOutgoing && profilePictureUrl) {
            const profileImg = document.createElement('img');
            profileImg.src = profilePictureUrl;
            profileImg.alt = "Friend's Profile";
            profileImg.classList.add('profile-picture', 'rounded-circle', 'me-3');
            profileImg.style.width = '40px';
            profileImg.style.height = '40px';
            profileImg.style.objectFit = 'cover';
            messageRow.appendChild(profileImg);
        }

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content', 'p-3', 'rounded');
        messageContent.style.backgroundColor = isOutgoing ? 'lightblue' : '#f1f1f1';

        const messageText = document.createElement('p');
        messageText.classList.add('mb-1');
        messageText.style.whiteSpace = 'pre-wrap';
        messageText.textContent = msg.message;

        const messageTimestamp = document.createElement('small');
        messageTimestamp.classList.add('text-muted');
        messageTimestamp.textContent = msg.timestamp;

        messageContent.appendChild(messageText);
        messageContent.appendChild(messageTimestamp);
        messageRow.appendChild(messageContent);

        return messageRow;
    };

    // Load messages dynamically
    fetch(`/habit_tracker/api/habit_tracker/load_messages/${friendId}/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        }
    })
        .then(response => response.json())
        .then(data => {
            data.messages.reverse().forEach(msg => {
                const isOutgoing = msg.sender === msg.user; // Replace with the correct username check
                const profilePictureUrl = isOutgoing ? null : msg.sender_profile_picture_url; // Customize profile picture logic
                const messageElement = createMessageElement(msg, isOutgoing, profilePictureUrl);
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        })
        .catch(error => console.error('Error loading messages:', error));

    // Send a message
    document.querySelector('#send-button').addEventListener('click', () => {
        const messageInput = document.querySelector('#chat-input');
        const messageContent = messageInput.value;

        if (!messageContent.trim()) return; // Prevent sending empty messages

        fetch('/habit_tracker/api/habit_tracker/send_message/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            body: JSON.stringify({
                receiver_id: friendId,
                message: messageContent,
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const messageElement = createMessageElement({
                        message: messageContent,
                        timestamp: data.timestamp,
                    }, true);
                    chatMessages.appendChild(messageElement);
                    messageInput.value = '';
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                } else {
                    console.error('Failed to send message:', data.message);
                }
            })
            .catch(error => console.error('Error sending message:', error));
    });
});

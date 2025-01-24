document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('#chat-messages');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const friendId = document.querySelector('#send-button').dataset.friendId;
    console.log(friendId)

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

    const chatSocket = new WebSocket(
        `ws://${window.location.host}/ws/chat/${friendId}/`
    );

    chatSocket.onopen = () => {
        console.log('WebSocket is open!');
    };

    chatSocket.onmessage = (event) => {
        console.log('Message received:', event.data);
        const data = JSON.parse(event.data);
        const isOutgoing = data.sender_id === parseInt(document.querySelector('#user-id').value);
        const messageElement = createMessageElement({
            message: data.message,
            timestamp: new Date().toLocaleString(),
        }, isOutgoing);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
    
    chatSocket.onclose = () => {
        console.log('WebSocket closed.');
    };

    document.querySelector('#send-button').addEventListener('click', () => {
        const messageInput = document.querySelector('#chat-input');
        const messageContent = messageInput.value;

        if (!messageContent.trim()) return;

        chatSocket.send(JSON.stringify({
            message: messageContent,
        }));
        messageInput.value = '';
    });
});

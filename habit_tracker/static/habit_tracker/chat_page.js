document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.querySelector('#chat-messages');
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const friendId = document.querySelector('#send-button').dataset.friendId;
    const userId = parseInt(document.querySelector('#user-id').value); // The current user

    chatMessages.scrollTop = chatMessages.scrollHeight;

    const createMessageElement = (msg, isOutgoing, senderProfilePictureUrl) => {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', isOutgoing ? 'outgoing' : 'incoming', 'd-flex', 'mb-3', 'align-items-end');
    
        // Add profile picture for incoming and outgoing messages
        if (!isOutgoing) {
            // For incoming message, include the friend's profile picture
            const profilePicture = document.createElement('img');
            profilePicture.src = senderProfilePictureUrl; // Assuming the URL is passed
            profilePicture.alt = "Friend's Profile";
            profilePicture.classList.add('profile-picture', 'rounded-circle', 'me-3');
            profilePicture.style.width = '40px';
            profilePicture.style.height = '40px';
            profilePicture.style.objectFit = 'cover';
            messageRow.appendChild(profilePicture);
        }
    
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content', 'p-3', 'rounded');
        messageContent.style.backgroundColor = isOutgoing ? 'gray' : '#f1f1f1';
    
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

    chatSocket.onopen = () => console.log('WebSocket connection established.');

    chatSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
    
        console.log('Full data received via WebSocket:', data); // Always log the incoming data to debug
    
        // Determine if the message is sent by the current user (outgoing)
        const isOutgoing = data.sender_id === userId;
    
        // URL of the sender's profile picture
        const senderProfilePictureUrl = data.profile_picture_url || '';
    
        if (isOutgoing) {
            console.log('Sent message. No need to append for sender.');
            if (senderProfilePictureUrl) {
                console.log('Outgoing message profile picture URL found:', senderProfilePictureUrl);
            } else {
                console.log('Outgoing message profile picture URL not found.');
            }
            return; // Early return for outgoing messages
        }
    
        if (!isOutgoing) {
            console.log('Message received from another user.');
            console.log('Profile picture URL for incoming message:', senderProfilePictureUrl);
        }
    
        // Append the incoming message along with profile picture
        const messageElement = createMessageElement({
            message: data.message,
            timestamp: data.timestamp,
        }, false, senderProfilePictureUrl); // Pass profilePictureUrl as a separate argument        
    
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };    

    chatSocket.onclose = () => console.log('WebSocket connection closed.');

    const sendMessage = () => {
        const messageInput = document.querySelector('#chat-input');
        const messageContent = messageInput.value.trim();

        if (!messageContent) return;

        // Add the message to the sender's chat immediately
        const messageElement = createMessageElement({
            message: messageContent,
            timestamp: new Date().toLocaleString(), // Placeholder timestamp
        }, true); // `true` for outgoing messages

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Send the message to the WebSocket server
        chatSocket.send(JSON.stringify({
            message: messageContent,
            sender_id: userId, // Add sender's ID to the message payload
        }));

        messageInput.value = ''; // Clear the input box
    };

    // Event listener for send button
    document.querySelector('#send-button').addEventListener('click', sendMessage);

    // Optional: Enable sending message on pressing Enter
    document.querySelector('#chat-input').addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
});

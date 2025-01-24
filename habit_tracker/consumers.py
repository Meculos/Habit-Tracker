from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import json
import logging
from .models import ChatMessage, CustomUser

logger = logging.getLogger("habit_tracker")

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.current_user_id = self.scope['user'].id
        self.friend_id = int(self.scope['url_route']['kwargs']['friend_id'])  # Save friend_id to instance attribute
        print(f"User {self.current_user_id} is connecting.")
        print(f"Friend ID from URL: {self.friend_id}")

        # Ensure both users connect to the same room group
        self.room_group_name = f'chat_{min(self.current_user_id, self.friend_id)}_{max(self.current_user_id, self.friend_id)}'

        # Log the room group name for debugging
        logger.info(f"User {self.current_user_id} connecting to room: {self.room_group_name}")

        # Join the WebSocket group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()

    async def disconnect(self, close_code):
        logger.info(f"User {self.scope['user']} disconnecting from room group: {self.room_group_name}")
        # Leave the WebSocket group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name,
        )

    # In your ChatConsumer
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data['message']
        sender_id = self.scope['user'].id
        friend_user_id = int(self.scope['url_route']['kwargs']['friend_id'])

        # Fetch the sender's profile picture
        sender = await sync_to_async(CustomUser.objects.get)(id=sender_id)
        profile_picture_url = sender.profile_picture.url
        logger.info(f"url for profile picture: {profile_picture_url}")
        # Save the message
        message = await sync_to_async(ChatMessage.objects.create)(
            sender_id=sender_id,
            receiver_id=friend_user_id,
            content=message_content,
        )

        # Broadcast to WebSocket group with profile picture URL
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message.content,
                'sender_id': sender_id,
                'timestamp': str(message.timestamp),
                'profile_picture_url': profile_picture_url,  # Send profile picture URL along with the message
            }
        )

        logger.info(f"Message broadcast to room group: {self.room_group_name}, Message content: {message.content}")

    async def chat_message(self, event):
        # Log the broadcast event
        logger.info(f"Broadcasting to group {self.room_group_name}: {event['message']} by user {event['sender_id']}")
        # Send the message to WebSocket clients
        logger.info(f"Sending message with profile picture: {event['profile_picture_url']}")
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'timestamp': event['timestamp'],
            'profile_picture_url': event['profile_picture_url'],
        }))
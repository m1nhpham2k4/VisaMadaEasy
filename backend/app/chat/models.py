from ..extensions import db 
from datetime import datetime, timezone
# from ..auth.models import User # Only if direct Python-level reference to User class is needed here

class ChatSession(db.Model):
    __tablename__ = 'chat_session'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_chat_session_user_id'), nullable=False)
    title = db.Column(db.String(100), nullable=False, default="New Chat")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    is_pinned = db.Column(db.Boolean, default=False)
    messages = db.relationship('ChatMessage', backref='session', lazy=True, cascade="all, delete-orphan")

    # Optional: Define the relationship to User if you need to access session.user directly
    # user = db.relationship('User', backref=db.backref('chat_sessions', lazy='dynamic', cascade="all, delete-orphan"))

    def __repr__(self):
        return f'<ChatSession {self.id} - {self.title}>'

class ChatMessage(db.Model):
    __tablename__ = 'chat_message'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_session.id', name='fk_chat_message_session_id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False) 
    text = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<ChatMessage {self.id} from {self.sender}>' 
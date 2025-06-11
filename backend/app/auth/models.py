from ..extensions import db 
import bcrypt
from datetime import datetime, timezone
from ..users.models import User

class TokenBlocklist(db.Model):
    __tablename__ = "token_blocklist"
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, nullable=False, index=True)
    token_type = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    
    def __repr__(self):
        return f"<Token {self.jti}>"
    
    def save(self):
        db.session.add(self)
        db.session.commit() 
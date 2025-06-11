import bcrypt
from datetime import datetime, timezone
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    birth_year = db.Column(db.Integer) 
    password_hash = db.Column(db.String(255), nullable=False) 
    created_at = db.Column(db.DateTime(timezone=True), server_default=db.func.now())

    blocked_tokens = db.relationship('TokenBlocklist', backref='user', lazy=True, cascade="all, delete-orphan")
    # Relationship to ChatSession will be defined in ChatSession model with a backref
    # chat_sessions = db.relationship('ChatSession', backref='user_ref', lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User {self.username}>"

    def set_password(self, password):
        pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        self.password_hash = pw_hash.decode('utf-8')

    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    @classmethod
    def get_user_by_username(cls, username):
        return cls.query.filter_by(username=username).first()
        
    @classmethod
    def get_user_by_email(cls, email):
        return cls.query.filter_by(email=email).first()

    def save(self):
        db.session.add(self)
        db.session.commit()

    def delete(self):
        db.session.delete(self)
        db.session.commit()
from app.extensions import db

class ChecklistProfile(db.Model):
    __tablename__ = 'checklist_profile'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', name='fk_checklist_profile_user_id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    due_date = db.Column(db.TIMESTAMP(timezone=True), nullable=True, index=True)
    status = db.Column(db.String(50), nullable=False, default='in_progress', index=True)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    user = db.relationship('User', backref=db.backref('checklist_profiles', lazy='dynamic'))
    categories = db.relationship('ChecklistCategory', backref=db.backref('profile'), cascade='all, delete-orphan')
    documents = db.relationship('Document', backref='profile', lazy='dynamic', cascade='all, delete-orphan')

class ChecklistCategory(db.Model):
    __tablename__ = 'checklist_category'
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('checklist_profile.id', name='fk_checklist_category_profile_id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    items = db.relationship('ChecklistItem', backref='category', lazy='dynamic', cascade='all, delete-orphan')
    # grouped_documents relationship will be established by Document.grouping_category's backref

class ChecklistItem(db.Model):
    __tablename__ = 'checklist_item'
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('checklist_category.id', name='fk_checklist_item_category_id', ondelete='CASCADE'), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    is_completed = db.Column(db.Boolean, nullable=False, default=False, index=True)
    due_date = db.Column(db.TIMESTAMP(timezone=True), nullable=True, index=True)
    notes = db.Column(db.Text, nullable=True)
    order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    # Relationships
    attachments = db.relationship('Document', backref='checklist_item', lazy='dynamic') # Documents specifically attached to this item

class Document(db.Model):
    __tablename__ = 'document'
    id = db.Column(db.Integer, primary_key=True)
    profile_id = db.Column(db.Integer, db.ForeignKey('checklist_profile.id', name='fk_document_profile_id', ondelete='CASCADE'), nullable=False, index=True)
    checklist_item_id = db.Column(db.Integer, db.ForeignKey('checklist_item.id', name='fk_document_checklist_item_id', ondelete='SET NULL'), nullable=True, index=True)
    grouping_category_id = db.Column(db.Integer, db.ForeignKey('checklist_category.id', name='fk_document_grouping_category_id', ondelete='CASCADE'), nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(512), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # Size in bytes
    file_type = db.Column(db.String(100), nullable=False)  # MIME type
    uploaded_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now())
    updated_at = db.Column(db.TIMESTAMP(timezone=True), server_default=db.func.now(), onupdate=db.func.now())

    # Relationship to ChecklistCategory for document grouping
    grouping_category = db.relationship('ChecklistCategory', foreign_keys=[grouping_category_id], backref=db.backref('grouped_documents', lazy='dynamic')) 
from marshmallow import fields, Schema

class UserSchema(Schema):
    id = fields.String()
    username = fields.String()
    email = fields.String() 
    birth_year = fields.Int()
    created_at = fields.DateTime() 
from flask import Blueprint, request, jsonify
from ..auth.models import User # User model is in auth module
from .schemas import UserSchema
from flask_jwt_extended import jwt_required, get_jwt

user_bp = Blueprint(
    'users', 
    __name__
)

@user_bp.get('/all')
@jwt_required()
def get_all_users():
    claims = get_jwt()
    if claims.get('is_admin'):
        page = request.args.get('page', default=1, type=int)
        per_page = request.args.get('per_page', default=3, type=int)
        users = User.query.paginate(
            page=page,
            per_page=per_page
        )
        result = UserSchema().dump(users.items, many=True) # Use .items for paginated results
        return jsonify(
            {
                "users": result,
                "page": users.page,
                "per_page": users.per_page,
                "total_pages": users.pages,
                "total_items": users.total
            }
        ), 200
    return jsonify({"message": "You are not authorized to access this resource"}), 403 
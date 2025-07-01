from app import create_app # Will be created in app/__init__.py
import os
from app.extensions import db  # Đảm bảo bạn import đúng nơi db được khởi tạo

app = create_app()

if __name__ == '__main__':
    # The host and debug settings might be better managed via config or environment variables
    app.run(host=os.environ.get('FLASK_RUN_HOST', '0.0.0.0'), 
            port=int(os.environ.get('FLASK_RUN_PORT', 5000)), 
            debug=os.environ.get('FLASK_DEBUG', 'True').lower() == 'true') 
with app.app_context():
    db.create_all()
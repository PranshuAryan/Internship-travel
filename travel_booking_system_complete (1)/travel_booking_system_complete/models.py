from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    bookings = db.relationship('Booking', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Trip(db.Model):
    __tablename__ = 'trips'
    id = db.Column(db.Integer, primary_key=True)
    trip_type = db.Column(db.String(50), nullable=False) # flight, hotel, bus
    provider = db.Column(db.String(100), nullable=False) # e.g., 'Delta', 'Hilton'
    source = db.Column(db.String(100), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    departure_time = db.Column(db.DateTime, nullable=False)
    arrival_time = db.Column(db.DateTime, nullable=False)
    price = db.Column(db.Float, nullable=False)
    seats_available = db.Column(db.Integer, default=50)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.trip_type,
            'provider': self.provider,
            'source': self.source,
            'destination': self.destination,
            'departure_time': self.departure_time.strftime('%Y-%m-%d %H:%M'),
            'arrival_time': self.arrival_time.strftime('%Y-%m-%d %H:%M'),
            'price': self.price,
            'seats_available': self.seats_available
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Snapshot of the trip for historical integrity
    trip_type = db.Column(db.String(50), nullable=False)
    origin = db.Column(db.String(100), nullable=False)
    destination = db.Column(db.String(100), nullable=False)
    travel_date = db.Column(db.DateTime, nullable=False)
    return_date = db.Column(db.DateTime, nullable=True) # Optional
    
    passengers = db.Column(db.Integer, nullable=False, default=1)
    status = db.Column(db.String(20), default='pending') # pending, confirmed, cancelled
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    payment = db.relationship('Payment', backref='booking', uselist=False) # 1 to 1

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, mock_success, failed
    payment_method = db.Column(db.String(50), nullable=False)
    transaction_id = db.Column(db.String(100), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

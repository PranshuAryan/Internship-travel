import os
import uuid
from datetime import datetime, timedelta
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv

from models import db, User, Trip, Booking, Payment

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('SQLALCHEMY_DATABASE_URI', 'sqlite:///travel.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def seed_mock_data():
    if Trip.query.count() == 0:
        trips = [
            Trip(trip_type='flight', provider='AirBlue', source='New York', destination='London', 
                 departure_time=datetime.now() + timedelta(days=2), arrival_time=datetime.now() + timedelta(days=2, hours=7), price=450.0),
            Trip(trip_type='flight', provider='SkyWings', source='New York', destination='Paris', 
                 departure_time=datetime.now() + timedelta(days=5), arrival_time=datetime.now() + timedelta(days=5, hours=8), price=520.0),
            Trip(trip_type='hotel', provider='Grand Plaza', source='N/A', destination='London', 
                 departure_time=datetime.now() + timedelta(days=2), arrival_time=datetime.now() + timedelta(days=6), price=120.0), # price per night
            Trip(trip_type='bus', provider='CityTransit', source='Boston', destination='New York', 
                 departure_time=datetime.now() + timedelta(days=1), arrival_time=datetime.now() + timedelta(days=1, hours=4), price=35.0),
        ]
        db.session.add_all(trips)
        db.session.commit()
        print("Mock data seeded!")

# --- FRONTEND ROUTES ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    return render_template('search.html')

@app.route('/dashboard')
@login_required
def dashboard():
    bookings = Booking.query.filter_by(user_id=current_user.id).order_by(Booking.created_at.desc()).all()
    return render_template('dashboard.html', bookings=bookings)

@app.route('/booking/<int:trip_id>')
@login_required
def booking(trip_id):
    trip = Trip.query.get_or_404(trip_id)
    return render_template('booking.html', trip=trip)

# --- AUTH ROUTES ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid email or password')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        password = request.form.get('password')
        phone = request.form.get('phone')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return redirect(url_for('register'))
            
        new_user = User(name=name, email=email, phone=phone)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        login_user(new_user)
        return redirect(url_for('index'))
    return render_template('register.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

# --- API ROUTES ---
@app.route('/api/search')
def api_search():
    source = request.args.get('source', '')
    destination = request.args.get('destination', '')
    trip_type = request.args.get('type', '')
    
    query = Trip.query
    if source:
        query = query.filter(Trip.source.ilike(f'%{source}%'))
    if destination:
        query = query.filter(Trip.destination.ilike(f'%{destination}%'))
    if trip_type:
        query = query.filter_by(trip_type=trip_type)
        
    results = query.all()
    return jsonify([trip.to_dict() for trip in results])

@app.route('/api/book', methods=['POST'])
@login_required
def api_book():
    data = request.json
    trip_id = data.get('trip_id')
    payment_method = data.get('payment_method', 'mock_card')

    try:
        passengers = int(data.get('passengers', 1))
    except (TypeError, ValueError):
        return jsonify({'error': 'Passengers must be a whole number'}), 400

    if passengers < 1 or passengers > 9:
        return jsonify({'error': 'Passengers must be between 1 and 9'}), 400

    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({'error': 'Trip not found'}), 404
        
    if trip.seats_available < passengers:
        return jsonify({'error': 'Not enough seats available'}), 400

    total_price = trip.price * passengers
    
    # Create Booking
    new_booking = Booking(
        user_id=current_user.id,
        trip_type=trip.trip_type,
        origin=trip.source,
        destination=trip.destination,
        travel_date=trip.departure_time,
        passengers=passengers,
        status='confirmed',
        total_price=total_price
    )
    
    db.session.add(new_booking)
    db.session.flush() # Get booking ID
    
    # Create Payment (Mock)
    mock_txn_id = f"txn_{uuid.uuid4().hex[:16]}"
    new_payment = Payment(
        booking_id=new_booking.id,
        amount=total_price,
        status='mock_success',
        payment_method=payment_method,
        transaction_id=mock_txn_id
    )
    
    # Update seats
    trip.seats_available -= passengers
    
    db.session.add(new_payment)
    db.session.commit()
    
    return jsonify({'success': True, 'booking_id': new_booking.id, 'transaction_id': mock_txn_id})

@app.route('/api/bookings/<int:booking_id>/cancel', methods=['POST'])
@login_required
def api_cancel_booking(booking_id):
    booking = Booking.query.get_or_404(booking_id)

    if booking.user_id != current_user.id:
        return jsonify({'error': 'You cannot cancel this booking'}), 403

    if booking.status == 'cancelled':
        return jsonify({'error': 'Booking is already cancelled'}), 400

    booking.status = 'cancelled'

    # Return the seats to the original trip if it can still be matched
    trip = Trip.query.filter_by(
        trip_type=booking.trip_type,
        source=booking.origin,
        destination=booking.destination,
        departure_time=booking.travel_date
    ).first()
    if trip:
        trip.seats_available += booking.passengers

    if booking.payment:
        booking.payment.status = 'refunded'

    db.session.commit()
    return jsonify({'success': True, 'booking_id': booking.id, 'status': booking.status})

# Runs on import too (Vercel imports this module rather than executing it as
# a script), so tables get created and seeded whether we're running locally
# with `python app.py` or as a serverless function on Vercel.
with app.app_context():
    db.create_all()
    seed_mock_data()

if __name__ == '__main__':
    app.run(debug=True)

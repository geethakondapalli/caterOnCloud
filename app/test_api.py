import requests
import json

BASE_URL = "http://localhost:8000"

def test_registration():
    user_data = {
        "email": "chef@example.com",
        "password": "password123",
        "name": "Chef John",
        "role": "caterer",
        "phone": "+44123456789",
        "specialties": {"cuisine": ["Italian", "Mediterranean"]},
        "bio": "Experienced chef specializing in authentic Italian cuisine"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Registration: {response.status_code}")
    print(response.json())

def test_login():
    login_data = {
        "username": "chef@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
    print(f"Login: {response.status_code}")
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_create_menu(token):
    headers = {"Authorization": f"Bearer {token}"}
    menu_data = {
        "name": "Italian Dinner Special",
        "items": {
            "appetizer": "Bruschetta",
            "main": "Pasta Carbonara",
            "dessert": "Tiramisu"
        },
        "menu_date": "2025-06-15",
        "orderlink": "https://example.com/order"
    }
    
    response = requests.post(f"{BASE_URL}/menu/items", json=menu_data, headers=headers)
    print(f"Create Menu: {response.status_code}")
    print(response.json())

def test_create_order():
    order_data = {
        "menu_id": "your-menu-id-here",
        "customer_name": "John Doe",
        "customer_phone": "+44987654321",
        "customer_address": {
            "street": "123 Main St",
            "city": "London",
            "postcode": "SW1A 1AA"
        },
        "customer_email": "john@example.com",
        "menu_date": "2025-06-15",
        "items": {
            "quantity": 2,
            "special_requests": "No nuts please"
        },
        "total": 45.99
    }
    
    response = requests.post(f"{BASE_URL}/orders/", json=order_data)
    print(f"Create Order: {response.status_code}")
    print(response.json())

if __name__ == "__main__":
    test_registration()
    token = test_login()
    if token:
        test_create_menu(token)
    test_create_order()
# This script tests the API endpoints for user registration, login, menu creation, and order creation.
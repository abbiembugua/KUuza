import requests
import base64
from datetime import datetime
from django.conf import settings
from requests.auth import HTTPBasicAuth



def get_base_url():
    if settings.MPESA_ENV == 'production':
        return 'https://api.safaricom.co.ke'
    return 'https://sandbox.safaricom.co.ke'


def get_access_token():
    url = f"{get_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(url, auth=HTTPBasicAuth(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET), timeout=30)
    response.raise_for_status()
    return response.json()['access_token']

def generate_password():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    raw = f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}"
    password = base64.b64encode(raw.encode()).decode()
    return password, timestamp


def stk_push(phone_number, amount, transaction_id):
    """
    Sends STK push to the buyer's phone.
    phone_number must be in format 254XXXXXXXXX (no + or spaces)
    """
    # Normalise phone number
    phone = str(phone_number).strip().replace('+', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]

    access_token = get_access_token()
    password, timestamp = generate_password()

    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password":          password,
        "Timestamp":         timestamp,
        "TransactionType":   "CustomerPayBillOnline",
        "Amount":            int(float(amount)),   # M-Pesa requires whole numbers
        "PartyA":            phone,
        "PartyB":            settings.MPESA_SHORTCODE,
        "PhoneNumber":       phone,
        "CallBackURL":       settings.MPESA_CALLBACK_URL,
        "AccountReference":  f"KUuza-{str(transaction_id)[:8]}",
        "TransactionDesc":   f"KUuza payment {str(transaction_id)[:8]}"
    }

    response = requests.post(
        f"{get_base_url()}/mpesa/stkpush/v1/processrequest",
        json=payload,
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30
    )
    response.raise_for_status()
    return response.json()
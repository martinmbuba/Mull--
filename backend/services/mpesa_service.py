"""
M-PESA Daraja API Integration Service
Handles STK Push for deposits and B2C for withdrawals
"""

import os
import base64
import requests
from datetime import datetime
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# M-PESA Endpoints (Sandbox/Production)
MPESA_BASE_URL = os.getenv('MPESA_ENVIRONMENT', 'sandbox')
if MPESA_BASE_URL == 'sandbox':
    BASE_URL = "https://sandbox.safaricom.co.ke"
else:
    BASE_URL = "https://api.safaricom.co.ke"

# Token URL
TOKEN_URL = f"{BASE_URL}/oauth/v1/generate?grant_type=client_credentials"

# STK Push URL
STK_PUSH_URL = f"{BASE_URL}/mpesa/stkpush/v1/processrequest"

# B2C URL
B2C_URL = f"{BASE_URL}/mpesa/b2c/v1/sessionrequest"

# Register URL for C2B
C2B_REGISTER_URL = f"{BASE_URL}/mpesa/c2b/v1/registerurl"

# Transaction Status URL
TRANSACTION_STATUS_URL = f"{BASE_URL}/mpesa/transactionstatus/v1/query"


class MpesaService:
    """Service class for M-PESA Daraja API integration"""
    
    def __init__(self):
        self.consumer_key = os.getenv('MPESA_CONSUMER_KEY')
        self.consumer_secret = os.getenv('MPESA_CONSUMER_SECRET')
        self.shortcode = os.getenv('MPESA_SHORTCODE')
        self.passkey = os.getenv('MPESA_PASSKEY')
        self.initiator_name = os.getenv('MPESA_INITIATOR_NAME')
        self.initiator_password = os.getenv('MPESA_INITIATOR_PASSWORD')
        self.callback_url = os.getenv('MPESA_CALLBACK_URL')
        
        self._access_token = None
        self._token_expiry = None
    
    def _get_access_token(self) -> str:
        """
        Get OAuth access token from M-PESA API
        Token is cached for 1 hour (3600 seconds)
        """
        import time
        
        # Check if we have a valid cached token
        if self._access_token and self._token_expiry and time.time() < self._token_expiry:
            return self._access_token
        
        try:
            response = requests.get(
                TOKEN_URL,
                auth=requests.auth.HTTPBasicAuth(
                    self.consumer_key,
                    self.consumer_secret
                ),
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            self._access_token = data.get('access_token')
            
            # Cache token for 55 minutes (less than actual expiry to be safe)
            self._token_expiry = time.time() + 3300
            
            return self._access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get M-PESA access token: {e}")
            raise Exception("Failed to authenticate with M-PESA service")
    
    def _generate_password(self) -> str:
        """
        Generate M-PESA API password (Base64 encoded)
        Format: Shortcode + Passkey + Timestamp
        """
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.shortcode}{self.passkey}{timestamp}"
        return base64.b64encode(password_string.encode()).decode()
    
    def _format_phone_number(self, phone: str) -> str:
        """
        Format phone number to M-PESA format (254XXXXXXXXX)
        """
        # Remove any spaces or special characters
        phone = ''.join(filter(str.isdigit, phone))
        
        # Handle different formats
        if phone.startswith('0'):
            # 07XX XXX XXX -> 254XX XXX XXX
            phone = '254' + phone[1:]
        elif phone.startswith('7'):
            # 7XX XXX XXX -> 2547X XXX XXX
            phone = '254' + phone
        elif phone.startswith('254'):
            # Already in correct format
            pass
        elif phone.startswith('+'):
            # Remove + prefix
            phone = phone[1:]
        
        return phone
    
    def stk_push_deposit(
        self,
        phone: str,
        amount: float,
        account_reference: str,
        transaction_desc: str = "Online Bank Deposit"
    ) -> Dict:
        """
        Trigger STK Push to user's phone for deposit
        
        Args:
            phone: User's phone number (format: 07XX XXX XXX, 254XX XXX XXX, or +254XX XXX XXX)
            amount: Deposit amount
            account_reference: Unique reference for the transaction
            transaction_desc: Description of the transaction
            
        Returns:
            Dict containing response data including CheckoutRequestID
        """
        try:
            token = self._get_access_token()
            phone = self._format_phone_number(phone)
            
            # Validate amount
            if amount < 1:
                raise ValueError("Minimum deposit amount is 1 KES")
            if amount > 70000:
                raise ValueError("Maximum deposit amount is 70,000 KES")
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(
                f"{self.shortcode}{self.passkey}{timestamp}".encode()
            ).decode()
            
            payload = {
                "BusinessShortCode": self.shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),  # M-PESA requires integer
                "PartyA": phone,
                "PartyB": self.shortcode,
                "PhoneNumber": phone,
                "CallBackURL": self.callback_url,
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                STK_PUSH_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"STK Push initiated successfully: {data}")
            
            return {
                "success": True,
                "checkout_request_id": data.get('CheckoutRequestID'),
                "merchant_request_id": data.get('MerchantRequestID'),
                "response_code": data.get('ResponseCode'),
                "response_description": data.get('ResponseDescription'),
                "message": data.get('CustomerMessage')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to initiate payment. Please try again."
            }
        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "message": str(e)
            }
    
    def b2c_withdrawal(
        self,
        phone: str,
        amount: float,
        occasion: str = "Online Bank Withdrawal",
        remarks: str = "Withdrawal from online bank"
    ) -> Dict:
        """
        Send money to user's phone via B2C API
        
        Args:
            phone: User's phone number
            amount: Withdrawal amount
            occasion: Occasion for the transaction
            remarks: Additional remarks
            
        Returns:
            Dict containing response data including ConversationID
        """
        try:
            token = self._get_access_token()
            phone = self._format_phone_number(phone)
            
            # Validate amount
            if amount < 10:
                raise ValueError("Minimum withdrawal amount is 10 KES")
            if amount > 70000:
                raise ValueError("Maximum withdrawal amount is 70,000 KES")
            
            payload = {
                "InitiatorName": self.initiator_name,
                "InitiatorPassword": self.initiator_password,
                "CommandID": "BusinessPayment",  # Can also be "SalaryPayment" or "PromotionPayment"
                "Amount": int(amount),
                "PartyA": self.shortcode,
                "PartyB": phone,
                "Remarks": remarks,
                "QueueTimeOutURL": f"{self.callback_url}/b2c/timeout",
                "ResultURL": f"{self.callback_url}/b2c/result",
                "Occasion": occasion
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                B2C_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"B2C payment initiated successfully: {data}")
            
            return {
                "success": True,
                "conversation_id": data.get('ConversationID'),
                "originator_conversation_id": data.get('OriginatorConversationID'),
                "response_code": data.get('ResponseCode'),
                "response_description": data.get('ResponseDescription')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"B2C payment failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to process withdrawal. Please try again."
            }
        except ValueError as e:
            return {
                "success": False,
                "error": str(e),
                "message": str(e)
            }
    
    def register_c2b_urls(self) -> Dict:
        """
        Register callback URLs for C2B (Customer to Business) transactions
        This is used to receive payment confirmations from customers paying via M-PESA
        """
        try:
            token = self._get_access_token()
            
            payload = {
                "ShortCode": self.shortcode,
                "ResponseType": "Completed",  # "Completed" or "Cancelled"
                "ConfirmationURL": f"{self.callback_url}/c2b/confirmation",
                "ValidationURL": f"{self.callback_url}/c2b/validation"
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                C2B_REGISTER_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            logger.info(f"C2B URLs registered: {data}")
            
            return {
                "success": True,
                "response_description": data.get('ResponseDescription')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"C2B registration failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to register C2B URLs"
            }
    
    def check_transaction_status(self, transaction_id: str) -> Dict:
        """
        Check the status of a transaction
        
        Args:
            transaction_id: The transaction ID (CheckoutRequestID or OriginationConversationID)
            
        Returns:
            Dict containing transaction status
        """
        try:
            token = self._get_access_token()
            
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            password = base64.b64encode(
                f"{self.shortcode}{self.passkey}{timestamp}".encode()
            ).decode()
            
            payload = {
                "Initiator": self.initiator_name,
                "SecurityCredential": self.initiator_password,
                "CommandID": "TransactionStatusQuery",
                "TransactionID": transaction_id,
                "PartyA": self.shortcode,
                "IdentifierType": "4",  # 4 = Shortcode
                "ResultURL": f"{self.callback_url}/transaction/status",
                "QueueTimeOutURL": f"{self.callback_url}/transaction/timeout"
            }
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                TRANSACTION_STATUS_URL,
                json=payload,
                headers=headers,
                timeout=60
            )
            
            response.raise_for_status()
            data = response.json()
            
            return {
                "success": True,
                "status": data.get('Result'),
                "result_code": data.get('ResultCode'),
                "result_description": data.get('ResultDesc')
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Transaction status check failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to check transaction status"
            }
    
    @staticmethod
    def parse_stk_callback(callback_data: Dict) -> Dict:
        """
        Parse STK Push callback data
        
        Args:
            callback_data: Raw callback data from M-PESA
            
        Returns:
            Parsed transaction data
        """
        try:
            stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
            
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            
            if result_code == 0:
                # Successful transaction
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])
                
                metadata = {}
                for item in items:
                    name = item.get('Name')
                    value = item.get('Value')
                    metadata[name] = value
                
                return {
                    "success": True,
                    "transaction_id": metadata.get('MpesaReceiptNumber'),
                    "amount": metadata.get('Amount'),
                    "phone": metadata.get('PhoneNumber'),
                    "transaction_date": metadata.get('TransactionDate'),
                    "result_code": result_code,
                    "result_description": result_desc
                }
            else:
                # Failed transaction
                return {
                    "success": False,
                    "result_code": result_code,
                    "result_description": result_desc
                }
                
        except Exception as e:
            logger.error(f"Failed to parse STK callback: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def parse_b2c_callback(callback_data: Dict) -> Dict:
        """
        Parse B2C callback data
        
        Args:
            callback_data: Raw callback data from M-PESA
            
        Returns:
            Parsed transaction data
        """
        try:
            result = callback_data.get('Result', {})
            result_params = result.get('ResultParameters', {}).get('ResultParameter', [])
            
            params = {}
            for param in result_params:
                params[param.get('Key')] = param.get('Value')
            
            return {
                "success": True,
                "conversation_id": result.get('ConversationID'),
                "originator_conversation_id": result.get('OriginatorConversationID'),
                "transaction_id": params.get('MpesaReceiptNumber'),
                "amount": params.get('Amount'),
                "phone": params.get('PhoneNumber'),
                "transaction_date": params.get('TransactionDate'),
                "result_code": result.get('ResultCode'),
                "result_description": result.get('ResultDesc')
            }
            
        except Exception as e:
            logger.error(f"Failed to parse B2C callback: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
_mpesa_service = None

def get_mpesa_service() -> MpesaService:
    """Get the singleton M-PESA service instance"""
    global _mpesa_service
    if _mpesa_service is None:
        _mpesa_service = MpesaService()
    return _mpesa_service


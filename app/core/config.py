from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    stripe_secret_key :str = "sk_test_51RTmiOQMjkOvMvVCRMl7Ke2NeIvBRvmDVUBNB3FSiWPCDq1Cv6joY5sYuVzUKIS1ra3KdP6liqIB4KYV8djjmoDp0005dfNf0O"
    stripe_publishable_key :str ="pk_test_51RTmiOQMjkOvMvVCnPRTP8tdWayzvRdgWRZCrhToHWzPcSV6BdPEAofCcfN54xqi6UEV9Eb7R71K65kWXV3j95Fs00ia4Xy0en"
    redis_url: str = "redis://localhost:6379"
    email_host: str
    email_port: int = 587
    email_username: str
    email_password: str
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    twilio_account_sid: str
    twilio_auth_token: str
    twilio_phone_number: str
    
    class Config:
        env_file = ".env"

settings = Settings()
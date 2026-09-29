"""
Checks a Gmail address and App Password against smtp.gmail.com, the same login Supabase performs.
Sends no email and stores nothing: the password is read without echo and only used for this one login.

Run it yourself in a terminal:  python scripts/check-gmail-smtp.py
"""
import getpass
import smtplib
import ssl
import sys

address = input("Gmail address (the SMTP username): ").strip()
# Google shows the App Password in four groups; the spaces are not part of it
password = getpass.getpass("App Password (hidden as you type or paste): ").replace(" ", "").strip()

if "@" not in address:
    sys.exit("Use the full address, for example yourname@gmail.com.")
if len(password) != 16:
    print(f"Note: an App Password is 16 characters; this one is {len(password)}. A normal Gmail password is refused.")

try:
    server = smtplib.SMTP("smtp.gmail.com", 587, timeout=20)
    server.ehlo()
    server.starttls(context=ssl.create_default_context())
    server.ehlo()
    server.login(address, password)
except smtplib.SMTPAuthenticationError as error:
    sys.exit(f"REFUSED by Google ({error.smtp_code}). This address and password do not work together.")
except (smtplib.SMTPException, OSError) as error:
    sys.exit(f"Could not reach or talk to Gmail: {error}")
else:
    server.quit()
    print("ACCEPTED. These exact values work: put them in Supabase as Username and Password.")

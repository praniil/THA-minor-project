import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

dbname = os.getenv("DB_NAME")
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")

connection = psycopg2.connect(
    dbname = dbname,
    user = user,
    password = password,
    host = host,
    port = port,
)

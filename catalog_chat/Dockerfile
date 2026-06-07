FROM python:3.12-slim

WORKDIR /app

ENV MONGODB_URL="mongodb://mongodb:27017"
ENV MONGO_DB_NAME="web-project"
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "run.py"]

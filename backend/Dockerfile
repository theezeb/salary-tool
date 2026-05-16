FROM python:3.11-slim

WORKDIR /app

# Install dependencies first to utilize Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend source files
COPY . .

# Expose the internal port variable used by Railway
EXPOSE 8080

# Run uvicorn using 'sh' so the $PORT environment variable maps correctly
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
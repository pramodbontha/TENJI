# Use the official Python image from the Docker Hub
FROM python:3.9-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file to the container
COPY requirements.txt /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download the spaCy German language model
RUN python -m spacy download de_core_news_lg

# Copy the rest of the application code to the container
COPY . /app/

# Expose the Flask port
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "lemmatizer.py"]
FROM mcr.microsoft.com/playwright/python:v1.52.0-noble

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV PORT=8000
ENV HOST=0.0.0.0
ENV BROWSER_HEADLESS=true

EXPOSE 8000
CMD ["python", "main.py"]

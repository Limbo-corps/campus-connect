FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir uv

WORKDIR /app

COPY backend/pyproject.toml .
COPY backend/uv.lock* ./

RUN uv sync --frozen || uv sync

COPY backend .

CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]

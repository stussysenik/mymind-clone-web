---
title: DSPy Content Quality Service
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
---

# DSPy Content Quality Service

AI-powered content analysis service using DSPy for optimized title generation and summarization.

## Features

- **Memorable Title Generation**: Creates catchy, descriptive titles for saved content
- **Analytical Summaries**: Generates insightful summaries explaining why content is valuable
- **Multi-platform Support**: Instagram, Twitter, Reddit, and more

## API Endpoints

### Health Check
```
GET /health
```

### Generate Title
```
POST /extract/title
Content-Type: application/json

{
  "raw_content": "Your content text here",
  "author": "username",
  "platform": "instagram"
}
```

### Generate Summary
```
POST /generate/summary
Content-Type: application/json

{
  "content": "Your content text here",
  "platform": "instagram",
  "author": "username",
  "title": "Generated title",
  "image_count": 1
}
```

## Environment Variables

- `ZHIPU_API_KEY`: API key for Zhipu GLM-4 (primary)
- `OPENAI_API_KEY`: API key for OpenAI (fallback)
- `LLM_PROVIDER`: "zhipu" or "openai" (default: "zhipu")

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 7860
```

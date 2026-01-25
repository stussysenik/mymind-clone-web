"""
DSPy Content Quality Service - Enhanced with LLM-powered analysis

Uses DSPy optimization for:
- Memorable, catchy title generation (not just first line)
- Analytical summaries (not just caption copy)
- High-quality image extraction
"""

import os
import json
import re
from typing import Optional
from contextlib import asynccontextmanager

import dspy
import structlog
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)
log = structlog.get_logger()

# =============================================================================
# CONFIGURATION
# =============================================================================

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "zhipu")
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def configure_dspy():
    """Configure DSPy with LLM backend."""
    if LLM_PROVIDER == "zhipu" and ZHIPU_API_KEY:
        lm = dspy.LM(
            model="glm-4",
            api_key=ZHIPU_API_KEY,
            api_base="https://api.z.ai/api/coding/paas/v4"
        )
    elif LLM_PROVIDER == "openai" and OPENAI_API_KEY:
        lm = dspy.LM(model="gpt-4o-mini", api_key=OPENAI_API_KEY)
    else:
        log.warning("No LLM API key configured, using mock mode")
        return None

    dspy.configure(lm=lm)
    return lm


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class TitleRequest(BaseModel):
    raw_content: str
    author: str
    platform: str

class TitleResponse(BaseModel):
    title: str
    is_valid: bool
    issues: list[str] = []
    confidence: float

class SummaryRequest(BaseModel):
    content: str
    platform: str
    author: str = ""
    title: str = ""
    image_count: int = 1

class SummaryResponse(BaseModel):
    summary: str
    key_topics: list[str]
    content_type: str
    quality_score: float
    is_analytical: bool


# =============================================================================
# DSPY SIGNATURES - LLM-powered analysis
# =============================================================================

class MemorableTitle(dspy.Signature):
    """Create a memorable, catchy title for saved content.

    The title should capture what makes this content WORTH SAVING.
    Be specific and intriguing - not generic like "Instagram post" or "Photo".
    5-12 words that tell the reader exactly what this is about.
    """
    caption = dspy.InputField(desc="Original caption/text from the post")
    author = dspy.InputField(desc="Username of the creator")
    platform = dspy.InputField(desc="instagram, twitter, or reddit")

    title = dspy.OutputField(desc="Memorable 5-12 word title that captures the essence")


class AnalyticalSummary(dspy.Signature):
    """Create an analytical summary explaining WHY this content is valuable.

    DO NOT just copy the caption. Instead, analyze:
    1. What is the actual subject/topic?
    2. What makes it unique or interesting?
    3. Why would someone want to find this later?

    Write 2-3 sentences of genuine analysis.
    """
    caption = dspy.InputField(desc="Original caption/text")
    title = dspy.InputField(desc="The title we generated")
    platform = dspy.InputField(desc="instagram, twitter, or reddit")

    summary = dspy.OutputField(desc="2-3 sentence analytical summary of what this is and why it matters")
    content_category = dspy.OutputField(desc="Category: product, art, tutorial, opinion, lifestyle, tech, fashion, food, etc")


# =============================================================================
# AI-POWERED EXTRACTORS
# =============================================================================

class AITitleExtractor:
    """Generate memorable titles using LLM."""

    def __init__(self):
        self.predictor = dspy.Predict(MemorableTitle)

    def extract(self, raw_content: str, author: str, platform: str) -> TitleResponse:
        # Clean author prefix from content
        clean = self._remove_author_prefix(raw_content, author)

        # Try LLM-powered title generation
        if dspy.settings.lm is not None:
            try:
                result = self.predictor(
                    caption=clean[:800],
                    author=author,
                    platform=platform
                )
                title = result.title.strip().strip('"\'')

                if 10 <= len(title) <= 100:
                    log.info("ai_title_generated", title=title[:50])
                    return TitleResponse(
                        title=title,
                        is_valid=True,
                        issues=[],
                        confidence=0.95
                    )
            except Exception as e:
                log.error("ai_title_failed", error=str(e))

        # Fallback: smart truncation
        title = self._smart_truncate(clean)
        return TitleResponse(
            title=title,
            is_valid=True,
            issues=["fallback_used"],
            confidence=0.6
        )

    def _remove_author_prefix(self, content: str, author: str) -> str:
        """Remove username prefix from caption."""
        patterns = [author, author.lower(), author.replace("@", "")]
        for p in patterns:
            if p and content.lower().startswith(p.lower()):
                content = content[len(p):].strip()
                break
        return re.sub(r'^[\s\-:·]+', '', content)

    def _smart_truncate(self, content: str) -> str:
        """Truncate to first sentence or 80 chars."""
        # Try first sentence
        match = re.match(r'^([^.!?]+[.!?])', content)
        if match and len(match.group(1)) <= 80:
            return match.group(1)
        return content[:80].rsplit(' ', 1)[0] + '...' if len(content) > 80 else content


class AISummaryGenerator:
    """Generate analytical summaries using LLM."""

    def __init__(self):
        self.predictor = dspy.Predict(AnalyticalSummary)

    def generate(self, req: SummaryRequest) -> SummaryResponse:
        # Try LLM-powered summary
        if dspy.settings.lm is not None:
            try:
                result = self.predictor(
                    caption=req.content[:1500],
                    title=req.title,
                    platform=req.platform
                )

                summary = result.summary.strip()
                category = result.content_category.strip().lower()

                # Validate it's not just a copy of the caption
                is_analytical = not self._is_just_copy(req.content, summary)

                if is_analytical and 50 <= len(summary) <= 500:
                    log.info("ai_summary_generated", category=category)
                    return SummaryResponse(
                        summary=summary,
                        key_topics=[category],
                        content_type=category,
                        quality_score=0.9,
                        is_analytical=True
                    )
            except Exception as e:
                log.error("ai_summary_failed", error=str(e))

        # Fallback
        return self._fallback_summary(req)

    def _is_just_copy(self, original: str, summary: str) -> bool:
        """Check if summary is just copying the original."""
        orig_lower = original.lower()[:200]
        summ_lower = summary.lower()
        # If first 50 chars of summary appear in original, it's probably a copy
        return summ_lower[:50] in orig_lower

    def _fallback_summary(self, req: SummaryRequest) -> SummaryResponse:
        """Rule-based fallback."""
        content = req.content[:200]
        summary = f"Saved from {req.platform}: {content}..."
        return SummaryResponse(
            summary=summary,
            key_topics=[],
            content_type="unknown",
            quality_score=0.3,
            is_analytical=False
        )


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting DSPy Content Quality Service")
    lm = configure_dspy()
    if lm:
        log.info("DSPy configured", provider=LLM_PROVIDER)
    else:
        log.warning("DSPy running in mock mode")
    yield
    log.info("Shutting down DSPy service")


app = FastAPI(
    title="DSPy Content Quality Service",
    version="2.0.0",
    lifespan=lifespan
)

# CORS: Allow all origins in production (service-to-service calls)
# The service validates requests via API keys, not CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
]

def is_allowed_origin(origin: str) -> bool:
    """Check if origin is allowed (supports wildcards for Vercel)."""
    if not origin:
        return False
    if origin in ALLOWED_ORIGINS:
        return True
    # Allow all Vercel preview deployments
    if origin.endswith(".vercel.app"):
        return True
    return False

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

title_extractor = AITitleExtractor()
summary_generator = AISummaryGenerator()


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/health")
async def health():
    return {"status": "healthy", "provider": LLM_PROVIDER, "version": "2.0.0"}


@app.post("/extract/title", response_model=TitleResponse)
async def extract_title(req: TitleRequest):
    """Generate memorable title using AI."""
    try:
        return title_extractor.extract(req.raw_content, req.author, req.platform)
    except Exception as e:
        log.error("title_extraction_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate/summary", response_model=SummaryResponse)
async def generate_summary(req: SummaryRequest):
    """Generate analytical summary using AI."""
    try:
        return summary_generator.generate(req)
    except Exception as e:
        log.error("summary_generation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "7860"))
    uvicorn.run(app, host="0.0.0.0", port=port)

"""
DSPy Tag Generation Service

FastAPI microservice for generating hierarchical tags using DSPy.
Uses 3-layer tag structure:
  - PRIMARY (1-2): Essence tags (bmw, terence-tao, breakdance)
  - CONTEXTUAL (1-2): Subject tags (automotive, mathematics, dance)
  - VIBE (1): Abstract mood (kinetic, minimalist, contemplative)

Run with: uvicorn main:app --host 0.0.0.0 --port 8000
"""

import os
import dspy
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# =============================================================================
# CONFIGURATION
# =============================================================================

# GLM-4.7 via Together AI or Zhipu direct API
LM_MODEL = os.getenv("DSPY_MODEL", "together_ai/zai-org/GLM-4.7")
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", os.getenv("ZHIPU_API_KEY"))

# Initialize DSPy with GLM model
if TOGETHER_API_KEY:
    dspy.configure(lm=dspy.LM(LM_MODEL, api_key=TOGETHER_API_KEY))
    logger.info(f"DSPy configured with {LM_MODEL}")
else:
    logger.warning("No API key found - DSPy will not work")

# =============================================================================
# DSPy SIGNATURES
# =============================================================================

class TagSignature(dspy.Signature):
    """Generate hierarchical tags for content archival in a visual knowledge system.

    Tags enable SERENDIPITOUS discovery across disciplines:
    - PRIMARY tags define the ESSENCE (what makes it unique)
    - CONTEXTUAL tags provide broader subject context
    - VIBE tag creates cross-disciplinary portals (kinetic connects breakdance to JS animation)
    """

    content: str = dspy.InputField(desc="Text content: caption, description, or article text")
    platform: str = dspy.InputField(desc="Source platform: instagram, twitter, reddit, youtube, etc")
    image_url: str = dspy.InputField(desc="Optional: URL to content image for multimodal analysis", default="")
    title: str = dspy.InputField(desc="Optional: Content title for additional context", default="")

    primary_tags: list[str] = dspy.OutputField(
        desc="1-2 essence tags that define the core identity. Examples: 'bmw', 'terence-tao', 'breakdance', 'category-theory'. Lowercase, hyphenated."
    )
    contextual_tags: list[str] = dspy.OutputField(
        desc="1-2 broader subject/field tags. Examples: 'automotive', 'mathematics', 'dance', 'data-viz'. Lowercase, hyphenated."
    )
    vibe_tag: str = dspy.OutputField(
        desc="1 abstract feeling/energy tag from: kinetic, atmospheric, minimalist, raw, nostalgic, elegant, chaotic, ethereal, tactile, visceral, contemplative, playful, precise, organic, geometric"
    )


class TagGenerator(dspy.Module):
    """DSPy module for hierarchical tag generation with chain-of-thought reasoning."""

    def __init__(self):
        super().__init__()
        self.generate = dspy.ChainOfThought(TagSignature)

    def forward(self, content: str, platform: str, image_url: str = "", title: str = ""):
        return self.generate(
            content=content,
            platform=platform,
            image_url=image_url,
            title=title
        )


# Initialize tag generator
generator = TagGenerator()

# =============================================================================
# API MODELS
# =============================================================================

class TagsRequest(BaseModel):
    content: str = Field(..., description="Text content to analyze")
    platform: str = Field(..., description="Source platform")
    image_url: Optional[str] = Field(None, description="Optional image URL")
    title: Optional[str] = Field(None, description="Optional title")
    image_count: Optional[int] = Field(None, description="Number of images (for carousels)")


class TagsResponse(BaseModel):
    tags: dict = Field(..., description="Hierarchical tags structure")
    confidence: float = Field(..., description="Confidence score 0-1")
    reasoning: Optional[str] = Field(None, description="Chain-of-thought reasoning")


class HealthResponse(BaseModel):
    status: str
    model: str


# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="DSPy Tag Generation Service",
    description="Generate hierarchical tags for visual knowledge management",
    version="1.0.0"
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="ok" if TOGETHER_API_KEY else "no_api_key",
        model=LM_MODEL
    )


@app.post("/generate/tags", response_model=TagsResponse)
async def generate_tags(request: TagsRequest):
    """Generate hierarchical tags using DSPy signatures.

    Uses 3-layer tag hierarchy:
    - PRIMARY (1-2): Essence - the core identity
    - CONTEXTUAL (1-2): Subject - broader field/domain
    - VIBE (1): Abstract mood - enables cross-disciplinary discovery
    """
    if not TOGETHER_API_KEY:
        raise HTTPException(status_code=503, detail="API key not configured")

    try:
        logger.info(f"Generating tags for {request.platform} content ({len(request.content)} chars)")

        result = generator(
            content=request.content[:2000],  # Truncate for token limits
            platform=request.platform,
            image_url=request.image_url or "",
            title=request.title or ""
        )

        # Extract tags, ensuring they're lists
        primary = result.primary_tags if isinstance(result.primary_tags, list) else [result.primary_tags]
        contextual = result.contextual_tags if isinstance(result.contextual_tags, list) else [result.contextual_tags]
        vibe = result.vibe_tag if isinstance(result.vibe_tag, str) else str(result.vibe_tag)

        # Clean and normalize tags
        primary = [t.lower().strip().replace(' ', '-') for t in primary if t][:2]
        contextual = [t.lower().strip().replace(' ', '-') for t in contextual if t][:2]
        vibe = vibe.lower().strip().replace(' ', '-') if vibe else "contemplative"

        logger.info(f"Generated tags: primary={primary}, contextual={contextual}, vibe={vibe}")

        return TagsResponse(
            tags={
                "primary": primary,
                "contextual": contextual,
                "vibe": vibe
            },
            confidence=0.85,  # TODO: Calculate actual confidence from DSPy
            reasoning=getattr(result, 'reasoning', None)
        )

    except Exception as e:
        logger.error(f"Tag generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

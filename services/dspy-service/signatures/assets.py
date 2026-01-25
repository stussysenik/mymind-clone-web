"""
DSPy Signatures for Asset Extraction and Validation

Handles image extraction, carousel parsing, and quality validation
for Instagram, Twitter, and Reddit media content.
"""

import dspy
from typing import Optional


class AssetExtractor(dspy.Signature):
    """
    Extract and validate image/media assets from scraped content.

    The goal is to identify the BEST quality version of each unique image.
    Instagram carousels often have multiple sizes of the same image.

    Quality indicators:
    - display_url > display_resources > img tag > og:image
    - Higher resolution (check width/height in URL params)
    - CDN URLs (cdninstagram, scontent, fbcdn) are real images
    - Static URLs are placeholders (reject these)
    """

    html_content: str = dspy.InputField(
        desc="Raw HTML or JSON containing image URLs"
    )
    platform: str = dspy.InputField(
        desc="Source platform: instagram, twitter, reddit"
    )
    expected_count: int = dspy.InputField(
        desc="Expected number of images (from carousel indicator)"
    )

    images: list[dict] = dspy.OutputField(
        desc="List of {url, width, height, quality_source} for each unique image"
    )
    primary_image: str = dspy.OutputField(
        desc="URL of the best/primary image"
    )
    is_carousel: bool = dspy.OutputField(
        desc="True if this is a multi-image post"
    )
    extraction_confidence: float = dspy.OutputField(
        desc="0-1 confidence that all images were found"
    )


class CarouselParser(dspy.Signature):
    """
    Parse Instagram carousel data from embedded JSON.

    Instagram embeds contain edge_sidecar_to_children for carousels.
    Each child has display_url (full res) and display_resources (multiple sizes).

    The parser should:
    1. Identify all carousel slides
    2. Extract the highest resolution version of each
    3. Maintain slide order
    4. Handle missing/corrupted data gracefully
    """

    json_blob: str = dspy.InputField(
        desc="JSON string containing Instagram data (may be escaped)"
    )

    slides: list[dict] = dspy.OutputField(
        desc="Ordered list of {index, image_url, width, height, is_video}"
    )
    total_slides: int = dspy.OutputField(
        desc="Total number of slides in carousel"
    )
    has_video: bool = dspy.OutputField(
        desc="True if any slide is a video"
    )
    parse_errors: list[str] = dspy.OutputField(
        desc="Any errors encountered during parsing"
    )


class ImageQualityValidator(dspy.Signature):
    """
    Validate image URL quality and authenticity.

    Reject:
    - Placeholder images (static.cdninstagram.com)
    - Thumbnail sizes (150x150, 320x320, etc.)
    - Expired URLs (check for timestamp params)
    - Non-image URLs

    Accept:
    - Full resolution (1080+)
    - CDN-hosted content images
    - Direct media URLs
    """

    image_url: str = dspy.InputField(
        desc="Image URL to validate"
    )
    platform: str = dspy.InputField(
        desc="Source platform for URL pattern matching"
    )

    is_valid: bool = dspy.OutputField(
        desc="True if URL points to valid, high-quality image"
    )
    quality_tier: str = dspy.OutputField(
        desc="full, medium, thumbnail, or placeholder"
    )
    rejection_reason: Optional[str] = dspy.OutputField(
        desc="Why URL was rejected (None if valid)"
    )
    suggested_upgrade: Optional[str] = dspy.OutputField(
        desc="Higher quality URL if available (e.g., remove size params)"
    )


class AssetModule(dspy.Module):
    """
    DSPy module for comprehensive asset extraction.

    Combines extraction, carousel parsing, and quality validation
    into a single optimizable pipeline.
    """

    def __init__(self):
        super().__init__()
        self.extractor = dspy.ChainOfThought(AssetExtractor)
        self.carousel_parser = dspy.ChainOfThought(CarouselParser)
        self.quality_validator = dspy.ChainOfThought(ImageQualityValidator)

    def forward(
        self,
        html_content: str,
        platform: str,
        expected_count: int = 1
    ):
        # Extract initial assets
        extraction = self.extractor(
            html_content=html_content,
            platform=platform,
            expected_count=expected_count
        )

        # If carousel detected, parse for better extraction
        if extraction.is_carousel and platform == "instagram":
            carousel = self.carousel_parser(json_blob=html_content)
            # Override with carousel results if successful
            if carousel.total_slides > 0:
                extraction.images = carousel.slides
                extraction.is_carousel = True

        # Validate each image
        validated_images = []
        for img in extraction.images:
            url = img.get("url") or img.get("image_url")
            if url:
                validation = self.quality_validator(
                    image_url=url,
                    platform=platform
                )
                if validation.is_valid:
                    validated_images.append({
                        **img,
                        "quality_tier": validation.quality_tier,
                        "validated": True
                    })
                elif validation.suggested_upgrade:
                    validated_images.append({
                        **img,
                        "url": validation.suggested_upgrade,
                        "quality_tier": "upgraded",
                        "validated": True
                    })

        return dspy.Prediction(
            images=validated_images,
            primary_image=validated_images[0]["url"] if validated_images else None,
            is_carousel=extraction.is_carousel,
            total_images=len(validated_images),
            extraction_confidence=extraction.extraction_confidence
        )

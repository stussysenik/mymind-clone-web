"""
DSPy Signatures for Content Quality Optimization

These signatures define the input/output contracts for DSPy modules.
DSPy will automatically optimize prompts based on these specifications.
"""

from .title import TitleExtractor, TitleValidator
from .summary import SummaryGenerator, SummaryValidator
from .assets import AssetExtractor, CarouselParser
from .platform import InstagramSignature, TwitterSignature, RedditSignature

__all__ = [
    "TitleExtractor",
    "TitleValidator",
    "SummaryGenerator",
    "SummaryValidator",
    "AssetExtractor",
    "CarouselParser",
    "InstagramSignature",
    "TwitterSignature",
    "RedditSignature",
]

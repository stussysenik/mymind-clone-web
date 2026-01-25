"""
DSPy Signatures for Title Extraction and Validation

Handles the critical issue of author/title concatenation and ensures
clean, meaningful titles for saved content.
"""

import dspy


class TitleExtractor(dspy.Signature):
    """
    Extract a clean, meaningful title from content.

    CRITICAL: The title must NOT contain the author's username as a prefix.
    Instagram often concatenates "username" + "caption" without separator.

    The title should:
    1. Be the CONTENT of the post, not the author
    2. Be 20-80 characters for readability
    3. Capture the essence of what makes this content memorable
    4. NOT start with @username or similar patterns
    """

    raw_content: str = dspy.InputField(
        desc="The raw scraped content (may include username prefix)"
    )
    author: str = dspy.InputField(
        desc="The author/username (to be EXCLUDED from title)"
    )
    platform: str = dspy.InputField(
        desc="Source platform: instagram, twitter, reddit"
    )

    title: str = dspy.OutputField(
        desc="Clean title without author prefix, 20-80 chars"
    )
    confidence: float = dspy.OutputField(
        desc="Confidence score 0-1 that title is properly extracted"
    )


class TitleValidator(dspy.Signature):
    """
    Validate and fix title quality issues.

    Common issues to detect and fix:
    1. Author username concatenated at start
    2. Title too short (< 20 chars) or too long (> 100 chars)
    3. Generic/meaningless titles like "Instagram Post"
    4. HTML entities or escape characters
    5. Truncated mid-word
    """

    title: str = dspy.InputField(
        desc="The title to validate"
    )
    author: str = dspy.InputField(
        desc="Author username to check for contamination"
    )
    original_content: str = dspy.InputField(
        desc="Original content for context if title needs fixing"
    )
    platform: str = dspy.InputField(
        desc="Source platform for context"
    )

    is_valid: bool = dspy.OutputField(
        desc="True if title passes all quality checks"
    )
    issues: list[str] = dspy.OutputField(
        desc="List of detected issues (empty if valid)"
    )
    fixed_title: str = dspy.OutputField(
        desc="Corrected title (same as input if already valid)"
    )


class TitleModule(dspy.Module):
    """
    DSPy module combining extraction and validation.

    This module can be optimized with DSPy's compile() to improve
    prompt quality based on training examples.
    """

    def __init__(self):
        super().__init__()
        self.extractor = dspy.ChainOfThought(TitleExtractor)
        self.validator = dspy.ChainOfThought(TitleValidator)

    def forward(self, raw_content: str, author: str, platform: str):
        # Extract title
        extraction = self.extractor(
            raw_content=raw_content,
            author=author,
            platform=platform
        )

        # Validate and fix if needed
        validation = self.validator(
            title=extraction.title,
            author=author,
            original_content=raw_content,
            platform=platform
        )

        return dspy.Prediction(
            title=validation.fixed_title,
            is_valid=validation.is_valid,
            issues=validation.issues,
            confidence=extraction.confidence
        )

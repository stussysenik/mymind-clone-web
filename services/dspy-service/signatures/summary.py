"""
DSPy Signatures for Summary Generation and Validation

The key insight: summaries should be ANALYTICAL, not TRUNCATION.
A good summary explains WHY content is worth saving, not just WHAT it is.
"""

import dspy


class SummaryGenerator(dspy.Signature):
    """
    Generate an analytical summary that explains WHY content is memorable.

    BAD summary: "A post about travel"
    GOOD summary: "Detailed guide to Marrakech's hidden riads - covers booking tips,
                   neighborhood comparisons, and seasonal pricing strategies."

    The summary should:
    1. Explain the VALUE of the content
    2. Be 50-200 characters
    3. Use specific details, not generic descriptions
    4. Help the user remember WHY they saved this
    5. NEVER just truncate the original content
    """

    content: str = dspy.InputField(
        desc="The main content/caption/text to summarize"
    )
    platform: str = dspy.InputField(
        desc="Source platform: instagram, twitter, reddit"
    )
    author: str = dspy.InputField(
        desc="Content author for context"
    )
    image_count: int = dspy.InputField(
        desc="Number of images (for carousel context)"
    )
    title: str = dspy.InputField(
        desc="The extracted title for additional context"
    )

    summary: str = dspy.OutputField(
        desc="Analytical summary, 50-200 chars, explains VALUE not just content"
    )
    key_topics: list[str] = dspy.OutputField(
        desc="2-5 key topics/themes identified in the content"
    )
    content_type: str = dspy.OutputField(
        desc="Type: tutorial, opinion, news, entertainment, art, product, etc."
    )
    memorability_score: float = dspy.OutputField(
        desc="0-1 score for how memorable/valuable this content is"
    )


class SummaryValidator(dspy.Signature):
    """
    Validate that a summary is analytical, not just truncation.

    Detection criteria for BAD summaries:
    1. Starts with same words as original content (truncation)
    2. Contains generic phrases like "a post about", "content from"
    3. Too short (< 50 chars) or too long (> 300 chars)
    4. Lacks specific details or insights
    5. Doesn't explain WHY content is valuable
    """

    summary: str = dspy.InputField(
        desc="The summary to validate"
    )
    original_content: str = dspy.InputField(
        desc="Original content to detect truncation"
    )
    platform: str = dspy.InputField(
        desc="Source platform for context"
    )

    is_analytical: bool = dspy.OutputField(
        desc="True if summary provides insight, not just description"
    )
    is_truncation: bool = dspy.OutputField(
        desc="True if summary appears to be truncated original"
    )
    quality_score: float = dspy.OutputField(
        desc="0-1 overall quality score"
    )
    issues: list[str] = dspy.OutputField(
        desc="List of detected quality issues"
    )
    improved_summary: str = dspy.OutputField(
        desc="Improved version if original has issues"
    )


class PlatformSummaryPrompts:
    """
    Platform-specific prompt templates for better summary generation.
    These provide context about what makes content valuable on each platform.
    """

    INSTAGRAM = """
    Instagram content is typically visual-first. When summarizing:
    - Focus on the VISUAL STORY being told
    - Note if it's a carousel (multiple images tell a narrative)
    - Identify aesthetic qualities (minimalist, vibrant, documentary, etc.)
    - Capture the mood/vibe conveyed
    - If tutorial: what skill is being taught
    - If product: what problem does it solve

    The caption often adds context to the visual - synthesize both.
    """

    TWITTER = """
    Twitter/X content is idea-first. When summarizing:
    - Capture the CORE ARGUMENT or insight
    - Note if it's a hot take, news, thread, or conversation
    - Identify the perspective/stance being taken
    - For threads: what's the overall narrative arc
    - What makes this tweet worth revisiting

    Focus on the intellectual value, not just the topic.
    """

    REDDIT = """
    Reddit content is community-driven. When summarizing:
    - Note the subreddit context (what community)
    - Capture the key information or discussion point
    - For questions: what's being asked and why it matters
    - For stories: what's the core narrative
    - For discussions: what are the main perspectives

    Reddit posts often contain valuable niche information.
    """


class SummaryModule(dspy.Module):
    """
    DSPy module for summary generation with validation.

    Can be optimized with DSPy's compile() using examples of good summaries.
    """

    def __init__(self):
        super().__init__()
        self.generator = dspy.ChainOfThought(SummaryGenerator)
        self.validator = dspy.ChainOfThought(SummaryValidator)

    def forward(
        self,
        content: str,
        platform: str,
        author: str = "",
        image_count: int = 1,
        title: str = ""
    ):
        # Generate summary
        generation = self.generator(
            content=content,
            platform=platform,
            author=author,
            image_count=image_count,
            title=title
        )

        # Validate quality
        validation = self.validator(
            summary=generation.summary,
            original_content=content,
            platform=platform
        )

        # Use improved version if original had issues
        final_summary = (
            validation.improved_summary
            if not validation.is_analytical or validation.is_truncation
            else generation.summary
        )

        return dspy.Prediction(
            summary=final_summary,
            key_topics=generation.key_topics,
            content_type=generation.content_type,
            memorability_score=generation.memorability_score,
            quality_score=validation.quality_score,
            is_analytical=validation.is_analytical,
            issues=validation.issues
        )

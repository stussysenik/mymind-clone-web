"""
Platform-Specific DSPy Signatures

Unified signatures that combine title, summary, and asset extraction
with platform-specific knowledge baked in.
"""

import dspy
from typing import Optional


class InstagramSignature(dspy.Signature):
    """
    Complete Instagram content extraction.

    Instagram-specific knowledge:
    - Captions often start with username (BUG: must remove)
    - Carousels have edge_sidecar_to_children in JSON
    - display_url is full resolution, display_resources has sizes
    - Reels have video_url in addition to thumbnail
    - Hashtags are significant for discovery context
    - @mentions indicate collaborations

    Input is raw scraped data, output is clean structured content.
    """

    raw_html: str = dspy.InputField(
        desc="Raw HTML from Instagram embed or page"
    )
    raw_caption: str = dspy.InputField(
        desc="Raw caption text (may contain username prefix)"
    )
    detected_author: str = dspy.InputField(
        desc="Username extracted from page (to remove from caption)"
    )
    url: str = dspy.InputField(
        desc="Original Instagram URL"
    )

    # Title outputs
    title: str = dspy.OutputField(
        desc="Clean title (caption without username), 20-80 chars"
    )
    author: str = dspy.OutputField(
        desc="Confirmed @username"
    )

    # Summary outputs
    summary: str = dspy.OutputField(
        desc="Analytical summary explaining WHY this is worth saving"
    )
    content_type: str = dspy.OutputField(
        desc="photo, carousel, reel, story, or igtv"
    )

    # Asset outputs
    images: list[str] = dspy.OutputField(
        desc="List of full-resolution image URLs"
    )
    video_url: Optional[str] = dspy.OutputField(
        desc="Video URL if this is a reel/video"
    )
    thumbnail_url: str = dspy.OutputField(
        desc="Best thumbnail for preview"
    )

    # Metadata
    hashtags: list[str] = dspy.OutputField(
        desc="Extracted hashtags"
    )
    mentions: list[str] = dspy.OutputField(
        desc="Extracted @mentions"
    )
    confidence: float = dspy.OutputField(
        desc="Overall extraction confidence 0-1"
    )


class TwitterSignature(dspy.Signature):
    """
    Complete Twitter/X content extraction.

    Twitter-specific knowledge:
    - Tweet text is the primary content
    - Author format: "Display Name (@handle)"
    - Media can be images, GIFs, or video
    - Threads need special handling (multiple tweets)
    - Quote tweets embed another tweet
    - Syndication API returns clean JSON

    Focus on extracting the INSIGHT, not just the text.
    """

    tweet_json: str = dspy.InputField(
        desc="JSON from Twitter syndication API"
    )
    raw_html: str = dspy.InputField(
        desc="Fallback: raw HTML if JSON unavailable"
    )
    url: str = dspy.InputField(
        desc="Original tweet URL"
    )

    # Title outputs
    title: str = dspy.OutputField(
        desc="Tweet text formatted as title (author: 'text...')"
    )
    author_name: str = dspy.OutputField(
        desc="Display name"
    )
    author_handle: str = dspy.OutputField(
        desc="@handle without @"
    )

    # Summary outputs
    summary: str = dspy.OutputField(
        desc="What INSIGHT or value does this tweet provide"
    )
    is_thread: bool = dspy.OutputField(
        desc="True if this is part of a thread"
    )
    thread_position: Optional[int] = dspy.OutputField(
        desc="Position in thread if applicable"
    )

    # Asset outputs
    images: list[str] = dspy.OutputField(
        desc="Media image URLs (use :orig for full quality)"
    )
    video_url: Optional[str] = dspy.OutputField(
        desc="Video URL if present"
    )
    gif_url: Optional[str] = dspy.OutputField(
        desc="GIF URL if present"
    )

    # Metadata
    hashtags: list[str] = dspy.OutputField(
        desc="Extracted #hashtags"
    )
    mentions: list[str] = dspy.OutputField(
        desc="Extracted @mentions"
    )
    links: list[str] = dspy.OutputField(
        desc="Expanded URLs from tweet"
    )
    engagement: dict = dspy.OutputField(
        desc="{likes, retweets, replies} counts"
    )
    confidence: float = dspy.OutputField(
        desc="Overall extraction confidence 0-1"
    )


class RedditSignature(dspy.Signature):
    """
    Complete Reddit content extraction.

    Reddit-specific knowledge:
    - Posts have title (user-provided) and selftext (body)
    - Subreddit provides crucial context
    - Can be text, link, image, video, or gallery
    - Galleries have multiple images
    - Comments are valuable context (top comments)
    - Crosspost shows original source

    Focus on the INFORMATION or DISCUSSION value.
    """

    json_data: str = dspy.InputField(
        desc="JSON from Reddit API or scrape"
    )
    raw_html: str = dspy.InputField(
        desc="Fallback: raw HTML"
    )
    url: str = dspy.InputField(
        desc="Original Reddit URL"
    )

    # Title outputs (Reddit has explicit titles)
    title: str = dspy.OutputField(
        desc="Original post title (usually good as-is)"
    )
    author: str = dspy.OutputField(
        desc="u/username"
    )
    subreddit: str = dspy.OutputField(
        desc="r/subreddit"
    )

    # Summary outputs
    summary: str = dspy.OutputField(
        desc="What value does this post provide"
    )
    post_type: str = dspy.OutputField(
        desc="text, link, image, video, gallery, or crosspost"
    )

    # Content
    selftext: str = dspy.OutputField(
        desc="Post body text (for text posts)"
    )
    external_link: Optional[str] = dspy.OutputField(
        desc="Linked URL (for link posts)"
    )

    # Asset outputs
    images: list[str] = dspy.OutputField(
        desc="Image URLs (gallery or single)"
    )
    video_url: Optional[str] = dspy.OutputField(
        desc="Video URL if present"
    )
    thumbnail_url: str = dspy.OutputField(
        desc="Thumbnail for preview"
    )

    # Metadata
    score: int = dspy.OutputField(
        desc="Upvote score"
    )
    num_comments: int = dspy.OutputField(
        desc="Comment count"
    )
    flair: Optional[str] = dspy.OutputField(
        desc="Post flair if any"
    )
    is_nsfw: bool = dspy.OutputField(
        desc="NSFW flag"
    )
    confidence: float = dspy.OutputField(
        desc="Overall extraction confidence 0-1"
    )


class UnifiedContentModule(dspy.Module):
    """
    Unified module that routes to platform-specific extraction.

    This is the main entry point for the DSPy service.
    DSPy will optimize each platform's extraction independently.
    """

    def __init__(self):
        super().__init__()
        self.instagram = dspy.ChainOfThought(InstagramSignature)
        self.twitter = dspy.ChainOfThought(TwitterSignature)
        self.reddit = dspy.ChainOfThought(RedditSignature)

    def forward(self, platform: str, **kwargs):
        if platform == "instagram":
            return self.instagram(**kwargs)
        elif platform in ("twitter", "x"):
            return self.twitter(**kwargs)
        elif platform == "reddit":
            return self.reddit(**kwargs)
        else:
            raise ValueError(f"Unsupported platform: {platform}")

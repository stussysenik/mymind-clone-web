# Content Scraping Specification Delta

## MODIFIED Requirements

### Requirement: Letterboxd Image Extraction
The Letterboxd scraper SHALL extract the actual movie poster image, not the Open Graph screenshot.

Image extraction priority:
1. `div.film-poster img` selector (actual poster)
2. JSON-LD structured data `movie.image`
3. Open Graph `og:image` (fallback only)

#### Scenario: Letterboxd poster extraction
- **WHEN** scraping a Letterboxd film page (e.g., letterboxd.com/film/kpop-demon-hunters/)
- **THEN** the `imageUrl` returned is the movie poster from `div.film-poster img`
- **AND** NOT the full-page OG screenshot

#### Scenario: Poster URL upgrade
- **WHEN** poster URL contains size pattern like `-0-230-0-345-crop.jpg`
- **THEN** upgrade to larger size `-0-1000-0-1500-crop.jpg`

#### Scenario: Fallback to OG image
- **WHEN** `div.film-poster img` is not found
- **AND** JSON-LD movie.image is not available
- **THEN** fall back to `og:image` as last resort

### Requirement: IMDB Color Extraction
The IMDB scraper SHALL extract dominant colors from movie posters using KMeans clustering.

#### Scenario: Color extraction from IMDB poster
- **WHEN** scraping an IMDB title page
- **THEN** extract 3-5 dominant colors from the poster image
- **AND** store in `metadata.colors` array

#### Scenario: Colors applied to MovieCard
- **WHEN** a MovieCard is rendered with `metadata.colors` available
- **THEN** the card styling incorporates the dominant color

## Error Type
Runtime Error

## Error Message
Invalid src prop (https://static01.nyt.com/newsgraphics/images/icons/defaultPromoCrop.png) on `next/image`, hostname "static01.nyt.com" is not configured under images in your `next.config.js`
See more info: https://nextjs.org/docs/messages/next-image-unconfigured-host


    at renderVisual (components/Card.tsx:108:41)
    at GenericCard (components/Card.tsx:192:26)
    at Card (components/Card.tsx:76:32)
    at <unknown> (components/CardGridClient.tsx:244:57)
    at Array.map (<anonymous>:null:null)
    at CardGridClient (components/CardGridClient.tsx:242:54)
    at CardGrid (components/CardGrid.tsx:52:16)
    at HomePage (app/page.tsx:79:13)

## Code Frame
  106 |                         return (
  107 |                                 <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
> 108 |                                         <Image
      |                                         ^
  109 |                                                 src={card.imageUrl}
  110 |                                                 alt={card.title || 'Card image'}
  111 |                                                 fill

Next.js version: 16.1.1 (Turbopack)

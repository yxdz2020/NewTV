import { NextRequest, NextResponse } from 'next/server';

// This route acts as a reverse proxy to YouTube to bypass X-Frame-Options.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  // Join the slug array to form the path, or use an empty string if it's the root.
  const path = params.slug ? params.slug.join('/') : '';
  // Construct the full YouTube URL, including search parameters.
  const youtubeUrl = `https://www.youtube.com/${path}${req.nextUrl.search}`;

  // Fetch from YouTube. We pass along the user-agent.
  const ytResponse = await fetch(youtubeUrl, {
    headers: {
      'User-Agent': req.headers.get('User-Agent') || '',
    },
    // We don't want to follow redirects automatically on the server.
    // The browser inside the iframe should handle them.
    redirect: 'manual',
  });

  // Create a new Headers object from the YouTube response.
  const headers = new Headers(ytResponse.headers);

  // CRITICAL: Remove headers that prevent embedding.
  headers.delete('X-Frame-Options');
  headers.delete('Content-Security-Policy');

  // The body from the fetch response is a ReadableStream.
  const body = ytResponse.body;

  // Return a new response, streaming the body from YouTube,
  // with our modified headers.
  return new NextResponse(body, {
    status: ytResponse.status,
    statusText: ytResponse.statusText,
    headers,
  });
}

// We also need to handle POST requests for things like search suggestions, login, etc.
export async function POST(
    req: NextRequest,
    { params }: { params: { slug: string[] } }
) {
    const path = params.slug ? params.slug.join('/') : '';
    const youtubeUrl = `https://www.youtube.com/${path}${req.nextUrl.search}`;

    const ytResponse = await fetch(youtubeUrl, {
        method: 'POST',
        headers: {
            'User-Agent': req.headers.get('User-Agent') || '',
            'Content-Type': req.headers.get('Content-Type') || 'application/json',
        },
        body: req.body,
        redirect: 'manual',
    });

    const headers = new Headers(ytResponse.headers);
    headers.delete('X-Frame-Options');
    headers.delete('Content-Security-Policy');

    return new NextResponse(ytResponse.body, {
        status: ytResponse.status,
        statusText: ytResponse.statusText,
        headers,
    });
}
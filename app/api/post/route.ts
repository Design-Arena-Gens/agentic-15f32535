import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const {
      accessToken,
      pageId,
      instagramAccountId,
      content,
      platforms,
      imageUrl,
    } = await request.json();

    if (!accessToken || !pageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results: any = {
      facebook: null,
      instagram: null,
    };

    // Post to Facebook
    if (platforms.includes('facebook')) {
      try {
        const fbEndpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
        const fbParams: any = {
          message: content,
          access_token: accessToken,
        };

        if (imageUrl) {
          fbParams.link = imageUrl;
        }

        const fbResponse = await axios.post(fbEndpoint, null, { params: fbParams });
        results.facebook = {
          success: true,
          postId: fbResponse.data.id,
        };
      } catch (error: any) {
        results.facebook = {
          success: false,
          error: error.response?.data?.error?.message || error.message,
        };
      }
    }

    // Post to Instagram
    if (platforms.includes('instagram') && instagramAccountId) {
      try {
        if (!imageUrl) {
          results.instagram = {
            success: false,
            error: 'Instagram posts require an image URL',
          };
        } else {
          // Step 1: Create container
          const containerEndpoint = `https://graph.facebook.com/v18.0/${instagramAccountId}/media`;
          const containerParams = {
            image_url: imageUrl,
            caption: content,
            access_token: accessToken,
          };

          const containerResponse = await axios.post(containerEndpoint, null, {
            params: containerParams,
          });
          const containerId = containerResponse.data.id;

          // Step 2: Publish container
          const publishEndpoint = `https://graph.facebook.com/v18.0/${instagramAccountId}/media_publish`;
          const publishParams = {
            creation_id: containerId,
            access_token: accessToken,
          };

          const publishResponse = await axios.post(publishEndpoint, null, {
            params: publishParams,
          });

          results.instagram = {
            success: true,
            postId: publishResponse.data.id,
          };
        }
      } catch (error: any) {
        results.instagram = {
          success: false,
          error: error.response?.data?.error?.message || error.message,
        };
      }
    }

    const hasSuccess = results.facebook?.success || results.instagram?.success;
    const hasFailure = results.facebook?.success === false || results.instagram?.success === false;

    if (hasSuccess && !hasFailure) {
      return NextResponse.json({
        success: true,
        message: 'Post published successfully',
        results,
      });
    } else if (hasSuccess && hasFailure) {
      return NextResponse.json({
        success: true,
        message: 'Post partially published',
        results,
      }, { status: 207 });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to publish post',
        results,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error publishing post:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

'use client';

import { useState } from 'react';
import { format } from 'date-fns';

interface ScheduledPost {
  id: string;
  content: string;
  platform: string[];
  scheduledTime: string;
  status: 'scheduled' | 'posted' | 'failed';
  imageUrl?: string;
}

export default function Home() {
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [scheduleTime, setScheduleTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePostNow = async () => {
    if (!postContent.trim()) {
      showMessage('error', 'Please enter post content');
      return;
    }

    if (!accessToken || !pageId) {
      showMessage('error', 'Please configure your Meta access token and page ID');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken,
          pageId,
          instagramAccountId,
          content: postContent,
          platforms: selectedPlatforms,
          imageUrl: imageUrl || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('success', 'Post published successfully!');
        setPostContent('');
        setImageUrl('');
      } else {
        showMessage('error', data.error || 'Failed to publish post');
      }
    } catch (error) {
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchedule = () => {
    if (!postContent.trim() || !scheduleTime) {
      showMessage('error', 'Please enter post content and schedule time');
      return;
    }

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      content: postContent,
      platform: selectedPlatforms,
      scheduledTime: scheduleTime,
      status: 'scheduled',
      imageUrl: imageUrl || undefined,
    };

    setScheduledPosts(prev => [...prev, newPost]);
    showMessage('success', 'Post scheduled successfully!');
    setPostContent('');
    setImageUrl('');
    setScheduleTime('');
  };

  const deleteScheduledPost = (id: string) => {
    setScheduledPosts(prev => prev.filter(post => post.id !== id));
    showMessage('success', 'Scheduled post deleted');
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Meta Post Automation</h1>
          <p className="text-gray-600">Automate and schedule your Facebook and Instagram posts</p>
        </header>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Configuration</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Access Token
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your Meta access token"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get from <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Meta Graph API Explorer</a>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your Facebook page ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={instagramAccountId}
                    onChange={(e) => setInstagramAccountId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter Instagram business account ID"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Post</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Content
                  </label>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's on your mind?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platforms
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes('facebook')}
                        onChange={() => handlePlatformToggle('facebook')}
                        className="mr-2 w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Facebook</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes('instagram')}
                        onChange={() => handlePlatformToggle('instagram')}
                        className="mr-2 w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700">Instagram</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handlePostNow}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Posting...' : 'Post Now'}
                  </button>
                  <button
                    onClick={handleSchedule}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Schedule Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Scheduled Posts</h2>

              {scheduledPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No scheduled posts yet</p>
              ) : (
                <div className="space-y-4">
                  {scheduledPosts.map(post => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          {post.platform.map(p => (
                            <span
                              key={p}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => deleteScheduledPost(post.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-gray-700 text-sm mb-2 line-clamp-3">{post.content}</p>
                      {post.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={post.imageUrl}
                            alt="Post preview"
                            className="w-full h-32 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {format(new Date(post.scheduledTime), 'MMM dd, yyyy HH:mm')}
                        </span>
                        <span className={`px-2 py-1 rounded ${
                          post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          post.status === 'posted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Create a Meta App at <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
                <li>Add Facebook Login and Instagram Graph API products</li>
                <li>Generate an access token with pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish permissions</li>
                <li>Get your Facebook Page ID from Page Settings</li>
                <li>Get Instagram Business Account ID from Graph API Explorer</li>
                <li>Enter credentials above and start posting!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

class DynamicLinkService {
  static async createPostLink(postId) {
    return `https://sluglime.com/posts/${postId}`;
  }

  static async createPostLinkWithFallback(postId) {
    return `https://sluglime.com/posts/${postId}`;
  }
}

module.exports = DynamicLinkService;

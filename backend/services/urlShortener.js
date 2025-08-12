class UrlShortener {
  static generateShortId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static createShortUrl(postId) {
    const shortId = this.generateShortId();
    return `https://sl.gl/p/${shortId}`;
  }

  static createPostUrl(postId) {
    return `https://sl.gl/p/${postId}`;
  }
}

module.exports = UrlShortener;

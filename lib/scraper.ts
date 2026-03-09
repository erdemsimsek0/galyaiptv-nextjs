export async function getIPTVInfo() {
  return {
    url: 'http://panel.galyaiptv.com.tr:8080',
    username: `galya_${Math.random().toString(36).slice(2, 8)}`,
    password: Math.random().toString(36).slice(2, 10).toUpperCase(),
  };
}

export function escapeRegex(text: string): string {
  try {
    return text.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
  } catch (err) {
    console.error('escapeRegex error:', err);
    throw new Error('Regex escape failed');
  }
}

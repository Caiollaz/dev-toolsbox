export function encodeBase64(input: string): string {
  try {
    return btoa(
      encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16)),
      ),
    );
  } catch {
    throw new Error('Failed to encode: invalid input');
  }
}

export function decodeBase64(input: string): string {
  try {
    return decodeURIComponent(
      Array.from(atob(input.trim()))
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    throw new Error('Failed to decode: invalid Base64 string');
  }
}

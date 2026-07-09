(() => {
  async function hashClueText() {
    try {
      const response = await fetch('./clue.txt', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`clue.txt request failed with ${response.status}`);
      }

      const text = await response.text();
      const encoded = new TextEncoder().encode(text);
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');

      console.log(`clue.txt SHA-256: ${hashHex}`);
      return hashHex;
    } catch (error) {
      console.error('failed to hash clue.txt', error);
      return null;
    }
  }

  window.addEventListener('answerCorrect', () => {
    hashClueText();
  });
})();
